const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const User = require("../Models/user");
const Properties = require("../Models/properties");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");
const sharp = require("sharp");
const moment = require("moment");
const { getDefaultHighWaterMark } = require("stream");

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

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.postSignup = async (req, res, next) => {
  const { password } = req.body;
  const email = req.body.email.toLowerCase();
  const first = req.body.first.toLowerCase();
  const last = req.body.last.toLowerCase();
  const language = req.headers["accept-language"] || "en"; // Obtener el idioma preferido del usuario de los encabezados de la solicitud

  try {
    // Verificar si el correo electrónico ya está registrado
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      let errorMessage;
      if (language === "es") {
        errorMessage = "El correo electrónico ya está registrado.";
      } else {
        errorMessage = "Email already exists.";
      }
      const error = new Error(errorMessage);
      error.statusCode = 422;
      throw error;
    }

    // Hashear la contraseña del usuario
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear un nuevo usuario
    const newUser = await User.create({
      email: email,
      first: first,
      last: last,
      password: hashedPassword,
    });

    const id = newUser.id;
    const insertIdSocial = await User.insertIdSocial(id);

    if (!insertIdSocial) {
      console.log("error: register insertIdSocial");
    }

    const insertIdSubs = await User.insertIdSubs(id);

    if (!insertIdSubs) {
      console.log("error: register insertIdSubs");
    }
    // Enviar correo electrónico y devolver la promesa del envío del correo
    // return transporter.sendMail({
    //   to: email,
    //   from: "onmygrind1219@gmail.com",
    //   subject: "Signup succeeded!",
    //   html: "<h1>You've successfully signed up!</h1>",
    // });

    // Responder con éxito y el usuario creado
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    // Manejar el error de manera centralizada
    console.error("Error creating user:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

// Controlador para el inicio de sesión
exports.postLogin = async (req, res, next) => {
  const language = req.headers["accept-language"] || "en"; // Obtener el idioma preferido del usuario de los encabezados de la solicitud
  try {
    // Realiza la validación de los datos recibidos
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   const error = new Error("Validation failed");
    //   error.statusCode = 422;
    //   error.data = errors.array();
    //   throw error;
    // }

    // Extrae el email y la contraseña del cuerpo de la solicitud
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    // Busca al usuario por su email en la base de datos
    const user = await User.findByEmail(email);
    // Si no se encuentra al usuario, lanza un error
    if (!user) {
      let errorMessage;
      if (language === "es") {
        errorMessage = "Email no registrado";
      } else {
        errorMessage = "Email doesn't exist";
      }
      const error = new Error(errorMessage);
      error.statusCode = 401;
      throw error;
    }
    console.log("USER", user);
    let id;
    if (user) {
      id = user.id;
    }
    //to get social media links
    const dataProfile = await User.profileSocial(id);
    //to get free plan status
    // const countProperties = await Properties.countProperties(id);
    // let freeplan = countProperties.freeplan;

    console.log(dataProfile);

    if (!dataProfile) {
      const error = new Error("profile social login");
      error.statusCode = 401;
      throw error;
    }

    // Compara la contraseña proporcionada con la almacenada en la base de datos
    const compare = await bcrypt.compare(password, user.password);

    // Si las contraseñas no coinciden, lanza un error
    if (!compare) {
      let errorMessage;
      if (language === "es") {
        errorMessage = "contraseña incorrecta";
      } else {
        errorMessage = "Incorrect password";
      }
      const error = new Error(errorMessage);
      error.statusCode = 401;
      throw error;
    }

    // const name = user.name;

    //Creating jwt token for authorization
    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id,
        first: user.first,
        last: user.last,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const imageUrl = `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${user.url}`;

    // La autenticación fue exitosa
    res.status(200).json({
      message: "Login successful",
      first: user.first,
      last: user.last,
      token: token,
      id: user.id,
      email: user.email,
      imageURL: imageUrl,
      profile: dataProfile,
    });
  } catch (err) {
    // Manejo de errores
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

//Reset
exports.postReset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationError = new Error("Validation failed");
      validationError.statusCode = 422;
      validationError.data = errors.array();
      throw validationError;
    }

    const buffer = await new Promise((resolve, reject) => {
      crypto.randomBytes(32, (err, buf) => {
        if (err) {
          reject(err);
        } else {
          resolve(buf);
        }
      });
    });

    const token = buffer.toString("hex");

    const user = await User.findByEmail(req.body.email);

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    user.resetToken = token;
    user.tokenExpiration = new Date(Date.now() + 3600000).toISOString();

    await User.updateReset(
      req.body.email,
      user.resetToken,
      user.tokenExpiration
    );

    try {
      await transporter.sendMail({
        to: req.body.email,
        from: "onmygrind1219@gmail.com",
        subject: "Resetting password!",
        html: `
          <p> You requested a password reset </p>
          <p>Click this <a href="http://localhost:3000/Reset-Password/${token}">link</p>
        `,
      });
      // Envío de correo exitoso
    } catch (mailError) {
      console.error("Error sending email:", mailError);
    }
    // Otro código relacionado con el manejo del restablecimiento de contraseña, si es necesario

    res.status(200).json({
      message:
        "An email has been sent to you with a link  to reset your password",
    });
  } catch (error) {
    console.error(error);

    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

//validating link with token and expiration time
exports.getResetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new Error("Validation failed");
    validationError.statusCode = 422;
    validationError.data = errors.array();
    throw validationError;
  }
  const resetToken = req.params.token;
  try {
    const user = await User.findByPasswordToken(resetToken);
    if (user && moment(user.tokenExpiration).isAfter(moment())) {
      res.status(200).json({ message: "Token is valid!", id: user.id });
    } else {
      // Linked has expired, error message 400
      res
        .status(400)
        .json({ message: "The link has expired, please request a new link" });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    // Envía una respuesta 500 Internal Server Error
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Updating password after token validation
exports.putPasswordUpdate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new Error("Validation failed");
    validationError.statusCode = 422;
    validationError.data = errors.array();
    return next(validationError); // Cambio aquí: usar return para salir inmediatamente
  }

  const { id } = req.params;
  const newPassword = req.body.password;

  try {
    const validId = await User.findById(id);

    if (!validId) {
      const error = new Error("Invalid ID");
      error.statusCode = 401;
      throw error;
    }

    // El siguiente bloque then se ejecutará solo si no hay errores de validación
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updatedUser = await User.updatePassword(validId.id, hashedPassword);

    console.log(updatedUser);

    res.status(200).json({ message: "Password updated" });
  } catch (error) {
    console.error("Error from updating password", error);
    // Envía una respuesta 500 Internal Server Error
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.getIsAuthDrop = async (req, res, next) => {
  try {
    const id = req.id;
    res.json({ message: "Dropdown authenticated", id: id });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

//if id is no the same as the id now, then email already exists
exports.putProfileUpdate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new Error("Validation failed");
    validationError.statusCode = 422;
    validationError.data = errors.array();
    return next(validationError); // Cambio aquí: usar return para salir inmediatamente
  }

  try {
    const { id } = req.params;
    console.log(id);
    let { email, first, last, oldEmail, phone, whatsappNumber } = req.body;

    const existingUser = await User.findByEmail(oldEmail);
    console.log("existing id", existingUser.id);

    if (parseInt(existingUser.id) === parseInt(id)) {
      const newProfile = await User.updateProfile(id, email, first, last);
      if (!newProfile) {
        const error = new Error("Invalid new Profile");
        error.statusCode = 401;
        throw error;
      }

      console.log("Profile successfully updated");

      const updateSocialMedia = await User.updateSocialMedia(
        id,
        req.body.whatsapp,
        req.body.facebook,
        req.body.instagram,
        req.body.linkedin,
        req.body.tiktok,
        phone,
        whatsappNumber
      );

      if (!updateSocialMedia) {
        const error = new Error("Invalid new Profile");
        error.statusCode = 401;
        throw error;
      }

      res.json({
        newProfile: newProfile,
        socialmedia: updateSocialMedia,
        message: "Profile successfully updated",
      });
    } else {
      const error = new Error("Email is already registered");
      error.statusCode = 401;
      throw error;
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }

    next(error);
  }
};

exports.putImageUpdate = async (req, res, next) => {
  try {
    const file = req.files[0];
    const { id } = req.params;
    const imageName = randomImageName();
    const buffer = await sharp(file.buffer)
      .toFormat("jpeg")
      .jpeg({ quality: 70 })
      .toBuffer();

    const object = await User.findImageProfileById(id);
    const url = object.url;
    console.log("url", url);
    console.log("imageName", imageName);

    if (url) {
      const deleteImageParams = {
        Bucket: s3Bucket,
        Key: url,
      };

      await s3
        .send(new DeleteObjectCommand(deleteImageParams))
        .then(() => {
          console.log("Objecto borrado exitosamente");
        })
        .catch((error) => {
          console.error("Error al borrar el objeto:", error);
        });
    }

    const s3Params = {
      Bucket: s3Bucket,
      Key: imageName,
      Body: buffer,
      ContentType: file.mimetype,
    };

    await s3
      .send(new PutObjectCommand(s3Params))
      .then(() => {
        console.log("Objecto actualizado exitosamente");
      })
      .catch((error) => {
        console.error("Error al actualizar el objeto:", error);
      });

    const updateImageProfile = await User.updateImageProfile(id, imageName);

    if (!updateImageProfile) {
      const error = new Error(
        "ERROR: No se pudo actualizar la imagen de perfil en la base de datos"
      );
      error.statusCode = 500;
      throw error;
    }

    const imageUrl = `https://juanma-user-s3.s3.us-west-1.amazonaws.com/${updateImageProfile.url}`;

    console.log("imageURL LAST->", imageUrl);

    res.status(200).json({
      message: "Imagen de perfil actualizada exitosamente",
      image: imageUrl,
    });
    console.log("image url updated ");
  } catch (error) {
    console.error("Error al actualizar la imagen de perfil:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deleteProfileImg = async (req, res, next) => {
  const { id } = req.params;

  try {
    const object = await User.findImageProfileById(id);
    const url = object.url;
    console.log("url", url);
    // console.log("imageName", imageName);

    if (url) {
      const deleteImageParams = {
        Bucket: s3Bucket,
        Key: url,
      };

      await s3
        .send(new DeleteObjectCommand(deleteImageParams))
        .then(() => {
          console.log("Objecto borrado exitosamente");
        })
        .catch((error) => {
          console.error("Error al borrar el objeto:", error);
        });
    }

    const deleteImg = await User.deleteProfileImg(id);
    if (!deleteImg.url) {
      console.log("delete image", deleteImg);
    }

    res.status(200).json({
      message: "Imagen de perfil borrada exitosamente",
    });

    console.log("Imagen de perfil borrada exitosamente");
  } catch (error) {
    console.error("Error al borrar la imagen de perfil:", error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getUserData = async (req, res, next) => {
  try {
    const data = await User.getAllUsersWithSubscribers();
    res.status(200).json({
      data: data,
    });
  } catch (error) {
    console.error("Error al obtener todos los users (getUserData)", error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

// exports.getProfileSocial = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     console.log("idID", id);
//     const profile = await User.profileSocial(id);
//     if (!profile) {
//       const error = new Error("Invalid profile social");
//       error.statusCode = 401;
//       throw error;
//     }
//     console.log("successful PROFILESOCIAL");
//     res.json({ profile: profile });
//   } catch (error) {
//     if (!error.statusCode) {
//       error.statusCode = 500;
//     }

//     next(error);
//   }
// };

// console.log("files details before:", file.mimetype);

// console.log("Nombre del archivo original:", file.originalname);
// const processedMimetype = await sharp(buffer)
//   .metadata()
//   .then((metadata) => metadata.format);
// console.log("Files details after processing:");
// console.log("Processed Mimetype:", processedMimetype);
