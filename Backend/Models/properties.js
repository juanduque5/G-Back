const db = require("../db/knex");

const Properties = {};

Properties.insertData = (
  id,
  ciudad,
  barrio,
  description,
  banos,
  habitaciones,
  area,
  estado,
  tipo,
  estacionamientos
) => {
  return db("propiedades")
    .returning("*")
    .insert({
      user_id: id,
      ciudad: ciudad,
      barrio: barrio,
      description: description,
      banos: banos,
      habitaciones: habitaciones,
      area: area,
      estado: estado,
      tipo: tipo,
      estacionamientos: estacionamientos,
    })
    .then((result) => {
      return result[0];
    })
    .catch((error) => {
      // manejar el error aquí
      console.error("Error al insertar en propiedades:", error);
      throw error; // puedes personalizar la respuesta de error según tus necesidades
    });
};

Properties.propertiesData = () => {
  return db("propiedades")
    .select("*")
    .then((data) => {
      console.log("todas las propiedades:", data); // Aquí obtienes los registros de propiedades
      return data;
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

module.exports = Properties;
