from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    # Tornamos opcionais para não quebrar o cadastro simples da tela de login
    cpf: Optional[str] = None        
    clinic_id: Optional[int] = None 
    
    # Campo novo para controlar o acesso
    role: str = "patient"            

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    role: str # Retornamos o role para o frontend saber quem é
    clinic_id: Optional[int] = None # Agora pode vir vazio

    class Config:
        from_attributes = True