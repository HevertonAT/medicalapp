import React from "react";

export default function DermaFields({ settings = {}, data = {}, onChange }) {
  return (
    <div>
      <h3>Dermatologia</h3>
      {settings.require_fototipo && (
        <div className="form-row">
          <label>Fototipo *</label>
          <select value={data.fototipo || ""} onChange={(e) => onChange("fototipo", e.target.value)}>
            <option value="">Selecione</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
            <option value="V">V</option>
            <option value="VI">VI</option>
          </select>
        </div>
      )}
      {settings.enable_body_mapping && (
        <div className="form-row">
          <label>Mapeamento Corporal</label>
          <textarea value={data.body_map || ""} onChange={(e) => onChange("body_map", e.target.value)} />
        </div>
      )}
    </div>
  );
}