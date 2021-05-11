"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * Throws Bad Request Error if company handle does not exist
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const companyCheck = await db.query(
            `SELECT handle
                 FROM companies
                 WHERE handle = $1`,
            [companyHandle]);

        if (companyCheck.rows.length === 0) throw new BadRequestError(`Company does not exist: ${companyHandle}`);

        const result = await db.query(
            `INSERT INTO jobs
             (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING title, salary, equity, company_handle AS "companyHandle"`,
            [
                title, salary, equity, companyHandle
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ id, title, salary, equity, company_handle }, ...]
     * */

    static async findAll() {
        const jobsRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             ORDER BY id`);
        return jobsRes.rows;
    }


    // /** Filter companies by the included query terms. If filtering by name, search is case-insensitive and will find all companies similar to that name. 
    //  * minEmployees finds companies that have more than the queried number, maxEmployees finds companies with less than that number of employees.
    //  * 
    //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
    //  * 
    //  * */
    // static async filterBy(term) {


    //     let filters = {
    //         name: term.name || null,
    //         minEmployees: term.minEmployees || 0,
    //         maxEmployees: term.maxEmployees || 10000000
    //     };
    //     if (filters.name !== null) {
    //         filters.name = '%' + filters.name + '%';
    //     }
    //     if (filters.minEmployees > filters.maxEmployees) throw new BadRequestError('Min employees cannot be greater than max employees.');


    //     if ((term.name && term.maxEmployees) || (term.name && term.minEmployees)) {
    //         const companies = await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name ILIKE $1 AND num_employees BETWEEN $2 AND $3`, [filters.name, filters.minEmployees, filters.maxEmployees]);
    //         return companies.rows;

    //     } else if (term.name) {
    //         const companies = await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE name ILIKE $1`, [filters.name]);
    //         return companies.rows;

    //     } else {
    //         const companies = await db.query(`SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl" FROM companies WHERE num_employees BETWEEN $1 AND $2`, [filters.minEmployees, filters.maxEmployees]);
    //         return companies.rows;
    //     }
    // }



    /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, company_handle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {});

        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);
    }
}


module.exports = Job;