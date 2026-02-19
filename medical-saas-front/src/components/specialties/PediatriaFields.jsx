import React from "react";

export default function PediatriaFields({ settings = {}, data = {}, onChange }) {
  return (
    <div>
      <h3>Pediatria</h3>
      {/* CPF do responsável */}
      {settings.require_responsible_cpf && (
        <div className="form-row">
          <label>CPF do Responsável *</label>
          <input
            value={data.responsible_cpf || ""}
            onChange={(e) => onChange("responsible_cpf", e.target.value)}
            placeholder="CPF do responsável"
          />
        </div>
      )}

      {/* Peso, Apgar, Perímetro Cefálico */}
      <div className="form-row">
        <label>Peso</label>
        <input value={data.peso || ""} onChange={(e) => onChange("peso", e.target.value)} />
      </div>
      <div className="form-row">
        <label>Apgar</label>
        <input value={data.apgar || ""} onChange={(e) => onChange("apgar", e.target.value)} />
      </div>
      <div className="form-row">
        <label>Perímetro Cefálico</label>
        <input value={data.perimetro_cefalico || ""} onChange={(e) => onChange("perimetro_cefalico", e.target.value)} />
      </div>
    </div>
  );
}