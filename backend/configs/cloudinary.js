const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "pt6ikhli",
  api_key: process.env.CLOUDINARY_API_KEY || "471869559667157",
  api_secret: process.env.CLOUDINARY_API_SECRET || "h_ZlyUwEomAkJctr97ho1XYa77I",
  secure: true,
});

module.exports = cloudinary;
