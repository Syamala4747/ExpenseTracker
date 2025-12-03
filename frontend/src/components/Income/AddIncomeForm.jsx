import React, { useState } from 'react';
import Input from '../Inputs/Input';
import EmojiPickerPopup from '../EmojiPickerPopup';

const AddIncomeForm = ({ onAddIncome }) => {
  const [income, setIncome] = useState({
    source: '',
    amount: '',
    date: '',
    icon: '',
  });

  const handleChange = (key, value) => {
    setIncome((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Optional validation
    if (!income.source || !income.amount || !income.date) {
      alert('Please fill all the required fields.');
      return;
    }

    console.log('Submitting income:', income); // ✅ Debug log
    onAddIncome(income);
    // Reset the form
    setIncome({ source: '', amount: '', date: '', icon: '' });
  };

  return (
    <div className="bg-white rounded-xl p-6 space-y-4">
    <EmojiPickerPopup
  icon={income.icon}
  onSelect={(emojiChar) => {
    console.log("👉 Received in parent:", emojiChar);
    handleChange("icon", emojiChar);
  }}
/>


{income.icon && (
  <div className="text-2xl">
    ✅ Selected Icon: {income.icon}
  </div>
)}
      <Input
        value={income.source}
        onChange={({ target }) => handleChange('source', target.value)}
        label="Income Source"
        placeholder="Freelance, Salary, etc"
        type="text"
      />

      <Input
        value={income.amount}
        onChange={({ target }) => handleChange('amount', target.value)}
        label="Amount"
        placeholder="Enter the Amount"
        type="number"
      />

      <Input
        value={income.date}
        onChange={({ target }) => handleChange('date', target.value)}
        label="Date"
        type="date"
      />

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          className="add-btn add-btn-fill"
        >
          Add Income
        </button>
      </div>
    </div>
  );
};

export default AddIncomeForm;
