const xlsx = require("xlsx");
const Income = require("../models/Income");

// Add Income Source
exports.addIncome = async (req, res) => {
  const userId = req.user.id;
  try {
    const { icon, source, amount, date } = req.body;
    console.log('>>> addIncome body:', req.body); // log the request body

    if (!source || !amount || !date) {
      console.error('❌ Missing fields:', req.body);
      return res.status(400).json({ message: "All fields are required" });
    }

    const newIncome = new Income({
      userId,
      icon,
      source,
      amount,
      date: new Date(date),
    });

    await newIncome.save();
    console.log('✅ Saved newIncome:', newIncome); // log saved record
    res.status(200).json(newIncome);
  } catch (error) {
    console.error('❌ Error in addIncome:', error); // log the full error
    res.status(500).json({ message: "Server Error", error: error.message }); // send error message
  }
};

// Get All Income Source
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;
  try {
    const income = await Income.find({ userId }).sort({ date: -1 });
    res.status(200).json(income);
  } catch (error) {
    console.error('❌ Error in getAllIncome:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete Income Source
exports.deleteIncome = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error('❌ Error in deleteIncome:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Download Excel
exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;
  try {
    const income = await Income.find({ userId }).sort({ date: -1 });

    const data = income.map((item) => ({
      Source: item.source,
      Amount: item.amount,
      Date: item.date,
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Income");
    xlsx.writeFile(wb, "income_details.xlsx");

    res.download("income_details.xlsx");
  } catch (error) {
    console.error('❌ Error in downloadIncomeExcel:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
