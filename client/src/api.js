import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://streamhub-api-5v9w.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("streamhub_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;