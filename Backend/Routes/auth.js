const express = require("express");
const authController = require("../Controllers/auth");
const { body } = require("express-validator");
const User = require("../Models/user");
const isAuth = require("../middleware/isAuth");
const multer = require("multer");
const storage = multer.memoryStorage(); // Almacena los archivos en memoria, puedes ajustarlo según tus necesidades
const upload = multer({ storage: storage });

const router = express.Router();

// Rutas protegidas que requieren autenticación
//put the routes that will be authenticated under the next line
//router.use(isAuth());

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
    body("first").trim().not().isEmpty().withMessage("Name is empty"),
    body("last").trim().not().isEmpty().withMessage("Name is empty"),
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

router.post(
  "/reset",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
  ],
  authController.postReset
);

router.get("/reset-password/:token", authController.getResetPassword);

router.put(
  "/password-update/:id",
  [
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters"),
  ],
  authController.putPasswordUpdate
);

router.put(
  "/profile/:id",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    body("first").trim().not().isEmpty().withMessage("First name is empty"),
    body("last").trim().not().isEmpty().withMessage("Last name is empty"),
  ],
  authController.putProfileUpdate
);

router.put(
  "/imageUpdate/:id",
  upload.array("imagen", 1),
  authController.putImageUpdate
);

router.delete("/deleteProfileImage/:id", authController.deleteProfileImg);

router.get("/dropdown", isAuth, authController.getIsAuthDrop);

module.exports = router;
