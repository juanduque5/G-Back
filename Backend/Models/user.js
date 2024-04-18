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

//insert user id for social foreing key user_id
User.insertIdSocial = async (id) => {
  try {
    // Aquí deberías tener alguna referencia a tu conexión de base de datos, supongamos que es dbConnection
    await db("social").insert({
      user_id: id,
    });
    console.log("ID social insertado correctamente");
    return true;
  } catch (error) {
    console.error("Error al insertar ID social:", error);
    return false;
  }
};

//insert user id for social foreing key user_id
User.insertIdSubs = async (id) => {
  try {
    // Aquí deberías tener alguna referencia a tu conexión de base de datos, supongamos que es dbConnection
    await db("subscribers").insert({
      user_id: id,
      freeproperties: 2,
      proproperties: 0,
      availableproperties: 2,
    });
    console.log("ID subscribers insertado correctamente");
    return true;
  } catch (error) {
    console.error("Error al insertar ID social:", error);
    return false;
  }
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

User.updateSocialMedia = async (
  id,
  whatsapp,
  facebook,
  instagram,
  linkedin,
  tiktok,
  phone,
  whatsappNumber
) => {
  try {
    // Actualizar la información de las redes sociales para todos los registros con el user_id dado
    await db("social")
      .update({
        whatsapp: whatsapp,
        facebook: facebook,
        instagram: instagram,
        linkedin: linkedin,
        tiktok: tiktok,
        phone: phone,
        wnumber: whatsappNumber,
      })
      .where("user_id", id);
    const updatedProfile = await db("social").where("user_id", id).first();
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

User.deleteProfileImg = async (id, url) => {
  try {
    const result = await db("users")
      .returning("url")
      .where("id", id)
      .update({ url: "" });

    return result[0];
  } catch (error) {
    console.error("ERROR UPDATE IMAGE PROFILE (USERS)", error);
    throw error;
  }
};

User.profileSocial = async (id) => {
  try {
    const result = await db("social").where("user_id", id);

    return result;
  } catch (error) {
    console.error("ERROR UPDATE IMAGE PROFILE (USERS)", error);
    throw error;
  }
};

User.insertPayment = async (userId, date, recurrente_id) => {
  try {
    const paymentData = {
      user_id: userId,
      date: date,
      pay: 5,
      payment_status: "pending",
      recurrente_id: recurrente_id,
      currency: "GTQ",
    };

    const [paymentId] = await db("payments")
      .insert(paymentData)
      .returning("id");

    console.log("Payment ID:", paymentId);

    return paymentId;
  } catch (error) {
    console.error("Error inserting payment:", error);
    throw error;
  }
};

//updatePayment
User.updatePayment = async (productId, status) => {
  try {
    // Busca el pago en la tabla 'payments' por el 'recurrente_id'
    const payment = await db("payments")
      .select("*")
      .where("recurrente_id", productId)
      .first();

    // Si no se encuentra el pago, devuelve un mensaje de error
    if (!payment) {
      throw new Error("No se encontró el pago");
    }

    // Actualiza el estado del pago en la tabla 'payments'
    await db("payments").where("recurrente_id", productId).update({
      payment_status: status,
    });

    // Obtén el user_id desde el pago encontrado
    const userId = payment.user_id;

    // Define el valor de proplan basado en el estado del pago
    const proplanValue = status === "complete" ? true : false;

    // Actualiza la tabla 'subscribers' donde el user_id coincide
    await db("subscribers")
      .where("user_id", userId)
      .update({
        proplan: proplanValue,
        availableproperties: db.raw("availableproperties + ?", [
          status === "complete" ? 3 : 0,
        ]),
      });

    // Devuelve un mensaje de éxito con el status del pago y el userId actualizado
    return {
      message: "Pago y plan actualizados con éxito",
      payment_status: status,
      updated_user_id: userId,
      proplan: proplanValue,
    };
  } catch (error) {
    // Captura cualquier error y lo registra
    console.error(
      "Error al actualizar el estado del pago y el plan del usuario:",
      error
    );
    throw error;
  }
};

module.exports = User;
