from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    cpf: Optional[str] = None        
    data_nascimento: Optional[date] = None
    telefone: Optional[str] = None
    clinic_id: Optional[int] = None 
    
    role: str = "patient"            

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    role: str
    clinic_id: Optional[int] = None

    class Config:
        from_attributes = True