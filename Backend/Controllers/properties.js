// const User = require("../Models/user");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const Properties = require("../Models/properties");
const sharp = require("sharp");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
// const { all } = require("../Routes/properties");

require("dotenv").config();

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const awsAccess = process.env.AWS_ACCESS_KEY_ID;
const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION;
const s3Bucket = process.env.S3_BUCKET;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccess,
    secretAccessKey: awsSecret,
  },
  region: awsRegion,
});

exports.postProperties = async (req, res, next) => {
  const files = req.files;
  let propertiesResult;

  // Guardar información en la base de datos
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

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    // Insertar información en la base de datos para cada archivo
    propertiesResult = await Properties.insertData(
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

    console.log("data inserted");

    // for (const file of files) {
    // }
    res.status(200).json({
      message: "Property data successfully inserted",
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: "Error en el servidor" });
  }

  for (const file of files) {
    const imageName = randomImageName();
    console.log("files details before:", file.mimetype);
    const buffer = await sharp(file.buffer)
      .toFormat("jpeg")
      .jpeg({ quality: 50 })
      .toBuffer();

    console.log("Nombre del archivo original:", file.originalname);
    const processedMimetype = await sharp(buffer)
      .metadata()
      .then((metadata) => metadata.format);
    console.log("Files details after processing:");
    console.log("Processed Mimetype:", processedMimetype);

    const params = {
      Bucket: s3Bucket,
      Key: imageName,
      Body: buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    try {
      // Subir archivo a S3
      await s3.send(command);
      console.log("S3 successfully inserted");

      const imageResult = await Properties.insertImage(
        propertiesResult.id,
        imageName
      );

      if (!imageResult) {
        const error = new Error("ERROR: property data");
        error.statusCode = 500;
        throw error;
      }

      console.log("image inserted");
    } catch (error) {
      console.error("Error al subir el archivo a S3:", error);
      // Manejar el error según sea necesario
      return res.status(500).json({ message: "Error al subir archivos a S3" });
    }
  }
};

exports.getInfo = async (req, res, next) => {
  const { userId, isAuth } = req.params;
  console.log("isAuth && userI", isAuth, userId);
  // let element;
  try {
    // const allProperties = await Properties.propertiesData();

    if (isAuth === "true" && !isNaN(userId)) {
      const allProperties2 = await Properties.propertiesDataIsAuth(userId);
      if (!allProperties2) {
        const error = new Error("ERROR: All property data");
        error.statusCode = 500;
        throw error;
      }
      // console.log("Properties2", allProperties2);
      const newProperties = allProperties2.filter((obj, index) => {
        return (
          index === allProperties2.findIndex((index) => index.id === obj.id)
        );
      });
      // console.log("all properties API:", newProperties);
      const updatedProperties = newProperties.map((property) => {
        return {
          ...property,
          imageURL: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${property.imageURL}`,
        };
      });
      // console.log("updatedProperties Auth API:", updatedProperties);
      res.status(200).json({
        message: "All property data successfully sent",
        data: updatedProperties,
      });
    } else {
      console.log("user_id", userId);
      const allProperties = await Properties.propertiesDataNoAuth();
      if (!allProperties) {
        const error = new Error("ERROR: All property data");
        error.statusCode = 500;
        throw error;
      }
      // console.log("Properties", allProperties);
      const newProperties = allProperties.filter((obj, index) => {
        return (
          index === allProperties.findIndex((index) => index.id === obj.id)
        );
      });
      // console.log("all properties API:", newProperties);
      const updatedProperties = newProperties.map((property) => {
        return {
          ...property,
          imageURL: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${property.imageURL}`,
        };
      });
      // console.log("updatedProperties NotAuth API:", updatedProperties);
      res.status(200).json({
        message: "All property data successfully sent",
        data: updatedProperties,
      });
    }
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
    console.log(id);
    const propertyById = await Properties.propertyById(id);
    console.log("propertyById", propertyById);

    if (!propertyById) {
      const error = new Error("ERROR: PropertyById");
      error.statusCode = 500;
      throw error;
    }

    // console.log("propertyById", propertyById);
    const imageUrl = await Properties.searchImagesById(id);

    const updatedUrls = imageUrl.map((urlObject) => urlObject["imageURL."]);
    console.log("image URLs:", updatedUrls);

    const updatedData = updatedUrls.map((url) => {
      return {
        ...propertyById,
        imageUrl: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${url}`,
      };
    });
    console.log("up", updatedData);
    res.status(200).json({
      message: "PropertyById successfully sento to FRONT END",
      data: updatedData,
    });
  } catch (error) {
    console.error("Error in catch block propertyById:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
      next(error);
    }
  }
};

exports.getAllPropertiesByUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const propertiesById = await Properties.propertiesInfoAndImagesById(id);

    if (!propertiesById || propertiesById.length === 0) {
      const error = new Error("No properties found for the specified user ID");
      error.statusCode = 404; // Not Found
      throw error;
    }

    console.log("propertiesById I:", propertiesById);

    const newProperties = propertiesById.filter((obj, index) => {
      return index === propertiesById.findIndex((index) => index.id === obj.id);
    });

    console.log("propertiesById II:", newProperties);

    // for (const properties of propertiesById) {
    //   var images = await Properties.searchImagesById(properties.id);
    //   console.log("images by id", images);
    // }

    const updatedProperties = newProperties.map((Properties) => {
      return {
        ...Properties,
        imageURL: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${Properties.imageURL}`,
      };
    });

    console.log("propertiesById III:", updatedProperties);

    res.status(200).json({
      message: "PropertiesById successfully sent to FRONT END",
      propertiesById: updatedProperties,
    });

    console.log("propertiesById were successfully sent ");
  } catch (error) {
    console.error("Error in catch block propertyById:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
      next(error);
    }
  }
};

exports.postFavorites = async (req, res, next) => {
  try {
    const { propertyId, userId } = req.params;

    if (req.method === "POST") {
      const favorites = await Properties.propertiesAddFavoritesByUserId(
        userId,
        propertyId
      );
      if (!favorites) {
        const error = new Error("ERROR: All property data");
        error.statusCode = 500;
        throw error;
      }

      console.log("Added to favorites", favorites);
      res.status(200).json({ message: "Property marked as favorite" });
    } else if (req.method === "DELETE") {
      const favorites = await Properties.propertiesDeleteFavoritesByUserId(
        userId,
        propertyId
      );
      if (!favorites) {
        const error = new Error("ERROR: All property data");
        error.statusCode = 500;
        throw error;
      }

      console.log("Deleted from favorites", favorites);
      res.status(200).json({ message: "Property removed from favorites" });
    } else {
      // Método HTTP no soportado
      res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Error in catch block propertyById:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
      next(error);
    }
  }
};

// getFavoritePropertiesByUser;

exports.getFavoritePropertiesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const favoriteProperties = await Properties.allFavoritePropertiesByUserId(
      userId
    );
    if (!favoriteProperties) {
      const error = new Error("ERROR: Not favorite properties returned");
      error.statusCode = 500;
      throw error;
    }
    console.log("favorite properties:", favoriteProperties);

    const updatedProperties = favoriteProperties.map((property) => {
      return {
        ...property,
        imageURL: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${property.imageURL}`,
      };
    });
    console.log("updatedFavorite properties:", updatedProperties);

    res.status(200).json({
      message: "favorites by user successfully sent",
      favoriteProperties: updatedProperties,
    });
  } catch (error) {
    console.error("Error in catch block propertyById:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
      next(error);
    }
  }
};

exports.getMap = async (req, res, next) => {
  const { input } = req.query;
  console.log(input);
  const key = "AIzaSyDjvgyFvCgkaXNyN3FzsVsAqGj5H87BCcI";
  const url = `https://maps.googleapis.com/maps/api/place/queryautocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error message from autoComplete:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
