from pydantic import BaseModel
from typing import Optional

# O que precisamos receber do Front-end para criar uma clínica e um admin ao mesmo tempo?
class CriarClinica(BaseModel):
    # --- Dados da Clínica ---
    nome: str  # Trocado de razao_social para 'nome' (bate com o banco de dados)
    cnpj: Optional[str] = None
    email_clinica: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    
    # --- Dados do Administrador (Dono da Clínica) ---
    nome_admin: str
    email_admin: str
    senha_admin: str

# Como o sistema responde após a criação com sucesso:
class RespostaClinica(BaseModel):
    id: int
    nome: str 
    cnpj: Optional[str] = None
    email: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True # Permite ler direto do objeto do banco (ORM)