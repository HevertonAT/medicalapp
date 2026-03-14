import api from "./api";

// --- LISTA MESTRA DE ESPECIALIDADES ---
// Esta lista é usada tanto nas Configurações quanto no Cadastro de Médicos.
export const MASTER_SPECIALTIES = [
  "Cardiologia",
  "Clínico Geral",
  "Dermatologia",
  "Endocrinologia",
  "Fonoaudiologia",
  "Gastroenterologia",
  "Geriatria",
  "Ginecologia",
  "Hematologia",
  "Infectologia",
  "Nefrologia",
  "Neurologia",
  "Nutrologia",
  "Oftalmologia",
  "Ortopedia",
  "Otorrinolaringologia",
  "Pediatria",
  "Pneumologia",
  "Psiquiatria",
  "Reumatologia",
  "Urologia"
];

export async function getEffectiveRule(specialty) {
  if (!specialty) return {};
  try {
    // CORREÇÃO: Alinhado com o @router.get("/rules/{specialty_name}") do Python
    const res = await api.get(`/specialties/rules/${encodeURIComponent(specialty)}`);
    return res.data.settings || {};
  } catch (error) {
    console.error("Erro ao buscar regras ativas:", error);
    return {};
  }
}

export async function listRules() {
  try {
    // CORREÇÃO: Volta a ser a raiz da rota, alinhado com o @router.get("/") do Python
    const res = await api.get("/specialties/");
    return res.data;
  } catch (error) {
    console.error("Erro ao listar todas as regras:", error);
    return [];
  }
}

export async function createRule(payload) {
  try {
    // Alinhado com o @router.post("/") do nosso Upsert
    const res = await api.post("/specialties/", payload);
    return res.data;
  } catch (error) {
    console.error("Erro ao criar regra:", error);
    throw error;
  }
}

export async function updateRule(id, payload) {
  try {
    // Mantemos o PUT, pois o Back-end continua a suportar o @router.put("/{rule_id}")
    const res = await api.put(`/specialties/${id}`, payload);
    return res.data;
  } catch (error) {
    console.error("Erro ao atualizar regra:", error);
    throw error;
  }
}