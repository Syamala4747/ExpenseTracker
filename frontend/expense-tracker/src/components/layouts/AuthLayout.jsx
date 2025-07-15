import React from "react";
import CARD_2 from "../../assets/images/card2.png";
import { LuTrendingUpDown } from "react-icons/lu";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex w-screen h-screen relative">
      {/* Left section */}
      <div className="w-full md:w-[60vw] flex flex-col px-12 pt-8 pb-12 relative">
        <h2 className="text-lg font-medium text-black">Expense Tracker</h2>
        {children}
      </div>

      {/* Right section */}
      <div className="hidden md:block w-[40vw] h-screen bg-violet-50 bg-auth-bg-img bg-cover bg-no-repeat bg-center overflow-hidden p-8 relative">
        {/* Decorative shapes */}
        <div className="w-48 h-48 rounded-[40px] bg-purple-600 absolute -top-7 left-5" />
        <div className="w-48 h-56 rounded-[40px] border-[20px] border-fuchsia-600 absolute top-[30%] -right-10" />
        <div className="w-48 h-48 rounded-[40px] bg-violet-500 absolute -bottom-7 -left-5" />

        {/* Stats card at top */}
        <div className="relative z-20 mt-4">
          <StatsInfoCard
            icon={<LuTrendingUpDown />}
            label="Track Your Income and Expenses"
            value="430,000"
            color="bg-primary"
          />
        </div>

        {/* Card image at bottom */}
        <img
          src={CARD_2}
          className="w-64 lg:w-[90%] absolute bottom-10 shadow-lg shadow-blue-400/15"
          alt="Card decoration"
        />
      </div>
    </div>
  );
};

export default AuthLayout;

const StatsInfoCard = ({ icon, label, value, color }) => {
  return (
    <div className="flex gap-6 bg-white p-4 rounded-xl shadow-md shadow-purple-400/10 border border-gray-200/50 w-full max-w-sm">
      <div
        className={`w-12 h-12 flex items-center justify-center text-[26px] text-white ${color} rounded-full drop-shadow-xl`}
      >
        {icon}
      </div>
      <div>
        <h6 className="text-xs text-gray-500 mb-1">{label}</h6>
        <span className="text-[20px] font-semibold">${value}</span>
      </div>
    </div>
  );
};
