from pydantic import BaseModel
from typing import Optional

class CriarClinica(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    email_clinica: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    plano_id: Optional[int] = None
    
    # Dados do Admin
    nome_admin: str
    email_admin: str
    senha_admin: str

class AtualizarClinica(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    email_clinica: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    plano_id: Optional[int] = None
    is_active: Optional[bool] = None

class RespostaClinica(BaseModel):
    id: int
    nome: str 
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    plano_id: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True