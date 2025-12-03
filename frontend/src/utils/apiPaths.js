<<<<<<< HEAD
// Prefer Vite env `VITE_BASE_URL` when available, otherwise fallback to the
// previously hardcoded production URL. This allows switching base URL via
// `.env` during development or deployment.
export const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BASE_URL) || "https://expensetracker-1-k6gn.onrender.com";
=======
export const BASE_URL = "https://expensetracker-7u1c.onrender.com";                 
>>>>>>> 66e023d68d90a68764e7d8d96638eb71cd7871bb

// utils/apiPaths.js
export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    SIGNUP: "/api/v1/auth/signUp",
    GET_USER_INFO: "/api/v1/auth/getUser",
  },
  DASHBOARD: {
    GET_DATA: "/api/v1/dashboard",
  },
  INCOME: {
    ADD_INCOME: "/api/v1/income/add",
    GET_ALL_INCOME: "/api/v1/income/get",
    DELETE_INCOME: (incomeId) =>  `/api/v1/income/${incomeId}`,
    DOWNLOAD_INCOME: "/api/v1/income/downloadexcel",
  },
  EXPENSE: {
    ADD_EXPENSE: "/api/v1/expense/add",
    GET_ALL_EXPENSE: "/api/v1/expense/get",
    DELETE_EXPENSE: (expenseId) => `/api/v1/expense/${expenseId}`,
    DOWNLOAD_EXPENSE: "/api/v1/expense/downloadexcel",
  },
  IMAGE: {
UPLOAD_IMAGE: "/api/v1/upload",
  },
};
