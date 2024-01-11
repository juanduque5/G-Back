const express = require("express");
const properController = require("../Controllers/properties");
const { body } = require("express-validator");

const User = require("../Models/user");
const isAuth = require("../middleware/isAuth");

const router = express.Router();

// Rutas protegidas que requieren autenticación
//put the routes that will be authenticated under the next line
//router.use(isAuth());

//post properties

router.post(
  "/properties",
  [
    body([
      "id",
      "ciudad",
      "barrio",
      "description",
      "banos",
      "habitaciones",
      "area",
      "estado",
      "tipo",
      "estacionamientos",
    ]).notEmpty(),
  ],
  properController.postProperties
);

router.get("/info", properController.getInfo);

router.get("/infoById/:id", properController.getInfoById);

module.exports = router;
