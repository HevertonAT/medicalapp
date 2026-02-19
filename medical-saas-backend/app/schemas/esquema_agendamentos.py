from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# --- Schemas "mini" para mostrar dentro do agendamento ---
class PatientSimple(BaseModel):
    id: int
    nome_completo: str
    class Config:
        from_attributes = True

class DoctorSimple(BaseModel):
    id: int          # Adicionado para facilitar links no front
    nome: str        # <--- ADICIONADO: Agora o nome do médico aparecerá!
    crm: str
    especialidade: str
    class Config:
        from_attributes = True

# --- SCHEMA DE CRIAÇÃO (POST) ---
class agendamentosCreate(BaseModel):
    clinic_id: Optional[int] = None
    doctor_id: int
    
    # Opcional, pois o paciente não envia o próprio ID no auto-agendamento
    patient_id: Optional[int] = None 
    
    data_horario: datetime 
    duracao: int = 40
    observacoes: Optional[str] = None

    # Permite que o frontend envie campos extras (ex: 'status', 'tipo') sem dar erro
    class Config:
        extra = "ignore"

# --- SCHEMA DE RESPOSTA (GET) ---
class agendamentosResponse(BaseModel):
    id: int
    status: str
    data_horario: datetime
    observacoes: Optional[str] = None
    
    # O Pydantic vai ler os relacionamentos do Banco e preencher usando os Schemas acima
    patient: Optional[PatientSimple] = None
    doctor: Optional[DoctorSimple] = None
    
    # Campos calculados (properties) caso existam no Model (mantidos para compatibilidade)
    patient_nome: Optional[str] = None
    doctor_nome: Optional[str] = None

    class Config:
        from_attributes = True

# --- SCHEMA DE REAGENDAMENTO (PATCH) ---
class agendamentosReschedule(BaseModel):
    data_horario: datetime
    motivo: str