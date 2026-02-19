import React from "react";

export default function OrtopediaFields({ settings = {}, data = {}, onChange }) {
  return (
    <div>
      <h3>Ortopedia / Traumatologia</h3>
      {settings.require_laterality && (
        <div className="form-row">
          <label>Lateralidade *</label>
          <select value={data.laterality || ""} onChange={(e) => onChange("laterality", e.target.value)}>
            <option value="">Selecione</option>
            <option value="left">Esquerdo</option>
            <option value="right">Direito</option>
            <option value="bilateral">Bilateral</option>
          </select>
        </div>
      )}
      {settings.highlight_imaging && (
        <div className="form-row">
          <label>Laudos de Imagem</label>
          <textarea value={data.imaging_notes || ""} onChange={(e) => onChange("imaging_notes", e.target.value)} />
        </div>
      )}
    </div>
  );
}