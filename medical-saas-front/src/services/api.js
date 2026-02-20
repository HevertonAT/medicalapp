import axios from "axios";

// Alteramos o fallback de localhost para a sua URL da Vercel
export const API_BASE = import.meta.env.VITE_API_URL || "https://medicalappp.vercel.app";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("medical_token") || localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    console.error("Erro ao recuperar token:", e);
  }
  return config;
});

export default api;