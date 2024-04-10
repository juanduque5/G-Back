const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const Properties = require("../Models/properties");
const User = require("../Models/user");
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
const geoKey = process.env.GEO_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccess,
    secretAccessKey: awsSecret,
  },
  region: awsRegion,
});

//Obtaining all property data from the front-end
exports.postProperties = async (req, res, next) => {
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
      lng
    );

    if (!propertiesResult) {
      const error = new Error("ERROR: property data");
      error.statusCode = 500;
      throw error;
    }

    console.log("DATA SUCCESSFULLY INSERTED");

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

//Getting all properties from database
exports.getInfo = async (req, res, next) => {
  const { userId, token } = req.params;
  console.log("isAuth && userI", token, userId);
  // let element;
  try {
    // const allProperties = await Properties.propertiesData();

    if (token && !isNaN(userId)) {
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

//Finding properties using the user id
exports.getInfoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(id);
    const propertyById = await Properties.propertyById(id);
    // console.log("propertyById", propertyById[0].user_id);
    const userId = propertyById[0].user_id;

    const social = await User.profileSocial(userId);

    if (!propertyById) {
      const error = new Error("ERROR: PropertyById");
      error.statusCode = 500;
      throw error;
    }

    // console.log("propertyById", propertyById);
    const imageUrl = await Properties.searchImagesById(id);

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
      social: social,
    });
  } catch (error) {
    console.error("Error in catch block propertyById:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
      next(error);
    }
  }
};

