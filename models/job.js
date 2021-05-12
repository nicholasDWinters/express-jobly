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


    // /** Filter jobs by the included query terms. If filtering by title, search is case-insensitive and will find all jobs similar to that title. 
    //  * minSalary finds jobs that pay at least that salary, and hasEquity limits search to jobs with equity greater than 0
    //  * 
    //  * Returns [{ id, title, salary, equity, company_handle }, ...]
    //  * 
    //  * */
    static async filterBy(term) {


        let filters = {
            title: term.title || null,
            minSalary: term.minSalary || 0,
            hasEquity: Boolean(term.hasEquity) || false
        };
        if (filters.title !== null) {
            filters.title = '%' + filters.title + '%';
        }

        if ((term.title && filters.hasEquity === true)) {
            const jobs = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title ILIKE $1 AND equity > 0 AND salary >= $2`, [filters.title, filters.minSalary]);
            return jobs.rows;

        } else if (term.title) {
            const jobs = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE title ILIKE $1 AND salary >= $2`, [filters.title, filters.minSalary]);
            return jobs.rows;

        } else if (filters.hasEquity === true) {
            const jobs = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE equity > 0 AND salary >= $1`, [filters.minSalary]);
            return jobs.rows;

        } else {
            const jobs = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE salary >= $1`, [filters.minSalary]);
            return jobs.rows;
        }
    }



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