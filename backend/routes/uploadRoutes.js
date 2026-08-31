const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { uploadFile, deleteFile } = require("../controllers/uploadController");

// Mount upload endpoint: handles both multipart/form-data ('file') and JSON base64 bodies
router.post("/", upload.single("file"), uploadFile);
router.post("/file", upload.single("file"), uploadFile);
router.post("/delete", deleteFile);
router.delete("/", deleteFile);

module.exports = router;
