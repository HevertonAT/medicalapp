from pydantic import BaseModel
from typing import Optional


# O que precisamos receber para criar uma clínica?
class CriarClinica(BaseModel):
    razao_social: str
    cnpj: str
    
    # NOVOS CAMPOS: Dados para criar o primeiro Administrador desta clínica
    nome_admin: str
    email_admin: str
    senha_admin: str
    
    # Campos opcionais que adicionamos na rota (caso você queira usar no futuro)
    endereco: Optional[str] = None
    telefone: Optional[str] = None

class RespostaClinica(BaseModel):
    id: int
    razao_social: str 
    cnpj: str
    is_active: bool

    class Config:
        from_attributes = True # Permite ler direto do objeto do banco (ORM)