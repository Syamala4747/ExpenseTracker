const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "expense-tracker-users",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

// Upload Route
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("✅ Image uploaded:", req.file.path);
    res.status(200).json({ imageUrl: req.file.path });
  } catch (err) {
    console.error("🔥 Cloudinary upload error:", err);
    res.status(500).json({ error: "Image upload failed" });
  }
});



module.exports = router;
