"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");
const db = require('../db');
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const Job = require("../models/job");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login, admin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    if (req.query.name || req.query.minEmployees || req.query.maxEmployees) {
      let companies = await Company.filterBy(req.query);
      return res.json({ companies });

    } else if (Object.keys(req.query).length > 0) {
      throw new BadRequestError('Query must contain name, minEmployees, or maxEmployees.');

    } else {
      const companies = await Company.findAll();
      return res.json({ companies });
    }

  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const result = await Company.get(req.params.handle);

    let company = {
      handle: result[0].handle,
      name: result[0].name,
      description: result[0].description,
      numEmployees: result[0].numEmployees,
      logoUrl: result[0].logoUrl,
      jobs: []
    }
    if (result[0].id !== null) {
      for (let row of result) {
        company.jobs.push({
          id: row.id,
          title: row.title,
          salary: row.salary,
          equity: row.equity
        })
      }
    }

    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login, admin
 */

router.patch("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
