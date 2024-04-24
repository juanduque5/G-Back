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

router.post(
  "/properties",
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
  properController.postProperties
);

//edit properties
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
  properController.putProperties
);

router
  .route("/favorites/:propertyId/:userId")
  .post(properController.postFavorites) // Manejar la solicitud POST para marcar como favorito
  .delete(properController.postFavorites);

router.get("/info/:token/:userId", properController.getInfo);

router.get("/infoById/:id", properController.getInfoById);

router.get("/vacationsInfoById/:id", properController.getVacationsInfoById);

router.get("/allPropertiesByUser/:id", properController.getAllPropertiesByUser);

router.get("/maps/api/place/autocomplete/json", properController.getMap);

router.get("/maps/api/geocode/json", properController.getLocation);

router.get("/departamentos/geo", properController.getDepartamentos);

router.get("/municipios/:departamento", properController.getMunicipios);

router.get(
  "/allFavoritePropertiesByUser/:userId",
  properController.getFavoritePropertiesByUser
);

router.get(
  "/autocomplete/guatemala/",
  properController.getAutoCompleteGuatemala
);

router.get("/homeSearch", properController.getHomeSearch);

router.delete("/deletePropertyById/:id", properController.deletePropertyById);

module.exports = router;
