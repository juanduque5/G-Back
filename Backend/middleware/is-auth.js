const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Verificar autorización
  const authorizationHeader = req.headers["Authorization"];

  // Verificar si la variable token es nula
  if (!authorizationHeader) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  // Tomar el token
  const token = authorizationHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "tu_secreto"); // Reemplaza 'tu_secreto' con tu secreto real
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    return next(err);
  }

  // Verificar si el token es válido
  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  req.name = decodedToken.name;
  next();
};
//somehiddensecretsuppersecrethiddentoken
