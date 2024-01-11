// const User = require("../Models/user");
const Properties = require("../Models/properties");
const { validationResult } = require("express-validator");

exports.postProperties = async (req, res, next) => {
  const ciudad = req.body.ciudad;
  const barrio = req.body.barrio;
  const description = req.body.description;
  const habitaciones = req.body.habitaciones;
  const banos = req.body.banos;
  const estacionamientos = req.body.estacionamientos;
  const area = req.body.area;
  const estado = req.body.estado;
  const tipo = req.body.tipo;
  const user_id = req.body.id;
  const uso = req.body.uso;

  console.log("property data:", req.body);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const propertiesResult = await Properties.insertData(
      user_id,
      ciudad,
      barrio,
      description,
      banos,
      habitaciones,
      area,
      estado,
      tipo,
      estacionamientos,
      uso
    );

    if (!propertiesResult) {
      const error = new Error("ERROR: property data");
      error.statusCode = 500;
      throw error;
    }

    res.status(200).json({
      message: "Property data successfully inserted",
      data: propertiesResult,
    });

    console.log("data inserted");
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getInfo = async (req, res, next) => {
  console.log("se llamo aquii");
  try {
    const allProperties = await Properties.propertiesData();
    if (!allProperties) {
      const error = new Error("ERROR: All property data");
      error.statusCode = 500;
      throw error;
    }

    // console.log("all properties API", allProperties);
    res.status(200).json({
      message: "All property data successfully sent",
      data: allProperties,
    });
  } catch (error) {
    console.error("Error in catch block:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
      next(error);
    }
  }
};

exports.getInfoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const propertyById = await Properties.propertyById(id);
    if (!propertyById) {
      const error = new Error("ERROR: PropertyById");
      error.statusCode = 500;
      throw error;
    }

    console.log("propertyById", propertyById);
    res.status(200).json({
      message: "PropertyById successfully sento to FRONT END",
      data: propertyById,
    });
  } catch (error) {
    console.error("Error in catch block propertyById:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
      next(error);
    }
  }
};
