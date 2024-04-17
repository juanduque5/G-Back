const User = require("../Models/user");
const { checkout } = require("../Routes/auth");

exports.postOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(id);
    //Passwords for API
    const publicKey =
      "pk_live_FqzaxtPr9MbBwRFudWvnDV3dfqhG8uUGL8PDOx0Zg58PpE5C0R80YcaNA";
    const secretKey =
      "sk_live_6B7vcT4vNMe7cVFITjneJgqr8T7mHdr9eE7koxp0ebtm6ltz50hwhho6F";

    const user = await User.findById(id);
    const email = user.email;
    const name = user.first + " " + user.last;

    //user data
    const userData = {
      email: email,
      full_name: name,
    };

    // users POST
    const userResponse = await fetch("https://app.recurrente.com/api/users", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        "X-PUBLIC-KEY": publicKey,
        "X-SECRET-KEY": secretKey,
      },
      body: JSON.stringify(userData),
    });

    //if userResponse goes wrong
    if (!userResponse.ok) {
      throw new Error(`Second API returned status ${userResponse.status}`);
    }

    const dataUser = await userResponse.json();
    console.log("DATA USER -> STATUS 200 ->", dataUser);

    //Creating product
    const checkoutDetails = {
      items: [
        {
          name: "PRO PLAN (Propiedades-Ahora)",
          currency: "GTQ",
          amount_in_cents: 500,
          image_url: "",
          quantity: 1,
        },
      ],
      success_url: "https://www.google.com",
      cancel_url: "https://www.amazon.com",
      user_id: dataUser.id,
    };

    const checkoutResponse = await fetch(
      "https://app.recurrente.com/api/checkouts/",
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "X-PUBLIC-KEY": publicKey,
          "X-SECRET-KEY": secretKey,
        },
        body: JSON.stringify(checkoutDetails),
      }
    );

    if (!checkoutResponse.ok) {
      throw new Error(
        `Third API (Checkout) returned status ${await checkoutResponse.text()}`
      );
    }

    const Checkout = await checkoutResponse.json();
    const checkoutUrl = Checkout.checkout_url; // Obtener el URL del checkout
    console.log("DATA CHECKOUT -> STATUS 200 ->", Checkout);
    const checkoutId = Checkout.id;
    console.log("Checkout id:", checkoutId);

    // //Get checkout status
    // const checkoutStatus = await fetch(
    //   `https://app.recurrente.com/api/checkouts/${checkoutId}`,
    //   {
    //     method: "GET",
    //     headers: {
    //       "Content-type": "application/json",
    //       "X-PUBLIC-KEY": publicKey,
    //       "X-SECRET-KEY": secretKey,
    //     },
    //   }
    // );

    // if (!checkoutStatus.ok) {
    //   throw new Error(
    //     `Third API (Checkout) returned status ${await checkoutStatus.text()}`
    //   );
    // }
    // const status = await checkoutStatus.json();
    // console.log("status", status);

    if (Checkout) {
      //URL response
      // console.log("Checkout_url->", checkoutUrl);

      //Returning Id && url to the front-end

      return res.status(200).json({ checkout: checkoutUrl });
    } else {
      //ERROR
      return res.status(404).json({ error: "No previous order found." });
    }
  } catch (err) {
    console.log("Error creating orders:", err);
  }
};

const https = require("https");
const FormData = require("form-data");

exports.crearWebhook = (req, res) => {
  // Datos de autenticación
  console.log("Recibida solicitud en la ruta /webhook");
  // Resto del código del controlador..
  // const publicKey =
  //   "pk_live_FqzaxtPr9MbBwRFudWvnDV3dfqhG8uUGL8PDOx0Zg58PpE5C0R80YcaNA";
  // const secretKey =
  //   "sk_live_6B7vcT4vNMe7cVFITjneJgqr8T7mHdr9eE7koxp0ebtm6ltz50hwhho6F";
  // // Datos del punto final de webhook
  // const webhookUrl = "https://989c-73-231-12-222.ngrok-free.app/webhook";
  // const webhookDescription = "Mi endpoint de prueba";
  // const webhookMetadata = {};
  // // Configurar los datos del cuerpo de la solicitud
  // const data = new FormData();
  // data.append("url", webhookUrl);
  // data.append("description", webhookDescription);
  // data.append("metadata", JSON.stringify(webhookMetadata));
  // // Configurar las opciones de la solicitud
  // const options = {
  //   hostname: "app.recurrente.com",
  //   path: "/api/webhook_endpoints/",
  //   method: "POST",
  //   headers: {
  //     "X-PUBLIC-KEY": publicKey,
  //     "X-SECRET-KEY": secretKey,
  //     ...data.getHeaders(),
  //   },
  // };
  // // Realizar la solicitud HTTP
  // const reqWebhook = https.request(options, (response) => {
  //   let responseBody = "";
  //   response.on("data", (chunk) => {
  //     responseBody += chunk;
  //   });
  //   response.on("end", () => {
  //     console.log("Punto final de webhook creado correctamente:");
  //     console.log(JSON.parse(responseBody));
  //     res.json(JSON.parse(responseBody)); // Responder con la respuesta recibida
  //   });
  // });
  // reqWebhook.on("error", (error) => {
  //   console.error("Error al crear el punto final de webhook:", error);
  //   res.status(500).json({ error: "Error al crear el punto final de webhook" }); // Responder con un error en caso de fallo
  // });
  // // Enviar los datos del cuerpo de la solicitud
  // data.pipe(reqWebhook);
};

// exports.handleWebhook = async (req, res) => {
//   try {
//     console.log("Body", req.body);

//     // Validar que el campo event_type esté presente en el cuerpo de la solicitud
//     if (!req.body.event_type) {
//       throw new Error("El campo event_type es obligatorio.");
//     }

//     switch (req.body.event_type) {
//       case "payment_intent.succeeded":
//         console.log("pago completado");
//         return res.status(200).json({ message: "Pago completado" });

//       case "payment_intent.failed":
//         console.log("pago fallido");
//         return res.status(200).json({ message: "Pago fallido" });

//       default:
//         // Manejo de tipos de evento desconocidos
//         return res.status(400).json({ error: "Tipo de evento no reconocido" });
//     }
//   } catch (error) {
//     console.error("Error en la función postProcess:", error);
//     return res.status(500).json({ error: "Se produjo un error interno." });
//   }
// };
