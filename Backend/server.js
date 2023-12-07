const express = require("express");
const cors = require("cors");
const routes = require("./Routes/auth");
const db = require("./db/knex");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use("/auth", routes);

app.use((error, req, res, next) => {
  console.log("ERRROS", error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data || [];

  res.status(status).json({ message: message, data: data });
});

// console.log("hello");

app.listen(2001, () => {
  console.log("Listening to port 2001");
});
