const User = require("../Models/user");
const moment = require("moment");
// const { checkout } = require("../Routes/auth");

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

    console.log("USER", userData);
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

    if (!userResponse.ok) {
      throw new Error(`Second API returned status ${userResponse.status}`);
    }

    const dataUser = await userResponse.json();
    console.log("DATA USER -> STATUS 200 ->", dataUser);

    //product data

    const product2 = {
      product: {
        name: "Otro Ejemplo",
        prices_attributes: [
          {
            amount_as_decimal: 5,
            currency: "GTQ",
            charge_type: "one_time",
          },
        ],
        //CREAR TU PROPIO PAGINA DE SUCCESS O CANCEL
        success_url: "https://www.google.com/",
        cancel_url: "https://www.amazon.com/",
      },
    };

    //product request
    const product2Response = await fetch(
      "https://app.recurrente.com/api/products",
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "X-PUBLIC-KEY": publicKey,
          "X-SECRET-KEY": secretKey,
        },
        body: JSON.stringify(product2),
      }
    );

    if (!product2Response.ok) {
      throw new Error(
        `Second API (PRODUCT 2) returned status ${await product2Response.text()}`
      );
    }

    const dataProduct2 = await product2Response.json();
    console.log("DATA PRODUCT2 -> STATUS 200 ->", dataProduct2);
    console.log("DATA PRODUCT2 -> STATUS 200 ->", dataProduct2.id);

    //checkout data
    const productData = {
      user_id: dataUser.id,
      items: [
        {
          price_id: dataProduct2.prices[0].id,
          quantity: 1,
        },
      ],
    };

    console.log("product data", productData);

    //Checkout POST
    const productResponse = await fetch(
      "https://app.recurrente.com/api/checkouts",
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "X-PUBLIC-KEY": publicKey,
          "X-SECRET-KEY": secretKey,
        },
        body: JSON.stringify(productData),
      }
    );

    // catching error from checkoutResponse
    if (!productResponse.ok) {
      throw new Error(
        `Third API (Checkout) returned status ${await productResponse.text()}`
      );
    }

    const productCheckout = await productResponse.json();
    const checkoutUrl = productCheckout.checkout_url; // Obtener el URL del checkout
    console.log("DATA CHECKOUT -> STATUS 200 ->", productCheckout);

    //////////

    //Checking if URL was recieved
    if (checkoutUrl) {
      //URL response
      console.log("Checkout_url->", checkoutUrl);

      const currentDate = moment().format("MM-DD-YYYY");
      console.log(currentDate);

      const paymentId = await User.insertPayment(
        id,
        currentDate,
        dataProduct2.id
      );

      console.log("payment id", paymentId);

      return res.status(200).json({ checkoutUrl: checkoutUrl });
    } else {
      //ERROR
      return res.status(404).json({ error: "No previous order found." });
    }
  } catch (err) {
    console.log("Error creating orders:", err);
    res.status(500).json("Unable to create orders");
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const data = await User.getAllUsersWithPayments();
    res.status(200).json({
      data: data,
    });
  } catch (err) {
    console.log("Error creating orders:", err);
    res.status(500).json("Unable to create orders");
  }
};
