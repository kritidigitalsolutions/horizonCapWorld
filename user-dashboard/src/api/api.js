import axios from "axios";

const defaultBaseUrl =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000/api"
    : "https://api.horizoncapworld.com/api";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
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
