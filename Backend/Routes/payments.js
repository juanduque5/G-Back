const express = require("express");
const authController = require("../Controllers/payments");

const router = express.Router();

// Definir una ruta para la raíz ("/")

// Definir otras rutas según sea necesario
router.post("/order/:id", authController.postOrder);
// router.get("/webhook", authController.crearWebhook);

module.exports = router;
