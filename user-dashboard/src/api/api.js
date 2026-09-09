import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api'
});

API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("horizon_user_token") ||
    localStorage.getItem("horizon_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("horizon_user_token");
      localStorage.removeItem("horizon_token");
      localStorage.removeItem("horizon_user");
    }
    return Promise.reject(error);
  }
);

export default API;
