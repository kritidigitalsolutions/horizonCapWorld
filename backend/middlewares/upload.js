const multer = require("multer");

// Use memory storage for direct streaming/buffer upload to Cloudinary
const storage = multer.memoryStorage();

// File filter supporting common images, documents, pdfs, audio and videos
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Documents & PDFs
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    // Videos
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

// 50MB file size limit
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = upload;
