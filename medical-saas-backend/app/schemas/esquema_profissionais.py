from pydantic import BaseModel
from typing import Optional, Dict, Any

# Base comum: Adicionamos o campo de agenda aqui para que todos os outros herdem
class DoctorBase(BaseModel):
    nome: str
    especialidade: str
    crm: str
    ativo: Optional[bool] = True 
    # Campo para receber o objeto JSON da agenda do React
    agenda_config: Optional[Dict[str, Any]] = None 

# Usado na criação (POST) - Herda a agenda_config da base
class DoctorCreate(DoctorBase):
    email: str
    senha: str

# Usado na atualização (PUT/PATCH)
class DoctorUpdate(BaseModel):
    nome: Optional[str] = None
    especialidade: Optional[str] = None
    crm: Optional[str] = None
    ativo: Optional[bool] = None
    # Permite atualizar a agenda separadamente
    agenda_config: Optional[Dict[str, Any]] = None 

# Usado na resposta (GET) - Devolve a agenda para a área do paciente
class DoctorResponse(DoctorBase):
    id: int
    
    class Config:
        from_attributes = True