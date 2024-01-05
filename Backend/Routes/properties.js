const express = require("express");
const properController = require("../Controllers/properties");

const User = require("../Models/user");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

// Rutas protegidas que requieren autenticación
//put the routes that will be authenticated under the next line
//router.use(isAuth());

//post properties
router.post("/properties", properController.postProperties);

//router.get("/dropdown", isAuth, authController.getIsAuthDrop);

module.exports = router;
