import api from "./api";

// Lista agendamentos (O backend deve filtrar pelo usuário logado automaticamente)
export async function listMyAppointments() {
  const res = await api.get("/appointments/me"); // Supondo que você crie essa rota no backend, ou use filtros
  // Se não tiver rota "/me", use a listagem normal e filtre no front (menos seguro, mas funciona pra MVP)
  // const res = await api.get("/appointments/");
  return res.data;
}

export async function createAppointment(payload) {
  const res = await api.post("/appointments/", payload);
  return res.data;
}

export async function listAvailableSlots(doctorId, date) {
    // Se tiver logica de slots no backend
    // const res = await api.get(`/appointments/slots?doctor_id=${doctorId}&date=${date}`);
    return []; 
}