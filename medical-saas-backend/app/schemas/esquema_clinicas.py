from pydantic import BaseModel
from typing import Optional


# O que precisamos receber para criar uma clínica?
class CriarClinica(BaseModel):
    razao_social: str
    cnpj: str

# O que vamos devolver para o frontend? (Escondemos dados sensíveis se tivesse)
class RespostaClinica(BaseModel):
    id: int
    razao_social: str
    cnpj: str
    is_active: bool

    class Config:
        from_attributes = True # Permite ler direto do objeto do banco (ORM)