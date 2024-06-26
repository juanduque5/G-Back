const db = require("../db/knex");

const Properties = {};

Properties.insertData = (
  id,
  departamento,
  municipio,
  description,
  banos,
  habitaciones,
  area,
  estado,
  tipo,
  estacionamientos,
  uso,
  currency,
  direccion,
  precio,
  lat,
  lng,
  date,
  expire
) => {
  return db("propiedades")
    .returning("*")
    .insert({
      user_id: id,
      departamento: departamento,
      municipio: municipio,
      description: description,
      banos: banos,
      habitaciones: habitaciones,
      area: area,
      estado: estado,
      tipo: tipo,
      estacionamientos: estacionamientos,
      uso: uso,
      currency: currency,
      direccion: direccion,
      precio: precio,
      latitud: lat,
      longitud: lng,
      joindate: date,
      expire_date: expire,
    })
    .then((result) => {
      return result[0];
    })
    .catch((error) => {
      // manejar el error aquí
      console.error("Error: inserting property data", error);
      throw error; // puedes personalizar la respuesta de error según tus necesidades
    });
};

//insert data for vacations
Properties.insertDataVacations = (
  id,
  departamento,
  municipio,
  description,
  banos,
  habitaciones,
  area,
  estado,
  tipo,
  estacionamientos,
  uso,
  currency,
  direccion,
  precio,
  lat,
  lng,
  date
) => {
  return db("vacations")
    .returning("*")
    .insert({
      user_id: id,
      departamento: departamento,
      municipio: municipio,
      description: description,
      banos: banos,
      habitaciones: habitaciones,
      area: area,
      estado: estado,
      tipo: tipo,
      estacionamientos: estacionamientos,
      uso: uso,
      currency: currency,
      direccion: direccion,
      precio: precio,
      latitud: lat,
      longitud: lng,
      joindate: date,
    })
    .then((result) => {
      return result[0];
    })
    .catch((error) => {
      // manejar el error aquí
      console.error("Error: inserting property data", error);
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
    .orderBy("propiedades.id", "desc") // Ordenar por la columna propiedades.id en orden descendente
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
    .orderBy("propiedades.id", "desc") // Ordenar por la columna propiedades.id en orden descendente
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
  return db("propiedades")
    .select("propiedades.*", "favoritos.propiedad_id as Favorite_id")
    .from("propiedades")
    .leftJoin("favoritos", "propiedades.id", "favoritos.propiedad_id")
    .where("propiedades.id", id)
    .then((data) => {
      // Aquí tendrás acceso a todas las columnas de propiedades y solo la columna propiedad_id de favoritos
      return data;
    })
    .catch((error) => {
      console.error("ERROR: properties by id ", error);
      throw error;
    });
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

//insert image for vacations
Properties.insertImageVacations = (id, url) => {
  //insert an image url and associate it with a property id
  return db("imagenesvacations")
    .returning("*")
    .insert({
      vacations_id: id,
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

//vacations
Properties.propertiesInfoAndImagesByIdVacations = (id) => {
  return db
    .select("vacations.*", "imagenesvacations.url as imageURL")
    .from("vacations")
    .leftJoin(
      "imagenesvacations",
      "vacations.id",
      "imagenesvacations.vacations_id"
    )
    .where("vacations.user_id", id)
    .then((data) => {
      // console.log("todas las propiedades:", data); // Aquí obtienes los registros de propiedades con las URLs
      return data;
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

//vacations
Properties.propertyByIdVacations = (id) => {
  // Encontrar propiedad por su id en la tabla vacations
  return db("vacations")
    .where("id", id)
    .then((data) => {
      // Aquí tendrás acceso a todas las columnas de la propiedad en vacations con el id especificado
      return data;
    })
    .catch((error) => {
      console.error("ERROR: properties by id ", error);
      throw error;
    });
};

//allvacation properties no id
Properties.allVacations = () => {
  //if a user is not authenticated, it will just search for all the properties
  return db
    .select("vacations.*", "imagenesvacations.url as imageURL")
    .from("vacations")
    .leftJoin(
      "imagenesvacations",
      "vacations.id",
      "imagenesvacations.vacations_id"
    )
    .orderBy("vacations.id", "desc") // Ordenar por la columna propiedades.id en orden descendente
    .then((data) => {
      // console.log("todas las propiedades:", data); // Aquí obtienes los registros de propiedades con las URLs
      return data;
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

//vacation images
Properties.searchImagesByIdVacations = (id) => {
  //Find all urls that have a property id
  return db
    .select("imagenesvacations.url as imageURL.")
    .from("vacations")
    .leftJoin(
      "imagenesvacations",
      "vacations.id",
      "imagenesvacations.vacations_id"
    )
    .where("vacations_id", id) // Reemplaza tuIdEspecifico con el valor que estás buscando
    .then((data) => {
      // Aquí obtienes los registros de propiedades con las URLs
      return data;
    })
    .catch((error) => {
      console.error("ERROR al obtener las imageURL:", error);
      throw error;
    });
};

//vacation update
Properties.updateDataVacations = (
  propertyId,
  user_id,
  departamento,
  municipio,
  description,
  banos,
  habitaciones,
  area,
  estado,
  estacionamientos,
  currency,
  direccion,
  precio,
  lat,
  lng
) => {
  return db("vacations")
    .where({ id: propertyId }) // Filtra la propiedad que deseas actualizar por su ID
    .update({
      user_id: user_id,
      departamento: departamento,
      municipio: municipio,
      description: description,
      banos: banos,
      habitaciones: habitaciones,
      area: area,
      estado: estado,
      estacionamientos: estacionamientos,
      currency: currency,
      direccion: direccion,
      precio: precio,
      latitud: lat,
      longitud: lng,
    })
    .then(() => {
      // No necesitas retornar nada en un update exitoso, pero puedes hacerlo si lo deseas
      return true;
    })
    .catch((error) => {
      // Manejar el error aquí
      console.error("Error: updating property data", error);
      throw error; // Puedes personalizar la respuesta de error según tus necesidades
    });
};

//vacation delete images
Properties.deleteImagesEditVacations = (id, url) => {
  return db("imagenesvacations")
    .where({
      vacations_id: id,
      url: url,
    })
    .del()
    .then((numDeleted) => {
      return numDeleted;
    })
    .catch((err) => {
      console.error("Error al eliminar imagenes en edit:", err);
    });
};

//vacation
Properties.vacationsPropertyById = (id) => {
  // Encuentra la propiedad por su ID
  return db("vacations")
    .where("id", id)
    .then((data) => {
      // Aquí tendrás acceso a todas las columnas de propiedades
      return data;
    })
    .catch((error) => {
      console.error("ERROR: properties by id ", error);
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

//returning all favorties properties by user id
Properties.allFavoritePropertiesByUserId = (user_id) => {
  return db
    .select(
      "propiedades.id",
      "propiedades.user_id",
      "propiedades.departamento",
      "propiedades.municipio",
      "propiedades.description",
      "propiedades.banos",
      "propiedades.habitaciones",
      "propiedades.area",
      "propiedades.estado",
      "propiedades.tipo",
      "propiedades.estacionamientos",
      "propiedades.uso",
      "propiedades.precio",
      "imagenes.url as imageURL",
      "favoritos.id as favorito_id"
    )
    .from(function () {
      this.select(
        "id",
        "user_id",
        "departamento",
        "municipio",
        "description",
        "banos",
        "habitaciones",
        "area",
        "estado",
        "tipo",
        "estacionamientos",
        "uso",
        "precio"
      )
        .from("propiedades")
        .as("propiedades");
    })
    .leftJoin("imagenes", "propiedades.id", "imagenes.propiedad_id")
    .leftJoin("favoritos", "propiedades.id", "favoritos.propiedad_id")
    .where("favoritos.user_id", user_id)
    .then((data) => {
      console.log("favorites:", data);
      return data;
    })
    .catch((error) => {
      console.error("ERROR: todas las propiedades:", error);
      throw error;
    });
};

//Find all cities
Properties.allDepartamentos = () => {
  return db("departamentos")
    .select("nombre")
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error("ERROR: finding all departamentos");
      throw error;
    });
};

//Find all localities acording to its city
Properties.findMunicipios = (departamento) => {
  return db
    .select("municipios.nombre")
    .from("municipios")
    .leftJoin("departamentos", "municipios.departamento_id", "departamentos.id")
    .where("departamentos.nombre", departamento)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error("ERROR: finding all departamentos");
      throw error;
    });
};

//Find both
Properties.allCitiesAndLocalities = () => {
  return db
    .distinct()
    .select(
      "departamentos.nombre AS departamentos*",
      "municipios.nombre AS municipios*"
    )
    .from("departamentos")
    .leftJoin("municipios", "departamentos.id", "municipios.departamento_id")
    .then((data) => {
      // console.log("query autoComplete search cities", data);
      return data;
    })
    .catch((error) => {
      console.error("ERROR: query autocomplete guatemala cities");
      throw error;
    });
};

//handle homeSearch No Auth
Properties.homeSearch = (
  casa,
  apartamento,
  local,
  lote,
  venta,
  renta,
  location,
  bathrooms,
  bedrooms,
  minPrice,
  maxPrice
) => {
  return db
    .distinct()
    .select("propiedades.*", "imagenes.url as imageURL") // Aquí se agrega la selección de columnas
    .from("propiedades")
    .leftJoin("imagenes", "propiedades.id", "imagenes.propiedad_id")
    .where((builder) => {
      if (location.trim() !== "") {
        builder.where("municipio", location);
      }
    })
    .andWhere(function () {
      if (casa !== false) {
        this.orWhere("tipo", casa);
      }
      if (apartamento !== false) {
        this.orWhere("tipo", apartamento);
      }
      if (local !== false) {
        this.orWhere("tipo", local);
      }
      if (lote !== false) {
        this.orWhere("tipo", lote);
      }
    })
    .andWhere(function () {
      if (venta !== false) {
        this.orWhere("uso", venta);
      }
      if (renta !== false) {
        this.orWhere("uso", renta);
      }
    })
    .andWhere(function () {
      if (bathrooms !== false) {
        this.where("banos", bathrooms);
      }
      if (bedrooms !== false) {
        this.where("habitaciones", bedrooms);
      }
    })
    .andWhere(function () {
      if (minPrice !== false && maxPrice !== false) {
        this.whereBetween("precio", [minPrice, maxPrice]);
      }
    })

    .then((data) => {
      console.log(data);
      return data;
    })
    .catch((error) => {
      console.error("ERROR: homeSearch");
      throw error;
    });
};

//HomeSearch is Auth
Properties.homeSearchIsAuth = (
  casa,
  apartamento,
  local,
  lote,
  venta,
  renta,
  location,
  id,
  bathrooms,
  bedrooms,
  minPrice,
  maxPrice
) => {
  return db
    .distinct()
    .select(
      "propiedades.*",
      "imagenes.url as imageURL",
      "favoritos.id as favorito_id" // Agregar la selección de la columna de favoritos
    )
    .from("propiedades")
    .leftJoin("imagenes", "propiedades.id", "imagenes.propiedad_id")
    .leftJoin("favoritos", function () {
      this.on("propiedades.id", "=", "favoritos.propiedad_id") // Unir la tabla de favoritos
        .andOn("favoritos.user_id", "=", Number(id)); // Filtrar por usuario
    })
    .where((builder) => {
      if (location.trim() !== "") {
        builder.where("municipio", location);
      }
    })
    .andWhere(function () {
      if (casa !== false) {
        this.orWhere("tipo", casa);
      }
      if (apartamento !== false) {
        this.orWhere("tipo", apartamento);
      }
      if (local !== false) {
        this.orWhere("tipo", local);
      }
      if (lote !== false) {
        this.orWhere("tipo", lote);
      }
    })
    .andWhere(function () {
      if (venta !== false) {
        this.orWhere("uso", venta);
      }
      if (renta !== false) {
        this.orWhere("uso", renta);
      }
    })
    .andWhere(function () {
      if (bathrooms !== false) {
        this.where("banos", bathrooms);
      }
      if (bedrooms !== false) {
        this.where("habitaciones", bedrooms);
      }
    })
    .andWhere(function () {
      if (minPrice !== false && maxPrice !== false) {
        this.whereBetween("precio", [minPrice, maxPrice]);
      }
    })
    .then((data) => {
      console.log(data);
      return data;
    })
    .catch((error) => {
      console.error("ERROR: homeSearch");
      throw error;
    });
};

//Delete images in edit
Properties.deleteImagesEdit = (id, url) => {
  return db("imagenes")
    .where({
      propiedad_id: id,
      url: url,
    })
    .del()
    .then((numDeleted) => {
      return numDeleted;
    })
    .catch((err) => {
      console.error("Error al eliminar imagenes en edit:", err);
    });
};

//Update property data
Properties.updateData = (
  propertyId,
  user_id,
  departamento,
  municipio,
  description,
  banos,
  habitaciones,
  area,
  estado,
  estacionamientos,
  currency,
  direccion,
  precio,
  lat,
  lng
) => {
  return db("propiedades")
    .where({ id: propertyId }) // Filtra la propiedad que deseas actualizar por su ID
    .update({
      user_id: user_id,
      departamento: departamento,
      municipio: municipio,
      description: description,
      banos: banos,
      habitaciones: habitaciones,
      area: area,
      estado: estado,
      estacionamientos: estacionamientos,
      currency: currency,
      direccion: direccion,
      precio: precio,
      latitud: lat,
      longitud: lng,
    })
    .then(() => {
      // No necesitas retornar nada en un update exitoso, pero puedes hacerlo si lo deseas
      return true;
    })
    .catch((error) => {
      // Manejar el error aquí
      console.error("Error: updating property data", error);
      throw error; // Puedes personalizar la respuesta de error según tus necesidades
    });
};

//Properties count for subscribers
Properties.countProperties = (userId) => {
  return db("subscribers")
    .select(
      "freeproperties",
      "proproperties",
      "availableproperties",
      "freeplan",
      "proplan"
    )
    .where("user_id", userId)
    .first()
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error("Error al obtener el número de propiedades:", error);
      throw error;
    });
};

//update freeplan
Properties.updateFreePlanToFalse = (userId) => {
  return db("subscribers")
    .where("user_id", userId)
    .update({ freeplan: false })
    .then(() => {
      console.log(
        "¡Actualización exitosa del campo freeplan a false para el usuario con ID:",
        userId
      );
    })
    .catch((error) => {
      console.error("Error al actualizar freeplan:", error);
      throw error;
    });
};

//update proplan to false
Properties.updateProPlanToFalse = (userId) => {
  return db("subscribers")
    .where("user_id", userId)
    .update({ proplan: false })
    .then(() => {
      console.log(
        "¡Actualización exitosa del campo freeplan a false para el usuario con ID:",
        userId
      );
    })
    .catch((error) => {
      console.error("Error al actualizar proplan:", error);
      throw error;
    });
};

//update proplan to true afterr completing payment
Properties.updateProPlanToTrue = (userId) => {
  return db("subscribers")
    .where("user_id", userId)
    .update({ proplan: true })
    .then(() => {
      console.log(
        "¡Actualización exitosa del campo proplan a true para el usuario con ID:",
        userId
      );
    })
    .catch((error) => {
      console.error("Error al actualizar proplan:", error);
      throw error;
    });
};

//
Properties.updateBook = (propertyId) => {
  return db("vacations")
    .where("id", propertyId)
    .update({ booked: true })
    .then(() => {
      console.log(
        "¡Actualización exitosa del campo proplan a true para el usuario con ID:",
        propertyId
      );
    })
    .catch((error) => {
      console.error("Error al actualizar proplan:", error);
      throw error;
    });
};

//decrement numproperties
Properties.updatePropertiesInc = (userId) => {
  return db.transaction(async (trx) => {
    try {
      // Obtener el número actual de propiedades del usuario
      const currentProperties = await db("subscribers")
        .select("freeproperties", "availableproperties", "proproperties")
        .where("user_id", userId)
        .first()
        .transacting(trx);

      // Decrementar las propiedades solo si son mayores que 0
      let newFreeProperties = currentProperties.freeproperties;
      let newAvailableProperties = currentProperties.availableproperties;

      if (currentProperties.freeproperties > 0) {
        newFreeProperties = currentProperties.freeproperties - 1;
      }

      if (currentProperties.availableproperties > 0) {
        newAvailableProperties = currentProperties.availableproperties - 1;
      }

      // Incrementar la columna proproperties si es mayor o igual a 0
      let newProProperties = currentProperties.proproperties;
      if (currentProperties.proproperties >= 0) {
        newProProperties = currentProperties.proproperties + 1;
      }

      // Actualizar las propiedades en la base de datos
      await db("subscribers")
        .where("user_id", userId)
        .update({
          freeproperties: newFreeProperties,
          availableproperties: newAvailableProperties,
          proproperties: newProProperties,
        })
        .transacting(trx);

      // Confirmar la transacción
      await trx.commit();

      return {
        freeproperties: newFreeProperties,
        availableproperties: newAvailableProperties,
        proproperties: newProProperties,
      }; // Devolver las nuevas propiedades
    } catch (error) {
      // Revertir la transacción en caso de error
      await trx.rollback();
      console.error("Error al actualizar las propiedades:", error);
      throw error;
    }
  });
};

//vacationSearch
Properties.vacationSearch = (location, guests) => {
  return (
    db
      .distinct()
      .select("vacations.*", "imagenesvacations.url as imageURL") // Aquí se agrega la selección de columnas
      .from("vacations")
      .leftJoin(
        "imagenesvacations",
        "vacations.id",
        "imagenesvacations.vacations_id"
      )
      .where((builder) => {
        if (location.trim() !== "") {
          builder.where("municipio", location);
        }
      })
      .andWhere(function () {
        if (guests !== false) {
          this.where("habitaciones", guests);
        }
      })
      // .orWhere(function () {
      //   if (checkInDate !== false) {
      //     this.where("checkin", checkInDate);
      //   }
      // })
      // .orWhere(function () {
      //   if (checkOutDate !== false) {
      //     this.where("checkout", checkOutDate);
      //   }
      // })
      .then((data) => {
        console.log(data);
        return data;
      })
      .catch((error) => {
        console.error("ERROR: homeSearch");
        throw error;
      })
  );
};

module.exports = Properties;
