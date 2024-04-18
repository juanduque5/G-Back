const db = require("../db/knex");
const moment = require("moment");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

require("dotenv").config();

const awsAccess = process.env.AWS_ACCESS_KEY_ID;
const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION;
const s3Bucket = process.env.S3_BUCKET;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccess,
    secretAccessKey: awsSecret,
  },
  region: awsRegion,
});

async function eliminarImagenesExpiradas() {
  try {
    // Calcula la fecha límite (hace 30 días)
    // const fechaLimite = moment().subtract(30, "days").format("MM-DD-YYYY");

    // // Obtén las propiedades que tienen una fecha de joindate anterior a la fecha límite
    // const propiedadesExpiradas = await db("propiedades").where(
    //   "joindate",
    //   ">",
    //   fechaLimite
    // );

    // // Elimina las propiedades expiradas y sus imágenes asociadas
    // for (const propiedad of propiedadesExpiradas) {
    //   // Obtén las imágenes asociadas a la propiedad
    //   const imagenes = await db("imagenes").where("propiedad_id", propiedad.id);

    //   // Elimina las imágenes de la base de datos
    //   await db("imagenes").where("propiedad_id", propiedad.id).del();

    //   // Elimina las imágenes de Amazon S3
    //   for (const imagen of imagenes) {
    //     const params = {
    //       Bucket: s3Bucket,
    //       Key: imagen.url, // Reemplaza 'nombre' con el campo que almacena el nombre de la imagen en tu tabla
    //     };
    //     await s3
    //       .send(new DeleteObjectCommand(params))
    //       .then(() => {
    //         console.log("Objecto borrado exitosamente");
    //       })
    //       .catch((error) => {
    //         console.error("Error al borrar el objeto:", error);
    //       });
    //   }

    //   // Elimina la propiedad de la base de datos
    //   await db("propiedades").where("id", propiedad.id).del();
    // }

    console.log(
      "Propiedades y sus imágenes expiradas eliminadas correctamente."
    );
  } catch (error) {
    console.error("Error al eliminar propiedades e imágenes expiradas:", error);
    throw error;
  }
}

setInterval(eliminarImagenesExpiradas, 5 * 1000); // 5 segundos * 1000 milisegundos

// Ejecuta la función para eliminar las imágenes expiradas cada día
// 60 segundos * 1000 milisegundos
