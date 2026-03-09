from pydantic import BaseModel
from datetime import date
from typing import Optional

class PatientBase(BaseModel):
    nome_completo: str
    cpf: Optional[str] = None       
    telefone: Optional[str] = None  
    
    data_nascimento: Optional[date] = None
    genero: Optional[str] = None
    
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    
    ativo: Optional[bool] = True 

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    nome_completo: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    data_nascimento: Optional[date] = None
    genero: Optional[str] = None
    
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    
    ativo: Optional[bool] = None

class PatientResponse(PatientBase):
    id: int
    clinic_id: Optional[int] = None
    user_id: Optional[int] = None
    
    class Config:
        from_attributes = True