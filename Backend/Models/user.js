const db = require("../db/knex");
const { userPropertiesById } = require("./properties");

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

//Updating profile information
User.updateProfile = async (id, email, first, last) => {
  try {
    await db("users").where("id", id).update({
      email: email,
      first: first,
      last: last,
    });

    const updatedProfile = await db("users").where("id", id).first();
    return updatedProfile;
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    throw new Error("Error al actualizar el perfil.");
  }
};

User.findImageProfileById = async (id) => {
  try {
    const result = await db("users").select("url").where("id", id);

    return result[0];
  } catch (error) {
    console.error("ERROR findImageProfileById (USERS)", error);
    throw error;
  }
};

User.updateImageProfile = async (id, url) => {
  try {
    const result = await db("users")
      .returning("url")
      .where("id", id)
      .update({ url: url });

    return result[0];
  } catch (error) {
    console.error("ERROR UPDATE IMAGE PROFILE (USERS)", error);
    throw error;
  }
};

module.exports = User;
