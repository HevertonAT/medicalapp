from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# O que o Frontend envia para criar o prontuário
class MedicalRecordCreate(BaseModel):
    appointment_id: int
    clinic_id: Optional[int] = None  # Opcional, pois o backend usa o clinic_id do usuário autenticado
    anamnese: str
    prescricao: Optional[str] = None
    exame_fisico: Optional[str] = None
    diagnostico_cid: Optional[str] = None
    
    # Campos específicos por especialidade (ex: {'dum': '2026-02-01', 'laterality': 'left'})
    specialty_data: Optional[dict] = None
    
    # --- NOVOS CAMPOS DE TEMPO ---
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None

# O que o Backend devolve para o Frontend ler
class MedicalRecordResponse(BaseModel):
    id: int
    anamnese: Optional[str]
    prescricao: Optional[str]
    criado_em: datetime
    specialty_data: Optional[dict]
    
    # --- NOVOS CAMPOS DE TEMPO ---
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    
    class Config:
        from_attributes = True