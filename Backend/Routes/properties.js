const express = require("express");
const properController = require("../Controllers/properties");
const { body } = require("express-validator");

const User = require("../Models/user");
const isAuth = require("../middleware/isAuth");

const router = express.Router();
const multer = require("multer"); // Agrega la importación de multer
const storage = multer.memoryStorage(); // Almacena los archivos en memoria, puedes ajustarlo según tus necesidades
const upload = multer({ storage: storage });
// Rutas protegidas que requieren autenticación
//put the routes that will be authenticated under the next line
//router.use(isAuth());

//post properties

// AKIATCKASWPFU6XQPBMB;
// QVwQJV9TgRrslFYKvRQNspBdpYyJ7UDaV / VqhHIO;

router.post(
  "/properties",
  upload.array("imagen", 5), // Ajusta el nombre del campo según tu implementación

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

router
  .route("/favorites/:propertyId/:userId")
  .post(properController.postFavorites) // Manejar la solicitud POST para marcar como favorito
  .delete(properController.postFavorites);

router.get("/info/:isAuth/:userId", properController.getInfo);

router.get("/infoById/:id", properController.getInfoById);

router.get("/allPropertiesByUser/:id", properController.getAllPropertiesByUser);

module.exports = router;
