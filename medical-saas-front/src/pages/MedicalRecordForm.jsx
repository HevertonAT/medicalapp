import React, { useEffect, useState } from "react";
import SpecialtyFormRenderer from "../components/SpecialtyFormRenderer"; // Mantivemos isso pois parece ser um componente visual seu

// 1. IMPORTANDO A API CENTRALIZADA
import api from "../services/api";

export default function MedicalRecordForm({ appointment }) {
  const [settings, setSettings] = useState({});
  const [specialtyData, setSpecialtyData] = useState({});
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [anamnese, setAnamnese] = useState("");

  useEffect(() => {
    async function load() {
      // obter especialidade do médico
      const docSpecialty = appointment?.doctor_especialidade || appointment?.doctor?.especialidade || "Clínico Geral";
      setSpecialty(docSpecialty);
      
      try {
        // 2. SUBSTITUÍMOS O SERVIÇO POR UMA CHAMADA DIRETA (Opcional, se o backend tiver essa rota)
        // Se ainda não tiver essa rota, o settings ficará vazio e o form renderiza o padrão.
        const response = await api.get(`/specialties/rules/${docSpecialty}`);
        setSettings(response.data);
      } catch (e) {
        // console.error(e); // Silenciamos erro se não tiver regra específica
        setSettings({});
      }
    }
    load();
  }, [appointment]);

  function handleChange(key, value) {
    setSpecialtyData((prev) => {
      if (typeof key === "object") return {...prev, ...key};
      return { ...prev, [key]: value };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        appointment_id: appointment.id,
        anamnese,
        specialty_data: specialtyData
      };

      // 3. USO DO API.POST PARA GARANTIR O TOKEN
      await api.post('/medical-records/', payload);
      
      alert("Prontuário criado com sucesso");
      // Aqui você poderia chamar uma função passada via prop para fechar o modal, ex: onClose()
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Erro ao finalizar";
      alert("Erro ao finalizar: " + msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Anamnese / Evolução</label>
        <textarea 
            value={anamnese} 
            onChange={(e) => setAnamnese(e.target.value)} 
            rows={5}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>

      {/* Renderizador de campos específicos da especialidade */}
      <SpecialtyFormRenderer specialty={specialty} settings={settings} data={specialtyData} onChange={handleChange} />

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <button 
            type="submit" 
            disabled={loading}
            style={{
                backgroundColor: '#3182ce', color: 'white', padding: '10px 20px', 
                borderRadius: '5px', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}
        >
            {loading ? 'Salvando...' : 'Finalizar Prontuário'}
        </button>
      </div>
    </form>
  );
}