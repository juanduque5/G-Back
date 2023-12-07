const express = require("express");
const authController = require("../Controllers/auth");
const { body } = require("express-validator");
const User = require("../Models/user");

const router = express.Router();

//Sign up POST API ROUTER
router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom(async (value) => {
        const userRes = await User.findByEmail(value);
        if (userRes) {
          return Promise.reject("Email already exists");
        }
      })
      .normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters"),
    body("name").trim().not().isEmpty().withMessage("Name is empty"),
  ],
  authController.postSignup
);

//Login POST API ROUTER
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters"),
  ],
  authController.postLogin
);

module.exports = router;
