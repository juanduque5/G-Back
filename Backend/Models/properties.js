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
  estacionamientos,
  uso
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
      uso: uso,
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
  return db
    .select("propiedades.*", "imagenes.url as imageURL")
    .from("propiedades")
    .leftJoin("imagenes", "propiedades.id", "imagenes.propiedad_id")
    .then((data) => {
      // console.log("todas las propiedades:", data); // Aquí obtienes los registros de propiedades con las URLs
      return data;
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

Properties.propertyById = (id) => {
  return db("propiedades").where("id", id).first();
};

Properties.userPropertiesById = (id) => {
  return db("propiedades").select("*").where("user_id", id);
};

Properties.insertImage = (id, url) => {
  return db("imagenes")
    .returning("*")
    .insert({
      propiedad_id: id,
      url: url,
    })
    .then((result) => {
      return result[0];
    })
    .catch((error) => {
      // manejar el error aquí
      console.error("Error al insertar imagen:", error);
      throw error; // puedes personalizar la respuesta de error según tus necesidades
    });
};

Properties.searchImagesById = (id) => {
  return db
    .select("imagenes.url as imageURL.")
    .from("propiedades")
    .leftJoin("imagenes", "propiedades.id", "imagenes.propiedad_id")
    .where("propiedad_id", id) // Reemplaza tuIdEspecifico con el valor que estás buscando
    .then((data) => {
      // Aquí obtienes los registros de propiedades con las URLs
      return data;
    })
    .catch((error) => {
      console.error("ERROR al obtener las imageURL:", error);
      throw error;
    });
};

Properties.propertiesInfoAndImagesById = (id) => {
  return db
    .select("propiedades.*", "imagenes.url as imageURL")
    .from("propiedades")
    .leftJoin("imagenes", "propiedades.id", "imagenes.propiedad_id")
    .leftJoin("users", "propiedades.user_id", "users.id")
    .where("propiedades.user_id", id)
    .then((data) => {
      // console.log("todas las propiedades:", data); // Aquí obtienes los registros de propiedades con las URLs
      return data;
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

module.exports = Properties;
