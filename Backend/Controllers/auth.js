const User = require("../Models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");
const moment = require("moment");

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.postSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new Error("Validation failed");
    validationError.statusCode = 422;
    validationError.data = errors.array();
    throw validationError;
  }

  // Obtaining info from req.body
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  let newUser; // Variable para almacenar el usuario creado

  // Usando bcrypt para hashear la contraseña del usuario
  bcrypt
    .hash(password, 12)
    .then((hashedpassword) => {
      // Crear usuario con contraseña hasheada
      return User.create({
        email: email,
        name: name,
        password: hashedpassword,
      });
    })
    .then((createdUser) => {
      // Usuario creado con éxito
      newUser = createdUser; // Almacenar el usuario creado para su uso posterior
      console.log("creado con éxito", newUser);

      // Enviar correo electrónico y devolver la promesa del envío del correo
      return transporter.sendMail({
        to: email,
        from: "onmygrind1219@gmail.com",
        subject: "Signup succeeded!",
        html: "<h1>You've successfully signed up!</h1>",
      });
    })
    .then(() => {
      // Responder con éxito y el usuario creado
      res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    })
    .catch((error) => {
      console.error(error);

      // Manejar el error de manera centralizada
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

// Controlador para el inicio de sesión
exports.postLogin = async (req, res, next) => {
  try {
    // Realiza la validación de los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    // Extrae el email y la contraseña del cuerpo de la solicitud
    const email = req.body.email;
    const password = req.body.password;

    // Busca al usuario por su email en la base de datos
    const user = await User.findByEmail(email);
    console.log("USER", user);

    // Si no se encuentra al usuario, lanza un error
    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Compara la contraseña proporcionada con la almacenada en la base de datos
    const compare = await bcrypt.compare(password, user.password);

    // Si las contraseñas no coinciden, lanza un error
    if (!compare) {
      const error = new Error("Invalid password");
      error.statusCode = 401;
      throw error;
    }

    // const name = user.name;

    //Creatigng jwt token for authorization
    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id,
        name: user.name,
      },
      "somehiddensecretsuppersecrethiddentoken",
      { expiresIn: "1h" }
    );

    // La autenticación fue exitosa
    res.status(200).json({
      message: "Login successful",
      name: user.name,
      token: token,
      id: user.id,
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
