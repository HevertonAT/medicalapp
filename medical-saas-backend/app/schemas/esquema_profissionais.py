from pydantic import BaseModel
from typing import Optional, Dict, Any

class DoctorBase(BaseModel):
    nome: str
    especialidade: str
    crm: str
    genero: Optional[str] = None
    ativo: Optional[bool] = True 
    agenda_config: Optional[Dict[str, Any]] = None 

class DoctorCreate(DoctorBase):
    email: str
    senha: str

class DoctorUpdate(BaseModel):
    nome: Optional[str] = None
    especialidade: Optional[str] = None
    crm: Optional[str] = None
    genero: Optional[str] = None
    ativo: Optional[bool] = None
    agenda_config: Optional[Dict[str, Any]] = None 

class DoctorResponse(DoctorBase):
    id: int
    
    class Config:
        from_attributes = True