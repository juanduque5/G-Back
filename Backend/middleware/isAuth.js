const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Verificar autorización
  const authorizationHeader = req.get("Authorization");

  // Verificar si la variable token es nula
  if (!authorizationHeader) {
    const error = new Error("Not authenticated  authhh");
    error.statusCode = 401;
    return next(error);
  }

  // Tomar el token
  const token = req.get("Authorization").split(" ")[1];
  console.log("TOKEN: ", token);
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "somehiddensecretsuppersecrethiddentoken"); // Reemplaza 'tu_secreto' con tu secreto real
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    console.log("adentro");
    return next(err);
  }

  // Verificar si el token es válido
  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    return next(error);
  }

  req.id = decodedToken.userId;

  console.log("EMAIL:", decodedToken.email);
  console.log("userId:", decodedToken.userId);
  next();
};
//somehiddensecretsuppersecrethiddentoken
