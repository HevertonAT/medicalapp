import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token (se você usa auth)
api.interceptors.request.use((config) => {
  try {
    // Usar a mesma chave que o restante do frontend (`medical_token`)
    const token = localStorage.getItem("medical_token") || localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
});

export default api;