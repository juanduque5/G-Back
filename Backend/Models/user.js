const db = require("../db/knex");

const User = {};

User.create = (userInput) => {
  console.log("Email length:", userInput.email.length);
  console.log("Name length:", userInput.name.length);
  console.log("Password length:", userInput.password.length);

  return db("users")
    .returning("*")
    .insert(userInput)
    .then((result) => {
      // Devolver el primer elemento del array resultante
      return result[0];
    });
};

User.findByEmail = (email) => {
  return db("users").where("email", email).first();
};

User.updateReset = (email, resetToken, tokenExpiration) => {
  return db("users").where("email", email).update({
    resetToken: resetToken,
    tokenExpiration: tokenExpiration,
  });
};

module.exports = User;
