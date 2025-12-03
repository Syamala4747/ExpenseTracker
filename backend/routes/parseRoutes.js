const express = require('express');
const multer = require('multer');
const { parseReceipt } = require('../controllers/parseController');

const router = express.Router();

// use memory storage for quick OCR processing
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/receipt', upload.single('receipt'), parseReceipt);

module.exports = router;
