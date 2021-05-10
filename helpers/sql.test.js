const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require('../expressError');

describe("sqlForPartialUpdate", function () {

    test("works as expected", function () {
        const data = { firstName: 'Aliya', age: 32 };
        const format = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        expect(sqlForPartialUpdate(data, format)).toEqual({
            "setCols": '"first_name"=$1, "age"=$2',
            "values": ["Aliya", 32]

        });
    });
    test("fails with no data object provided", function () {
        const otherData = false;
        const format = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        expect(() => {
            sqlForPartialUpdate(otherData, format);
        }).toThrowError(BadRequestError);
    });



});