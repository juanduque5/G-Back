const express = require("express");
const properController = require("../Controllers/vacations");
const { body } = require("express-validator");

// const User = require("../Models/user");
// const isAuth = require("../middleware/isAuth");

const router = express.Router();

router.get("/searchProperty", properController.getSearchProperty);

module.exports = router;
