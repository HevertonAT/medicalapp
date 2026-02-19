import React from "react";

export default function ClinicaGeralFields({ settings = {}, data = {}, onChange }) {
  return (
    <div>
      <h3>Clínica Geral</h3>
      {/* CPF do paciente será controlado pelo formulário de paciente; aqui mostramos campos simples */}
      <div className="form-row">
        <label>Anamnese</label>
        <textarea value={data.anamnese || ""} onChange={(e) => onChange("anamnese", e.target.value)} />
      </div>
    </div>
  );
}