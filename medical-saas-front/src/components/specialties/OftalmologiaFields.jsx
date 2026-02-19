import React from "react";

export default function OftalmoFields({ settings = {}, data = {}, onChange }) {
  return (
    <div>
      <h3>Oftalmologia</h3>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h4>Olho Direito (OD)</h4>
          <div className="form-row"><label>Acuidade</label><input value={data.od?.acuidade || ""} onChange={(e) => onChange("od", {...(data.od||{}), acuidade: e.target.value})} /></div>
          <div className="form-row"><label>Pressão</label><input value={data.od?.pressao || ""} onChange={(e) => onChange("od", {...(data.od||{}), pressao: e.target.value})} /></div>
        </div>
        <div style={{ flex: 1 }}>
          <h4>Olho Esquerdo (OE)</h4>
          <div className="form-row"><label>Acuidade</label><input value={data.oe?.acuidade || ""} onChange={(e) => onChange("oe", {...(data.oe||{}), acuidade: e.target.value})} /></div>
          <div className="form-row"><label>Pressão</label><input value={data.oe?.pressao || ""} onChange={(e) => onChange("oe", {...(data.oe||{}), pressao: e.target.value})} /></div>
        </div>
      </div>
    </div>
  );
}