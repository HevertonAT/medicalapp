from pydantic import BaseModel, validator
from datetime import date
from typing import Optional
import re

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

    @validator('cpf')
    def validate_cpf(cls, v):
        if v is None:
            return v
        cpf_clean = re.sub(r'[^0-9]', '', str(v))
        if len(cpf_clean) != 11:
            raise ValueError('CPF deve conter 11 dígitos numéricos')
        return cpf_clean

    @validator('telefone')
    def validate_telefone(cls, v):
        if v is None:
            return v
        tel_clean = re.sub(r'[^0-9]', '', str(v))
        if len(tel_clean) < 10 or len(tel_clean) > 11:
            raise ValueError('Telefone deve conter entre 10 e 11 dígitos numéricos (com DDD)')
        return tel_clean

    @validator('cep')
    def validate_cep(cls, v):
        if v is None:
            return v
        cep_clean = re.sub(r'[^0-9]', '', str(v))
        if len(cep_clean) != 8:
            raise ValueError('CEP deve conter 8 dígitos numéricos')
        return cep_clean

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