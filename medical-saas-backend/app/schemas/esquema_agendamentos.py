from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class PatientSimple(BaseModel):
    id: int
    nome_completo: str
    class Config:
        from_attributes = True

class DoctorSimple(BaseModel):
    id: int 
    nome: str 
    crm: str
    especialidade: str
    class Config:
        from_attributes = True

class agendamentosCreate(BaseModel):
    clinic_id: Optional[int] = None
    doctor_id: int
    
    patient_id: Optional[int] = None 
    
    data_horario: datetime 
    duracao: int = 40
    observacoes: Optional[str] = None

    class Config:
        extra = "ignore"

class agendamentosResponse(BaseModel):
    id: int
    status: str
    data_horario: datetime
    observacoes: Optional[str] = None
    
    patient: Optional[PatientSimple] = None
    doctor: Optional[DoctorSimple] = None
    
    patient_nome: Optional[str] = None
    doctor_nome: Optional[str] = None

    class Config:
        from_attributes = True

class agendamentosReschedule(BaseModel):
    data_horario: datetime
    motivo: str