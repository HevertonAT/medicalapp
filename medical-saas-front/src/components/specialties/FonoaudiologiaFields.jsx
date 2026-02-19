import React from "react";

export default function FonoFields({ settings = {}, data = {}, onChange }) {
  return (
    <div>
      <h3>Fonoaudiologia</h3>
      {settings.require_sessions && (
        <div className="form-row">
          <label>Sessão</label>
          <input type="number" value={data.session_number || ""} onChange={(e) => onChange("session_number", e.target.value)} placeholder="Sessão X" />
          <input type="number" value={data.session_total || ""} onChange={(e) => onChange("session_total", e.target.value)} placeholder="de Y" />
        </div>
      )}
      {settings.fields_audiometry && (
        <>
          <div className="form-row">
            <label>Audiometria</label>
            <textarea value={data.audiometry || ""} onChange={(e) => onChange("audiometry", e.target.value)} />
          </div>
          <div className="form-row">
            <label>Evolução da Fala</label>
            <textarea value={data.speech_evolution || ""} onChange={(e) => onChange("speech_evolution", e.target.value)} />
          </div>
        </>
      )}
    </div>
  );
}