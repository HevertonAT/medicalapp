import api from "./api";

// --- LISTA MESTRA DE ESPECIALIDADES ---
// Esta lista é usada tanto nas Configurações quanto no Cadastro de Médicos.
export const MASTER_SPECIALTIES = [
  "Pediatria",
  "Cardiologia",
  "Ortopedia",
  "Ginecologia",
  "Fonoaudiologia",
  "Dermatologia",
  "Oftalmologia",
  "Clínica Geral",
  "Psiquiatria",
  "Neurologia",
  "Endocrinologia",
  "Urologia"
];

export async function getEffectiveRule(specialty) {
  // Codifica a string para evitar erros com acentos na URL
  const res = await api.get(`/settings/specialties/effective/${encodeURIComponent(specialty)}`);
  return res.data.settings || {};
}

export async function listRules() {
  const res = await api.get("/settings/specialties/");
  return res.data;
}

export async function createRule(payload) {
  const res = await api.post("/settings/specialties/", payload);
  return res.data;
}

export async function updateRule(id, payload) {
  const res = await api.put(`/settings/specialties/${id}`, payload);
  return res.data;
}