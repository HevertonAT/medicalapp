from pydantic import BaseModel
from typing import Optional

class CriarClinica(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    email_clinica: Optional[str] = None
    telefone: Optional[str] = None
    plano_id: Optional[int] = None
    
    # --- ENDEREÇO ---
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    complemento: Optional[str] = None
    
    # --- DADOS DO ADMIN ---
    nome_admin: str
    email_admin: str
    senha_admin: str

class AtualizarClinica(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    email_clinica: Optional[str] = None
    telefone: Optional[str] = None
    plano_id: Optional[int] = None
    is_active: Optional[bool] = None
    
    # --- ENDEREÇO ---
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    complemento: Optional[str] = None

class RespostaClinica(BaseModel):
    id: int
    nome: str 
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    plano_id: Optional[int] = None
    is_active: bool
    
    # --- ENDEREÇO ---
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    complemento: Optional[str] = None
    
    class Config:
        from_attributes = True