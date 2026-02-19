import api from "./api";

export async function listDoctors() {
  const res = await api.get("/doctors/");
  return res.data;
}

export async function createDoctor(payload) {
  const res = await api.post("/doctors/", payload);
  return res.data;
}

export async function updateDoctor(id, payload) {
  const res = await api.put(`/doctors/${id}`, payload);
  return res.data;
}

export async function inactivateDoctor(id) {
  return api.delete(`/doctors/${id}`);
}

export async function reactivateDoctor(id) {
  return api.patch(`/doctors/${id}/reactivate`, {});
}