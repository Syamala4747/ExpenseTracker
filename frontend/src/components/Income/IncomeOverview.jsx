import React from "react";
import CustomBarChart from "../Charts/CustomBarChart";

const IncomeOverview = ({ transactions, onAddIncome }) => {
  const chartData = transactions.map((item) => ({
    category: `${item.icon || ''} ${item.source}`,
    amount: Number(item.amount),
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Income Overview</h2>
        <button
          onClick={onAddIncome}
          className="px-4 py-2 bg-purple-600 text-white rounded-md"
        >
          + Add Income
        </button>
      </div>

      {/* 📊 Chart Section */}
      <CustomBarChart data={chartData} />
    </div>
  );
};

export default IncomeOverview;
