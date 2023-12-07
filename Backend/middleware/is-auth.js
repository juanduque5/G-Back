const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  //Verify authorization
  const authorizationHeader = req.headers["Authorization"];

  //Check is variable token is null
  if (!authorizationHeader) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  //takes token
  const token = authorizationHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "somehiddensecretsuppersecrethiddentoken");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  req.name = decodedToken.name;
  next();
};
