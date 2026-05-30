import axios from "axios";

// Alteramos o fallback de localhost para a sua URL da Vercel
//export const API_BASE = import.meta.env.VITE_API_URL || "https://medicalapp-mu.vercel.app";
//export const API_BASE = "https://medicalapp-mu.vercel.app";
export const API_BASE = import.meta.env.VITE_API_URL || "https://medical-saas-backend-production-0866.up.railway.app";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Adicionado para enviar cookies (ex: HttpOnly JWT)
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;