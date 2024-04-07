const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const Vacations = require("../Models/vacations");
const sharp = require("sharp");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
// const { all } = require("../Routes/properties");

require("dotenv").config();
const moment = require("moment");

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const awsAccess = process.env.AWS_ACCESS_KEY_ID;
const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION;
const s3Bucket = process.env.S3_BUCKET;
const geoKey = process.env.GEO_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: awsAccess,
    secretAccessKey: awsSecret,
  },
  region: awsRegion,
});

exports.getSearchProperty = async (req, res, next) => {
  const InDate = moment(req.query.checkInDate);
  const OutDate = moment(req.query.checkOutDate);
  const checkInDate = InDate.format("MM-DD-YYYY");
  const checkOutDate = OutDate.format("MM-DD-YYYY");
  console.log(checkInDate);
  console.log("CheckOutDate:", checkOutDate);
  console.log("Location:", req.query.location);
  console.log("Guests:", req.query.guests);

  //   const formattedToday = req.query.checkInDate.format("MM-DD-YYYY"); // Formatear la fecha como 'YYYY-MM-DD'

  //   console.log(formattedToday);
};
