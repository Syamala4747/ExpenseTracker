import moment from 'moment';

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
export const validatePassword = (password) => {
  // Requires:
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one digit
  // - At least one special character
  // - Minimum length of 8 characters
  const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return regex.test(password);
};

export const getInitials = (name) => {
  if(!name) return "";
  const words = name.trim().split(/\s+/); // split on whitespace
  let initials = "";
  for (let i = 0; i < Math.min(words.length, 2); i++) {
    initials += words[i][0].toUpperCase();
  }
  return initials;
};


export const addThousandsSeparator=(num)=>{
  if(num==null ||isNaN(num)) return "";
  const [integerPart,fractionalPart] =num.toString().split(".");
  const formattedInteger =integerPart.replace(/\B(?=(\d{3})+(?!\d))/g,"");
   return  fractionalPart?`${formattedInteger}.${fractionalPart}`
   :formattedInteger;

};


export const prepareExpenseBarChartData = (data = []) => {
  const chartData = data.map((item) => ({
    category: item?.category,
    amount: item?.amount,
  }));

  return chartData;
}


export const prepareIncomeBarChartData =(data =[]) =>{
const sortedData=[...data].sort((a,b) => new Date(a.date) - new Date(b.date));
 
  const charData =sortedData.map((item)=>({
month:moment(item?.date).format('Do MMM'),
amount:item?.amount,
source:item?.source

}));
return charData;
};

export const prepareExpenseLineChartData= (data = []) => {
  const sortedData=[...data].sort((a,b) =>new Date(a.date) - new Date(b.date));
  const chartData =sortedData.map((item)=>({
month:moment(item?.date).format('Do MMM'),
amount:item?.amount,
category:item?.category,
}));
return chartData;
}