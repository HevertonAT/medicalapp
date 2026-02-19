import React from "react";

export default function CardioFields({ settings = {}, data = {}, onChange }) {
  return (
    <div>
      <h3>Cardiologia</h3>
      {settings.require_blood_pressure && (
        <div className="form-row" style={{ fontWeight: "bold" }}>
          <label>Pressão Arterial (PA) *</label>
          <input value={data.blood_pressure || ""} onChange={(e) => onChange("blood_pressure", e.target.value)} placeholder="Ex: 120/80" />
        </div>
      )}
      {settings.highlight_family_history && (
        <div className="form-row">
          <label>Histórico Familiar</label>
          <textarea value={data.family_history || ""} onChange={(e) => onChange("family_history", e.target.value)} />
        </div>
      )}
    </div>
  );
}