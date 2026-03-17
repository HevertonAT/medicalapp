from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import date, datetime

class TransactionCreate(BaseModel):
    appointment_id: Optional[int] = None 
    tipo: str = "entrada"
    valor_total: float
    metodo_pagamento: str 
    status_nfe: str = "emitida"
    descricao: str = "Receita Avulsa"

class TransactionResponse(BaseModel):
    id: int
    tipo: str
    valor: float
    forma_pagamento: Optional[str] = None
    parcelas: Optional[int] = 1 
    criado_em: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TransactionCompleteBase(BaseModel):
    patient_id: Optional[int] = None
    appointment_id: Optional[int] = None
    descricao: Optional[str] = None 
    valor: float
    tipo: str # 'entrada' ou 'saida'
    categoria: Optional[str] = None
    data_vencimento: date
    data_pagamento: Optional[date] = None
    status: Optional[str] = "pendente"
    forma_pagamento: Optional[str] = None
    parcelas: Optional[int] = 1 
    status_nfe: Optional[str] = "pendente"
    link_nfe: Optional[str] = None

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
    parcelas: Optional[int] = None 
    status_nfe: Optional[str] = None
    link_nfe: Optional[str] = None