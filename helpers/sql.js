const { BadRequestError } = require("../expressError");

// FUNCTION TAKES TWO ARGUMENTS: THE DATA, AND AN OBJECT CHANGING THE NAMING OF A FEW VARIABLES TO MATCH WHAT OUR DATABASE VALUES ARE STORED AS (FOR EXAMPLE, CHANGING firstName to first_name). TAKES THE KEYS FROM THE DATA, RETURNS AN ERROR IF NO KEYS. MAPS THE KEYS TO CREATE AN SQL LINE LIKE 'first_name = $1' SO WE CAN USE THAT IN OUR QUERY. THE RETURN STATEMENT JOINS OUR COLS ARRAY WITH A COMMA, SO WE CAN PASS THIS EASIER TO SQL QUERIES, AND ALSO RETURNS OUR VALUES SO WE CAN EASILY SET THEM TO QUERY PARAMETERS ($1, $2)

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
