from pydantic import BaseModel
from typing import Optional

# Base comum (usada para criar e listar)
class DoctorBase(BaseModel):
    nome: str
    especialidade: str
    crm: str
    ativo: Optional[bool] = True 

# Usado na criação (POST)
class DoctorCreate(DoctorBase):
    # NOVOS CAMPOS: Exigidos apenas na hora de cadastrar para criar o login
    email: str
    senha: str

# Usado na atualização (PUT/PATCH)
# Todos os campos são opcionais para permitir atualização parcial
class DoctorUpdate(BaseModel):
    nome: Optional[str] = None
    especialidade: Optional[str] = None
    crm: Optional[str] = None
    ativo: Optional[bool] = None

# Usado na resposta (GET)
class DoctorResponse(DoctorBase):
    id: int
    
    class Config:
        from_attributes = True