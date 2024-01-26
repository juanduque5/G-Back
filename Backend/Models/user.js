const db = require("../db/knex");

const User = {};

//Create user for signing up
User.create = (userInput) => {
  console.log("Email length:", userInput.email.length);
  // console.log("Name length:", userInput.name.length);
  console.log("Password length:", userInput.password.length);

  return db("users")
    .returning("*")
    .insert(userInput)
    .then((result) => {
      // Devolver el primer elemento del array resultante
      return result[0];
    });
};

//Find user by email
User.findByEmail = (email) => {
  return db("users").where("email", email).first();
};

//Requesting password update, assigning resetToken and tokenExpiration
User.updateReset = (email, resetToken, tokenExpiration) => {
  return db("users").where("email", email).update({
    resetToken: resetToken,
    tokenExpiration: tokenExpiration,
  });
};

//Find by password update-token
User.findByPasswordToken = (resetToken) => {
  return db("users").where("resetToken", resetToken).first();
};

//Find by Id
User.findById = (id) => {
  return db("users").where("id", id).first();
};

//Updating password-(token is valid)
User.updatePassword = (id, password) => {
  return db("users")
    .returning("*")
    .where("id", id)
    .update({
      password: password,
    })
    .then((result) => {
      return result[0];
    });
};

module.exports = User;
