const express = require("express");
const cors = require("cors");
const routes = require("./Routes/auth");
const routes2 = require("./Routes/properties");
const routes3 = require("./Routes/vacations");
const db = require("./db/knex");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use("/auth", routes);
app.use("/properties", routes2);
app.use("/vacations", routes3);

app.use((error, req, res, next) => {
  console.error("ERRORS", error);

  const status = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  const data = error.data || [];

  res.status(status).json({ message: message, data: data });
});

// console.log("hello");

app.listen(2001, () => {
  console.log("Listening to port 2001");
});
