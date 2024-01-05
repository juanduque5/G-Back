const User = require("../Models/user");
// const { validationResult } = require("express-validator");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const sendGridTransport = require("nodemailer-sendgrid-transport");
// const crypto = require("crypto");
// const moment = require("moment");

exports.postProperties = async (req, res, next) => {
  const ciudad = req.body.ciudad;
  const barrio = req.body.barrio;
  const habitaciones = req.body.description;
  const banos = req.body.banos;
  const estacionamientos = req.body.estacionamientos;
  const area = req.body.area;
  const estado = req.body.estado;

  console.log("property data:", req.body);

  //   try {
  //     res.json({ message: "Dropdown authenticated", id: id });
  //   } catch (error) {
  //     if (!error.statusCode) {
  //       error.statusCode = 500;
  //     }

  //     next(error);
  //   }
};