//Finding images and properties using user id
exports.getAllPropertiesByUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const propertiesById = await Properties.propertiesInfoAndImagesById(id);

    const social = await User.profileSocial(id);
    const user = await User.findById(id);

    if (!propertiesById) {
      const error = new Error("No properties found for the specified user ID");
      error.statusCode = 404; // Not Found
      throw error;
    }

    // console.log("propertiesById I:", propertiesById);

    const newProperties = propertiesById.filter((obj, index) => {
      return index === propertiesById.findIndex((index) => index.id === obj.id);
    });

    // console.log("propertiesById II:", newProperties);

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

    // console.log("propertiesById III:", updatedProperties);
    // console.log("propertiesById III:", name);

    res.status(200).json({
      message: "PropertiesById successfully sent to FRONT END",
      propertiesById: updatedProperties,
      social: social,
      user: user,
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

//Finding all favorite properties by user id
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

    const newProperties = favoriteProperties.filter((obj, index) => {
      return (
        index === favoriteProperties.findIndex((index) => index.id === obj.id)
      );
    });

    const updatedProperties = newProperties.map((property) => {
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

//Getting cities from GoogleAPI for autocomplete
exports.getMap = async (req, res, next) => {
  const { input } = req.query;
  console.log(input);
  const key = geoKey;
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

//getting exactly location to find it on the map
exports.getLocation = async (req, res, next) => {
  const { place_id } = req.query;
  console.log(place_id);
  const key = geoKey;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data.results[0].geometry.location);
    res.json(data.results[0].geometry.location);
  } catch (error) {
    console.error("Error message from autoComplete:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Obtaining all cities from Guatemala
exports.getDepartamentos = async (req, res, next) => {
  try {
    const departamentos = await Properties.allDepartamentos();
    if (!departamentos) {
      const error = new Error("ERROR: departamentos");
      error.statusCode = 500;
      throw error;
    }

    const updatedDepartamentos = departamentos.map(
      (departamentos) => departamentos.nombre
    );

    res.status(200).json({
      departamentos: updatedDepartamentos,
    });
  } catch (error) {
    console.error("Error from  departamento:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Obtaining all cities from localities
exports.getMunicipios = async (req, res, next) => {
  const { departamento } = req.params;
  try {
    const municipios = await Properties.findMunicipios(departamento);
    if (!municipios) {
      const error = new Error("ERROR: departamentos");
      error.statusCode = 500;
      throw error;
    }

    const updatedMunicipios = municipios.map((municipios) => municipios.nombre);
    res.status(200).json({
      municipios: updatedMunicipios,
    });
  } catch (error) {
    console.error("Error message from autoComplete:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Sending cities and localities data in just one array without duplicates
exports.getAutoCompleteGuatemala = async (req, res, next) => {
  const { searchTerm } = req.query;
  // console.log("search", searchTerm);
  console.log("search", searchTerm);
  try {
    const allPlaces = await Properties.allCitiesAndLocalities();
    if (!allPlaces) {
      const error = new Error(
        "ERROR: (allPlaces) departamentos and municipios null"
      );
      error.statusCode = 500;
      throw error;
    }
    // console.log("allPlaces", allPlaces
    // const updatedPlaces = allPlaces.map(
    //   (places) => places.municipios && places.departamentos
    // );
    // // Fusiona los arrays de departamentos y municipios en una sola lista
    const lugares = allPlaces.reduce((acc, place) => {
      acc.push(place["departamentos*"], place["municipios*"]);
      return acc;
    }, []);

    //it filters cities and areas according to searchTeam
    const result = lugares.filter(
      (info) =>
        info.toLocaleLowerCase().includes(searchTerm) && searchTerm.length >= 3
    );
    //It removes duplicates
    const uniqueArray = result.filter(
      (item, index) => result.indexOf(item) === index
    );

    console.log("updated result", uniqueArray);

    res.status(200).json({
      places: uniqueArray,
    });
  } catch (error) {
    console.error("Error message from autoComplete allPlaces:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//handle search from home
exports.getHomeSearch = async (req, res, next) => {
  const searchData = req.query;
  const casa = req.query.casa === "true" ? "Casa" : false;
  const apartamento = req.query.apartamento === "true" ? "Apartamento" : false;
  const local = req.query.local === "true" ? "Local" : false;
  const lote = req.query.lote === "true" ? "Lote" : false;
  const venta =
    req.query.venta === "true" || req.query.both === "true" ? "Venta" : false;
  const renta =
    req.query.renta === "true" || req.query.both === "true" ? "Renta" : false;
  const bathrooms = !isNaN(req.query.bathrooms) ? req.query.bathrooms : false;
  const bedrooms = !isNaN(req.query.bedrooms) ? req.query.bedrooms : false;
  const price = req.query.price ? req.query.price : false;
  const location = req.query.location;
  const token = req.query.token;
  const id = req.query.id;
  const minPriceRenta = !isNaN(req.query.minPrice) ? req.query.minPrice : false;
  const maxPriceRenta = !isNaN(req.query.maxPrice) ? req.query.maxPrice : false;

  console.log("minPriceRenta", minPriceRenta);

  let minPrice, maxPrice;

  //Setting price for sells
  if (price === "0 - 100,000") {
    minPrice = 0;
    maxPrice = 100000;
  } else if (price === "100,000 - 200,000") {
    minPrice = 100000;
    maxPrice = 200000;
  } else if (price === "200,000 - 300,000") {
    minPrice = 200000;
    maxPrice = 300000;
  } else if (price === "300,000 - 400,000") {
    minPrice = 300000;
    maxPrice = 400000;
  } else if (price === "400,000 - 500,000") {
    minPrice = 400000;
    maxPrice = 500000;
  } else if (price === "500,000+") {
    minPrice = 500000;
    maxPrice = 10000000;
  } else if (
    (minPriceRenta === "" || minPriceRenta >= 0 || minPriceRenta === false) &&
    maxPriceRenta > 0
  ) {
    if (minPriceRenta === "" || minPriceRenta === false) {
      minPrice = 0;
      maxPrice = maxPriceRenta;
    } else {
      minPrice = minPriceRenta;
      maxPrice = maxPriceRenta;
    }
  } else {
    minPrice = false;
    maxPrice = false;
  }

  try {
    //if token true, then search for properties liked by user
    if (token === "true") {
      console.log(
        "venta",
        venta,
        "renta",
        renta,
        "lote",
        lote,
        "local",
        local,
        "apartamento",
        apartamento,
        "casa",
        casa,
        "location",
        location,
        "id",
        id,
        "token",
        token
      );
      const search = await Properties.homeSearchIsAuth(
        casa,
        apartamento,
        local,
        lote,
        venta,
        renta,
        location,
        id,
        bathrooms,
        bedrooms,
        minPrice,
        maxPrice
      );

      if (!search) {
        const error = new Error(
          "ERROR: (allPlaces) departamentos and municipios null"
        );
        error.statusCode = 500;
        throw error;
      }

      const newProperties = search.filter((obj, index) => {
        return index === search.findIndex((index) => index.id === obj.id);
      });

      const updatedProperties = newProperties.map((property) => {
        return {
          ...property,
          imageURL: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${property.imageURL}`,
        };
      });

      res.status(200).json({
        data: updatedProperties,
      });
      console.log("homeSearch", updatedProperties);
    } else {
      //else

      console.log(
        "venta",
        venta,
        "renta",
        renta,
        "lote",
        lote,
        "local",
        local,
        "apartamento",
        apartamento,
        "casa",
        casa,
        "location",
        location
      );
      const search = await Properties.homeSearch(
        casa,
        apartamento,
        local,
        lote,
        venta,
        renta,
        location,
        bathrooms,
        bedrooms,
        minPrice,
        maxPrice
      );

      if (!search) {
        const error = new Error(
          "ERROR: (allPlaces) departamentos and municipios null"
        );
        error.statusCode = 500;
        throw error;
      }

      const newProperties = search.filter((obj, index) => {
        return index === search.findIndex((index) => index.id === obj.id);
      });

      const updatedProperties = newProperties.map((property) => {
        return {
          ...property,
          imageURL: `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${property.imageURL}`,
        };
      });

      res.status(200).json({
        data: updatedProperties,
      });
      // console.log("homeSearch", updatedProperties);
      console.log(
        "bed",
        bedrooms,
        "bathrooms",
        bathrooms,
        "price",
        minPrice,
        maxPrice
      );
      console.log(searchData);
    }
  } catch (error) {
    console.error("Error message from homeSearch Filter:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Edit property data
exports.putProperties = async (req, res, next) => {
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

    const propertiesResult = await Properties.updateData(
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

        const deleteImg = await Properties.deleteImagesEdit(id, deleteImages);
        if (!deleteImg) {
          console.log("delete image", deleteImg);
        } else {
          console.log(deleteImg);
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

        const imageResult = await Properties.insertImage(id, imageName);

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

exports.deletePropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: "Error en el servidor" });
  }
};
