from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import date, datetime

# --- O SEU SCHEMA ANTIGO MANTIDO (Para não quebrar o Dashboard atual) ---
class TransactionCreate(BaseModel):
    appointment_id: Optional[int] = None 
    tipo: str = "entrada"
    valor_total: float # Ajustado para float para bater com o model e SQLAlchemy
    metodo_pagamento: str 
    status_nfe: str = "emitida"
    descricao: str = "Receita Avulsa"

class TransactionResponse(BaseModel):
    id: int
    tipo: str
    valor: float # Mapeado para bater com o Model
    forma_pagamento: Optional[str] = None # Mapeado para bater com o Model
    criado_em: datetime # Mapeado para bater com o Model
    
    class Config:
        from_attributes = True

# --- NOVOS SCHEMAS (Para Controle Completo de Contas a Pagar/Receber) ---
class TransactionCompleteBase(BaseModel):
    patient_id: Optional[int] = None
    appointment_id: Optional[int] = None
    descricao: str
    valor: float
    tipo: str # 'entrada' ou 'saida'
    categoria: Optional[str] = None
    data_vencimento: date
    data_pagamento: Optional[date] = None
    status: Optional[str] = "pendente"
    forma_pagamento: Optional[str] = None
    status_nfe: Optional[str] = "pendente"

class TransactionCompleteCreate(TransactionCompleteBase):
    pass

class TransactionCompleteUpdate(BaseModel):
    descricao: Optional[str] = None
    valor: Optional[float] = None
    tipo: Optional[str] = None
    categoria: Optional[str] = None
    data_vencimento: Optional[date] = None
    data_pagamento: Optional[date] = None
    status: Optional[str] = None
    forma_pagamento: Optional[str] = None
    status_nfe: Optional[str] = None