
exports.parseReceipt = async (req, res) => {
  return res.status(410).json({
    message: 'Receipt parsing endpoint has been removed. Use manual add to create expenses.'
  });
};
