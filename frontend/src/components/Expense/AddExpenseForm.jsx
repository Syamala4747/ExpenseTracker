import React, { useState } from "react";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";
// Receipt upload removed — manual add only
import toast from 'react-hot-toast';

const AddExpenseForm = ({ onAddExpense }) => {
  const [income, setIncome] = useState({
    category: "",
    amount: "",
    date: "",
    icon: "",
  });

  // when parsed receipt data comes back, prefill fields
  const handleParsed = (data) => {
    if (!data) return;
    setIncome((prev) => ({
      ...prev,
      amount: data.amount || prev.amount,
      date: data.date || prev.date,
      category: data.category || prev.category,
    }));

    // If parsed data includes category, amount and date, auto-submit the expense
    const hasAmount = data.amount !== null && data.amount !== undefined && data.amount !== '';
    const hasCategory = data.category && String(data.category).trim().length > 0;
    const hasDate = data.date && String(data.date).trim().length > 0;

    if (hasAmount && hasCategory && hasDate) {
      // Convert amount to number
      const payload = {
        category: String(data.category).trim(),
        amount: Number(data.amount),
        date: String(data.date),
        icon: income.icon || ''
      };
      // give the user a quick toast and then call onAddExpense
      toast.success('Parsed receipt — adding expense');
      try {
        onAddExpense(payload);
      } catch (e) {
        console.error('Auto-add expense failed', e);
      }
    } else {
      // If we don't have all fields, notify user to confirm
      toast('Receipt parsed — please confirm or edit fields before adding');
    }
  };

  const handleChange = (key, value) => setIncome({ ...income, [key]: value });

  return (
    <div>
      <EmojiPickerPopup
        icon={income.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />
      <div className="mb-3">
        <label className="text-sm font-medium">Add manually</label>
      </div>
      <Input
        value={income.category}
        onChange={({ target }) => handleChange("category", target.value)}
        label="Category"
        placeholder="e.g : Food, Transport, etc."
      />

      

       <Input
        value={income.amount}
        onChange={({ target }) => handleChange("amount", target.value)}
        label="Amount"
        placeholder="Enter Amount"
        type="number"
      />
       <Input
        value={income.date}
        onChange={({ target }) => handleChange("date", target.value)}
        label="Date"
        placeholder=""
        type="date"
      />

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="add-btn add-btn-fill"
          onClick={()=>onAddExpense(income)}
        >
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default AddExpenseForm;

