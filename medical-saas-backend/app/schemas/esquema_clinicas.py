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
    
    # MÁGICA 1: O Pydantic não vai mais surtar se a clínica for antiga e estiver sem "True" ou "False" no is_active
    is_active: Optional[bool] = True 
    
    # --- ENDEREÇO ---
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    complemento: Optional[str] = None
    
    # MÁGICA 2: Para o Dashboard puxar dados do banco de dados antigo sem quebrar
    plano: Optional[str] = "Pro"
    status_assinatura: Optional[str] = "ativa"
    
    class Config:
        from_attributes = True