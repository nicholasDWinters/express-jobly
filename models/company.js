"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }


  /** Filter companies by the included query terms. If filtering by name, search is case-insensitive and will find all companies similar to that name. 
   * minEmployees finds companies that have more than the queried number, maxEmployees finds companies with less than that number of employees.
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * 
   * */
  static async filterBy(term) {


    let filters = {
      name: term.name || null,
      minEmployees: term.minEmployees || 0,
      maxEmployees: term.maxEmployees || 10000000
    };
    if (filters.name !== null) {
      filters.name = '%' + filters.name + '%';
    }
    if (filters.minEmployees > filters.maxEmployees) throw new BadRequestError('Min employees cannot be greater than max employees.');


    if ((term.name && term.maxEmployees) || (term.name && term.minEmployees)) {
      const companies = await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name ILIKE $1 AND num_employees BETWEEN $2 AND $3`, [filters.name, filters.minEmployees, filters.maxEmployees]);
      return companies.rows;

    } else if (term.name) {
      const companies = await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name ILIKE $1`, [filters.name]);
      return companies.rows;

    } else {
      const companies = await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE num_employees BETWEEN $1 AND $2`, [filters.minEmployees, filters.maxEmployees]);
      return companies.rows;
    }
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const res = await db.query(`SELECT handle FROM companies WHERE handle = $1`, [handle]);
    if (!res.rows[0]) throw new NotFoundError(`No company: ${handle}`);

    const companyRes = await db.query(
      `SELECT c.handle, c.name, c.description, c.num_employees AS "numEmployees", c.logo_url AS "logoUrl", j.id, j.title, j.salary, j
      .equity FROM companies c LEFT JOIN jobs j ON c.handle = j.company_handle WHERE handle = $1`,
      [handle]);


    const company = companyRes.rows;



    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
