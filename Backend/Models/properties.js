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

Properties.propertiesDataIsAuth = (userId) => {
  //Query to search for all properties, including the ones that a users saved as favorite
  return db
    .select(
      "propiedades.*",
      "imagenes.url as imageURL",
      "favoritos.id as favorito_id"
    )
    .from("propiedades")
    .leftJoin("imagenes", "propiedades.id", "imagenes.propiedad_id")
    .leftJoin("favoritos", function () {
      this.on("propiedades.id", "=", "favoritos.propiedad_id").andOn(
        "favoritos.user_id",
        "=",
        Number(userId)
      ); // Convertir userId a número
    })
    .then((data) => {
      // Manejar los datos recuperados exitosamente
      return data;
    })
    .catch((error) => {
      // Manejar los errores
      console.error("Error en la consulta propertiesData2:", error);
      throw error;
    });
};

Properties.propertiesDataNoAuth = () => {
  //if a user is not authenticated, it will just search for all the properties
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
  //Find property by id
  return db("propiedades").where("id", id).first();
};

Properties.userPropertiesById = (id) => {
  //Find all properties related to an user
  return db("propiedades").select("*").where("user_id", id);
};

Properties.insertImage = (id, url) => {
  //insert an image url and associate it with a property id
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
  //Find all urls that have a property id
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

Properties.propertiesAddFavoritesByUserId = (userId, propertyId) => {
  return db("favoritos")
    .returning("*")
    .insert({
      user_id: userId,
      propiedad_id: propertyId,
    })
    .then((result) => {
      // console.log("todas las propiedades:", data); // Aquí obtienes los registros de propiedades con las URLs
      return result[0];
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

Properties.propertiesDeleteFavoritesByUserId = (userId, propertyId) => {
  return db("favoritos")
    .where("user_id", Number(userId))
    .andWhere("propiedad_id", Number(propertyId))
    .del()
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

Properties.allFavoritePropertiesByUserId = (user_id) => {
  return db
    .select(
      db.raw("DISTINCT propiedades.*"),
      "imagenes.url as imageURL",
      "favoritos.id as favorito_id"
    )
    .from("propiedades")
    .leftJoin("imagenes", "propiedades.id", "imagenes.propiedad_id")
    .leftJoin("favoritos", "propiedades.id", "favoritos.propiedad_id")
    .where("favoritos.user_id", user_id)
    .then((data) => {
      // console.log("favorites:", data); // Aquí obtienes los registros de propiedades con las URLs
      return data;
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

module.exports = Properties;
