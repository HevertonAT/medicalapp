import React, { useEffect } from "react";

export default function GinecoFields({ settings = {}, data = {}, onChange }) {
  useEffect(() => {
    // calcular DPP se dum foi fornecida
    if (data.dum && !data.dpp) {
      try {
        const dum = new Date(data.dum);
        const dpp = new Date(dum.getTime() + 280 * 24 * 60 * 60 * 1000);
        onChange("dpp", dpp.toISOString().slice(0, 10));
      } catch (e) {}
    }
  }, [data.dum]);

  return (
    <div>
      <h3>Ginecologia / Obstetrícia</h3>
      {settings.require_dum && (
        <div className="form-row">
          <label>DUM *</label>
          <input type="date" value={data.dum || ""} onChange={(e) => onChange("dum", e.target.value)} />
        </div>
      )}
      {settings.require_dpp && (
        <div className="form-row">
          <label>DPP</label>
          <input type="date" value={data.dpp || ""} onChange={(e) => onChange("dpp", e.target.value)} />
        </div>
      )}

      {settings.obstetric_history && (
        <>
          <div className="form-row">
            <label>Gesta</label>
            <input value={data.gesta || ""} onChange={(e) => onChange("gesta", e.target.value)} />
          </div>
          <div className="form-row">
            <label>Para</label>
            <input value={data.para || ""} onChange={(e) => onChange("para", e.target.value)} />
          </div>
          <div className="form-row">
            <label>Aborto</label>
            <input value={data.aborto || ""} onChange={(e) => onChange("aborto", e.target.value)} />
          </div>
        </>
      )}
    </div>
  );
}