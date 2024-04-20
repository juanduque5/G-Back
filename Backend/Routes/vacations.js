const express = require("express");
const properController = require("../Controllers/vacations");
const { body } = require("express-validator");

// const User = require("../Models/user");
// const isAuth = require("../middleware/isAuth");

const router = express.Router();
const multer = require("multer"); // Agrega la importación de multer
const storage = multer.memoryStorage(); // Almacena los archivos en memoria, puedes ajustarlo según tus necesidades
const upload = multer({ storage: storage });

router.post(
  "/propertiesVacations",
  upload.array("imagen", 5), // up to 5 images can be obtained from front-end

  [
    body([
      "id",
      "departamento",
      "municipio",
      "description",
      "banos",
      "habitaciones",
      "area",
      "estado",
      "tipo",
      "estacionamientos",
    ]).notEmpty(),
  ],
  properController.postPropertiesVacations
);

router.put(
  "/edit",
  upload.array("imagen", 5), // up to 5 images can be obtained from front-end

  [
    body([
      "id",
      "departamento",
      "municipio",
      "description",
      "banos",
      "habitaciones",
      "area",
      "estado",
      "tipo",
      "estacionamientos",
    ]).notEmpty(),
  ],
  properController.putPropertiesVacations
);

router.get("/searchProperty", properController.getSearchProperty);

router.get(
  "/allPropertiesByUserVacations/:id",
  properController.getAllVacations
);

router.get("/infoByIdVacations/:id", properController.getInfoByIdVacations);

router.get(
  "/allVacationsProperties",
  properController.getAllVacationsProperties
);

module.exports = router;
