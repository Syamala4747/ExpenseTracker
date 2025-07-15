import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-md rounded-md px-4 py-2 border border-gray-200">
        <p className="text-sm font-semibold text-purple-700 mb-1">
          {payload[0].payload.category}
        </p>
        <p className="text-sm text-gray-700">
          Amount: <span className="font-bold">${payload[0].payload.amount}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarChart = ({ data }) => {
  return (
    <div className="bg-white mt-6 rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4"></h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          barSize={100000}
          margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
        >
          <CartesianGrid stroke="transparent" />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: "#555" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#555" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="amount"
            fill="#7c3aed"
            radius={[12, 12, 12, 12]} // rounded all sides for that bubble look
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
