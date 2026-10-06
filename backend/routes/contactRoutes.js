const express = require("express");
const router = express.Router();
const { submitContactInquiry, getAllInquiries } = require("../controllers/contactController");

// Public route to submit inquiry from website
router.post("/", submitContactInquiry);

// Optional route to list inquiries
router.get("/all", getAllInquiries);

module.exports = router;
