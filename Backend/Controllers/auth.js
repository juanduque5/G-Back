const User = require("../Models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

exports.postSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  //Obtaining info from req.body
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  //Using bcrypt to hash the user's password
  bcrypt
    .hash(password, 12)
    .then((hashedpassword) => {
      return User.create({
        email: email,
        name: name,
        password: hashedpassword,
      });
    })
    .then((newUser) => {
      // The user was successfully created
      console.log("creado con exito", newUser);
      res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
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
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const name = user.name;

    // La autenticación fue exitosa
    res.status(200).json({ message: "Login successful", name });
  } catch (err) {
    // Manejo de errores
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
