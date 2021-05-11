"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "new",
        salary: 50000,
        equity: "0.2",
        companyHandle: 'c3'
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
        expect(result.rows).toEqual([
            {
                title: "new",
                salary: 50000,
                equity: "0.2",
                company_handle: 'c3'

            },
        ]);
    });

    test("bad request with changing company", async function () {
        const badJob = {
            title: "new",
            salary: 50000,
            equity: '0.20',
            companyHandle: 'd3'
        };
        try {
            await Job.create(badJob);

            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                title: "job1",
                salary: 20000,
                equity: "0.25",
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: "job2",
                salary: 40000,
                equity: "0.40",
                companyHandle: 'c1'
            },
            {
                id: expect.any(Number),
                title: "job3",
                salary: 75000,
                equity: "0.60",
                companyHandle: 'c2'
            },
        ]);
    });
});

/************************************** filterBy */

// describe("filterBy", function () {
//     test("works: with name filter", async function () {
//         let filtered = { "name": "3" };
//         let companies = await Company.filterBy(filtered);
//         expect(companies).toEqual([
//             {
//                 handle: "c3",
//                 name: "C3",
//                 description: "Desc3",
//                 numEmployees: 3,
//                 logoUrl: "http://c3.img",
//             },
//         ]);
//     });
//     test("works: with name & num_employees filter", async function () {
//         let filtered = { "name": "c", "maxEmployees": 2 };
//         let companies = await Company.filterBy(filtered);
//         expect(companies).toEqual([
//             {
//                 handle: "c1",
//                 name: "C1",
//                 description: "Desc1",
//                 numEmployees: 1,
//                 logoUrl: "http://c1.img",
//             },
//             {
//                 handle: "c2",
//                 name: "C2",
//                 description: "Desc2",
//                 numEmployees: 2,
//                 logoUrl: "http://c2.img",
//             }
//         ]);
//     });
//     test("works: with num_employees filters", async function () {
//         let filtered = { "maxEmployees": 2, "minEmployees": 1 };
//         let companies = await Company.filterBy(filtered);
//         expect(companies).toEqual([
//             {
//                 handle: "c1",
//                 name: "C1",
//                 description: "Desc1",
//                 numEmployees: 1,
//                 logoUrl: "http://c1.img",
//             },
//             {
//                 handle: "c2",
//                 name: "C2",
//                 description: "Desc2",
//                 numEmployees: 2,
//                 logoUrl: "http://c2.img",
//             }
//         ]);
//     });
//     test("works: throws error if min is greater than max employees", async function () {
//         try {
//             let filtered = { "maxEmployees": 1, "minEmployees": 2 };
//             await Company.filterBy(filtered);
//             fail();
//         } catch (err) {
//             expect(err instanceof BadRequestError).toBeTruthy();
//         }
//     });
// });


/************************************** get */

describe("get", function () {
    test("works", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        let job = await Job.get(result.rows[0].id);
        expect(job).toEqual({
            id: result.rows[0].id,
            title: "job1",
            salary: 20000,
            equity: "0.25",
            companyHandle: 'c1'
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(212);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "jobNew",
        salary: 10000,
        equity: '0.30',
    };

    test("works", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        let job = await Job.update(result.rows[0].id, updateData);
        expect(job).toEqual({
            id: result.rows[0].id,
            ...updateData,
            companyHandle: 'c1'
        });

        const results = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${result.rows[0].id}`);
        expect(results.rows).toEqual([{
            id: result.rows[0].id,
            title: "jobNew",
            salary: 10000,
            equity: "0.30",
            company_handle: 'c1'
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            salary: null
        };
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        let job = await Job.update(result.rows[0].id, updateDataSetNulls);
        expect(job).toEqual({
            id: result.rows[0].id,
            title: "job1",
            salary: null,
            equity: "0.25",
            companyHandle: 'c1'
        });

        const results = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${result.rows[0].id}`);
        expect(results.rows).toEqual([{
            id: result.rows[0].id,
            title: "job1",
            salary: null,
            equity: "0.25",
            company_handle: 'c1'
        }]);
    });

    test("not found if job doesnt exist", async function () {
        try {
            await Job.update(212, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
            await Job.update(result.rows[0].id, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        await Job.remove(result.rows[0].id);
        const res = await db.query(
            `SELECT id FROM jobs WHERE id=${result.rows[0].id}`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(245);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
