const Properties = require("../Models/properties");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const Vacations = require("../Models/vacations");
const sharp = require("sharp");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
// const { all } = require("../Routes/properties");

require("dotenv").config();
const moment = require("moment");

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const awsAccess = process.env.AWS_ACCESS_KEY_ID;
const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION;
const s3Bucket = process.env.S3_BUCKET;
const geoKey = process.env.GEO_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccess,
    secretAccessKey: awsSecret,
  },
  region: awsRegion,
});

exports.getSearchProperty = async (req, res, next) => {
  let checkInDate = false;
  let checkOutDate = false;

  if (
    req.query.checkInDate &&
    moment(req.query.checkInDate, moment.ISO_8601, true).isValid()
  ) {
    const InDate = moment(req.query.checkInDate);
    checkInDate = InDate.format("MM-DD-YYYY");
  }

  if (
    req.query.checkOutDate &&
    moment(req.query.checkOutDate, moment.ISO_8601, true).isValid()
  ) {
    const OutDate = moment(req.query.checkOutDate);
    checkOutDate = OutDate.format("MM-DD-YYYY");
  }

  const location = req.query.location;
  const guests = !isNaN(req.query.guests) ? req.query.guests : false;

  console.log(checkInDate, checkOutDate);

  try {
    const search = await Properties.vacationSearch(location, guests);
    // Lógica adicional según sea necesario

    // console.log("Properties2", allProperties2);
    const newProperties = search.filter((obj, index) => {
      return index === search.findIndex((index) => index.id === obj.id);
    });
    // console.log("all properties API:", newProperties);
    const updatedProperties = newProperties.map((property) => {
      return {
        ...property,
        imageURL: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${property.imageURL}`,
      };
    });

    res.status(200).json({
      message: "All property data successfully sent",
      data: updatedProperties,
    });
  } catch (error) {
    // Manejar errores adecuadamente
    console.error("Error during property search:", error);
    res.status(500).send("Error searching properties");
  }
};

exports.getAllVacationsProperties = async (req, res, next) => {
  try {
    allProperties = await Properties.allVacations();
    if (!allProperties) {
      const error = new Error("ERROR: All property data");
      error.statusCode = 500;
      throw error;
    }
    // console.log("Properties", allProperties);
    const newProperties = allProperties.filter((obj, index) => {
      return index === allProperties.findIndex((index) => index.id === obj.id);
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
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: "Error en el servidor" });
  }
};

exports.postPropertiesVacations = async (req, res, next) => {
  const files = req.files;
  let propertiesResult;

  // Guardar información en la base de datos
  const departamento = req.body.departamento;
  const municipio = req.body.municipio;
  const description = req.body.description;
  const habitaciones = req.body.habitaciones;
  const banos = req.body.banos;
  const estacionamientos = req.body.estacionamientos;
  const area = req.body.area;
  const estado = req.body.estado;
  const tipo = req.body.tipo;
  const user_id = req.body.id;
  const uso = req.body.uso;
  // const coordinates = req.body.coordinates;
  const currency = req.body.currency;
  const direccion = req.body.direccion;
  const precio = req.body.precio;
  const lat = req.body.lat;
  const lng = req.body.lng;
  const currentDate = moment().format("MM-DD-YYYY");

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    // Insertar información en la base de datos para cada archivo
    propertiesResult = await Properties.insertDataVacations(
      user_id,
      departamento,
      municipio,
      description,
      banos,
      habitaciones,
      area,
      estado,
      tipo,
      estacionamientos,
      uso,
      currency,
      direccion,
      precio,
      lat,
      lng,
      currentDate
    );

    if (!propertiesResult) {
      const error = new Error("ERROR: property data");
      error.statusCode = 500;
      throw error;
    }

    console.log("DATA SUCCESSFULLY INSERTED");
    Properties.updatePropertiesInc(user_id);
    const numproperties = await Properties.countProperties(user_id);

    console.log("num", numproperties.numproperties);

    res.status(200).json({
      message: "Property data successfully inserted",
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: "Error en el servidor" });
  }

  //Saving images in AWS-S3
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

      const imageResult = await Properties.insertImageVacations(
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

exports.getAllVacations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const propertiesById =
      await Properties.propertiesInfoAndImagesByIdVacations(id);

    // const social = await User.profileSocial(id);
    // const user = await User.findById(id);

    if (!propertiesById) {
      const error = new Error("No properties found for the specified user ID");
      error.statusCode = 404; // Not Found
      throw error;
    }

    // console.log("propertiesById I:", propertiesById);

    const newProperties = propertiesById.filter((obj, index) => {
      return index === propertiesById.findIndex((index) => index.id === obj.id);
    });

    const updatedProperties = newProperties.map((Properties) => {
      return {
        ...Properties,
        imageURL: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${Properties.imageURL}`,
      };
    });

    // console.log("propertiesById III:", updatedProperties);
    // console.log("propertiesById III:", name);

    res.status(200).json({
      message: "PropertiesById successfully sent to FRONT END",
      propertiesById: updatedProperties,
      // social: social,
      // user: user,
      // button: button,
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

//Finding properties using the user id
exports.getInfoByIdVacations = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(id);
    const propertyById = await Properties.propertyByIdVacations(id);
    // console.log("propertyById", propertyById[0].user_id);
    // const userId = propertyById[0].user_id;

    // const social = await User.profileSocial(userId);

    if (!propertyById) {
      const error = new Error("ERROR: PropertyById");
      error.statusCode = 500;
      throw error;
    }

    // console.log("propertyById", propertyById);
    const imageUrl = await Properties.searchImagesByIdVacations(id);

    const updatedUrls = imageUrl.map((urlObject) => urlObject["imageURL."]);
    // console.log("image URLs:", updatedUrls);

    const updatedData = updatedUrls.map((url) => {
      return {
        ...propertyById,
        imageUrl: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${url}`,
      };
    });
    // console.log("up", updatedData);
    res.status(200).json({
      message: "PropertyById successfully sento to FRONT END",
      data: updatedData,
      // social: social,
    });
  } catch (error) {
    console.error("Error in catch block propertyById:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
      next(error);
    }
  }
};

//Edit property data
exports.putPropertiesVacations = async (req, res, next) => {
  try {
    const files = req.files;
    console.log("body", req.body);
    console.log("files", files);

    const departamento = req.body.departamento;
    const municipio = req.body.municipio;
    const description = req.body.description;
    const habitaciones = req.body.habitaciones;
    const banos = req.body.banos;
    const estacionamientos = req.body.estacionamientos;
    const area = req.body.area;
    const estado = req.body.estado;

    const property_id = req.body.id;
    const user_id = req.body.userId;

    const deleteImg = req.body.delete;
    const id = req.body.id;
    const currency = req.body.currency;
    const direccion = req.body.direccion;
    const precio = req.body.precio;
    const lat = req.body.lat;
    const lng = req.body.lng;

    let uniqueDel = [];
    if (Array.isArray(deleteImg)) {
      uniqueDel = deleteImg.map((url) => {
        const parts = url.split("/");
        return parts[parts.length - 1];
      });
    } else {
      console.error("deleteImg no es un array");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const propertiesResult = await Properties.updateDataVacations(
      property_id,
      user_id,
      departamento,
      municipio,
      description,
      banos,
      habitaciones,
      area,
      estado,
      estacionamientos,
      currency,
      direccion,
      precio,
      lat,
      lng
    );

    if (!propertiesResult) {
      throw new Error("ERROR: property data");
    }

    console.log("DATA SUCCESSFULLY INSERTED");

    const responseMessages = [];

    for (const deleteImages of uniqueDel) {
      if (deleteImages) {
        const deleteImageParams = {
          Bucket: s3Bucket,
          Key: deleteImages,
        };

        await s3
          .send(new DeleteObjectCommand(deleteImageParams))
          .then(() => {
            console.log("Objecto borrado exitosamente en edit s3");
            responseMessages.push(
              "Property images successfully deleted in edit"
            );
          })
          .catch((error) => {
            console.error("Error al borrar el objeto en edit:", error);
          });

        const deleteImg = await Properties.deleteImagesEditVacations(
          id,
          deleteImages
        );
        if (!deleteImg) {
          console.log("delete image", deleteImg);
        } else {
          console.log("delete image 2", deleteImg);
        }
      }
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
        await s3.send(command);
        console.log("S3 successfully inserted");

        const imageResult = await Properties.insertImageVacations(
          id,
          imageName
        );

        if (!imageResult) {
          throw new Error("ERROR: image insert in edit");
        }

        console.log("image inserted in edit");
        responseMessages.push("Property image successfully inserted");
      } catch (error) {
        console.error("Error al subir el archivo a S3:", error);
        return res
          .status(500)
          .json({ message: "Error al subir archivos a S3" });
      }
    }

    res.status(200).json({
      message: "Operation successful",
      details: responseMessages,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: "Error en el servidor" });
  }
};
