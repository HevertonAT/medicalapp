from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# O que o Frontend envia para criar o prontuário
class MedicalRecordCreate(BaseModel):
    appointment_id: int
    clinic_id: Optional[int] = None
    anamnese: str
    prescricao: Optional[str] = None
    exame_fisico: Optional[str] = None
    diagnostico_cid: Optional[str] = None
    
    specialty_data: Optional[dict] = None
    
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None

# O que o Backend devolve para o Frontend ler
class MedicalRecordResponse(BaseModel):
    id: int
    anamnese: Optional[str]
    prescricao: Optional[str]
    criado_em: datetime
    specialty_data: Optional[dict]
    
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    class Config:
        from_attributes = True