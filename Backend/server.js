const express = require("express");
const cors = require("cors");
const moment = require("moment");
const routes = require("./Routes/auth");
const routes2 = require("./Routes/properties");
const routes3 = require("./Routes/vacations");
const routes4 = require("./Routes/payments");
const db = require("./db/knex");
const bodyParser = require("body-parser");
const User = require("./Models/user");
const Properties = require("./Models/properties");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use("/auth", routes);
app.use("/properties", routes2);
app.use("/vacations", routes3);
app.use("/payments", routes4);

app.use((error, req, res, next) => {
  console.error("ERRORS", error);

  const status = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  const data = error.data || [];

  res.status(status).json({ message: message, data: data });
});

app.post("/process_recurrente", async (req, res) => {
  const productId = req.body.product.id;

  console.log("Body", req.body);
  switch (req.body.event_type) {
    case "payment_intent.succeeded":
      const success = await User.updatePayment(productId, "complete");
      const updatePro = await Properties.updateProPlanToTrue210(
        success.updated_user_id
      );
      console.log(
        "Estado del pago actualizado:",
        success.payment_status,
        updatePro
      );
      return res.status(200).json("Pago completado");

    case "payment_intent.failed":
      const failed = await User.updatePayment(productId, "failed");
      console.log("Estado del pago actualizado:", failed.payment_status);
      return res.status(200).json("Pago fallido");

    default:
      return res.status(400).json("Tipo de evento no reconocido");
  }
});

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
    // Obtén la fecha de hoy en el formato adecuado
    const fechaHoy = moment().format("YYYY-MM-DD");

    // Obtén las propiedades donde expire_date es igual a la fecha de hoy
    const propiedadesExpiradas = await db("propiedades").where(
      "expire_date",
      fechaHoy
    );

    // Elimina las propiedades expiradas y sus imágenes asociadas
    for (const propiedad of propiedadesExpiradas) {
      // Obtén las imágenes asociadas a la propiedad
      const imagenes = await db("imagenes").where("propiedad_id", propiedad.id);

      // Elimina las imágenes de la base de datos
      await db("imagenes").where("propiedad_id", propiedad.id).del();

      // Elimina las imágenes de Amazon S3
      for (const imagen of imagenes) {
        const params = {
          Bucket: s3Bucket,
          Key: imagen.url, // Reemplaza 'nombre' con el campo que almacena el nombre de la imagen en tu tabla
        };
        await s3
          .send(new DeleteObjectCommand(params))
          .then(() => {
            console.log("Objecto borrado exitosamente");
          })
          .catch((error) => {
            console.error("Error al borrar el objeto:", error);
          });
      }

      // Elimina la propiedad de la base de datos
      await db("propiedades").where("id", propiedad.id).del();
    }

    console.log(
      "Propiedades y sus imágenes expiradas eliminadas correctamente."
    );
  } catch (error) {
    console.error("Error al eliminar propiedades e imágenes expiradas:", error);
    throw error;
  }
}

// setInterval(eliminarImagenesExpiradas, 5 * 1000);

app.listen(2001, () => {
  console.log("Listening to port 2001");
});
