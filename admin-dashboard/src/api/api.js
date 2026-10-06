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
    const token = localStorage.getItem("adminToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
export default API;