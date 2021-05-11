"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u3Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "newJob",
        salary: 10000,
        equity: 0.20,
        companyHandle: 'c1'
    };

    test("ok for admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {

                title: "newJob",
                salary: 10000,
                equity: "0.2",
                companyHandle: 'c1'
            }
        });
    });

    test("fails for regular users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);

    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: 'jobNew',
                salary: 20000
            })
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "newJob",
                salary: "10000",
                equity: 0.20,
                companyHandle: true
            })
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: expect.any(Number),
                        title: 'job1',
                        salary: 20000,
                        equity: "0.2",
                        companyHandle: 'c1'
                    },
                    {
                        id: expect.any(Number),
                        title: 'job2',
                        salary: 40000,
                        equity: "0.4",
                        companyHandle: 'c1'
                    },
                    {
                        id: expect.any(Number),
                        title: 'job3',
                        salary: 60000,
                        equity: "0.6",
                        companyHandle: 'c3'
                    },
                ],
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});


/************************************** GET /companies with filters */

// describe("GET /companies with filters", function () {
//     test("filters by name correctly", async function () {
//         const resp = await request(app).get("/companies?name=1");
//         expect(resp.body).toEqual({
//             companies:
//                 [
//                     {
//                         handle: "c1",
//                         name: "C1",
//                         description: "Desc1",
//                         numEmployees: 1,
//                         logoUrl: "http://c1.img",
//                     }
//                 ]
//         });
//     });
//     test("filters by name and min employees correctly", async function () {
//         const resp = await request(app).get("/companies?name=c&minEmployees=2");
//         expect(resp.body).toEqual({
//             companies:
//                 [
//                     {
//                         handle: "c2",
//                         name: "C2",
//                         description: "Desc2",
//                         numEmployees: 2,
//                         logoUrl: "http://c2.img",
//                     },
//                     {
//                         handle: "c3",
//                         name: "C3",
//                         description: "Desc3",
//                         numEmployees: 3,
//                         logoUrl: "http://c3.img",
//                     }
//                 ]
//         });
//     });
//     test("filters by max employees correctly", async function () {
//         const resp = await request(app).get("/companies?maxEmployees=1");
//         expect(resp.body).toEqual({
//             companies:
//                 [
//                     {
//                         handle: "c1",
//                         name: "C1",
//                         description: "Desc1",
//                         numEmployees: 1,
//                         logoUrl: "http://c1.img",
//                     }
//                 ]
//         });
//     });
//     test("throws error if query string is present but does not include correct terminology", async function () {
//         const resp = await request(app).get("/companies?fake=blah");
//         expect(resp.statusCode).toEqual(400);
//     });
// });


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        const resp = await request(app).get(`/jobs/${result.rows[0].id}`);
        expect(resp.body).toEqual({
            job: {
                id: result.rows[0].id,
                title: 'job1',
                salary: 20000,
                equity: "0.2",
                companyHandle: 'c1'
            },
        });
    });


    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/245`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {

    test("works for admins", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        const resp = await request(app)
            .patch(`/jobs/${result.rows[0].id}`)
            .send({
                title: 'newJob'
            })
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: 'newJob',
                salary: 20000,
                equity: "0.2",
                companyHandle: 'c1'
            },
        });
    });

    test("fails for regular users", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        const resp = await request(app)
            .patch(`/jobs/${result.rows[0].id}`)
            .send({
                title: "newJob"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        const resp = await request(app)
            .patch(`/jobs/${result.rows[0].id}`)
            .send({
                title: "newJob"
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/250`)
            .send({
                title: "newJob",
            })
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on handle change attempt", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        const resp = await request(app)
            .patch(`/jobs/${result.rows[0].id}`)
            .send({
                companyHandle: 'newCompany',
            })
            .set("authorization", `Bearer ${u3Token}`);

        expect(resp.statusCode).toEqual(500);
    });

    test("bad request on invalid data", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);
        const resp = await request(app)
            .patch(`/jobs/${result.rows[0].id}`)
            .send({
                salary: "not-a-number",
            })
            .set("authorization", `Bearer ${u3Token}`);

        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for admins", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);

        const resp = await request(app)
            .delete(`/jobs/${result.rows[0].id}`)
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.body).toEqual({ deleted: `${result.rows[0].id}` });
    });
    test("fails for regular users", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);

        const resp = await request(app)
            .delete(`/jobs/${result.rows[0].id}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = 'job1'`);

        const resp = await request(app)
            .delete(`/jobs/${result.rows[0].id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {

        const resp = await request(app)
            .delete(`/jobs/250`)
            .set("authorization", `Bearer ${u3Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
