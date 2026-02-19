from pydantic import BaseModel
from datetime import date
from typing import Optional

class PatientBase(BaseModel):
    nome_completo: str
    # CORREÇÃO: Tornamos opcionais para não quebrar com pacientes do auto-agendamento
    cpf: Optional[str] = None       
    telefone: Optional[str] = None  
    
    data_nascimento: Optional[date] = None
    genero: Optional[str] = None      # Adicionado caso queira usar futuramente
    endereco: Optional[str] = None    # Adicionado caso queira usar futuramente
    ativo: Optional[bool] = True 

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    nome_completo: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    data_nascimento: Optional[date] = None
    genero: Optional[str] = None
    endereco: Optional[str] = None
    ativo: Optional[bool] = None

class PatientResponse(PatientBase):
    id: int
    clinic_id: Optional[int] = None  # Importante para o frontend saber a clínica
    user_id: Optional[int] = None    # Importante para vincular ao login
    
    class Config:
        from_attributes = True