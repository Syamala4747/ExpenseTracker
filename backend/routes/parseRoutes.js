const express = require('express');
const router = express.Router();

// Parse endpoint has been removed. Return 410 Gone to callers.
router.post('/receipt', (req, res) => {
	return res.status(410).json({ message: 'Receipt parsing endpoint removed. Use manual add.' });
});

module.exports = router;
