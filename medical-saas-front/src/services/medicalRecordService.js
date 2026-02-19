import api from "./api";

export async function createMedicalRecord(payload) {
  const res = await api.post("/medical-records/", payload);
  return res.data;
}