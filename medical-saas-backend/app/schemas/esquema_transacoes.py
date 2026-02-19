from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
from datetime import datetime

class TransactionCreate(BaseModel):
    appointment_id: Optional[int] = None # Pode ser uma venda avulsa, sem consulta
    tipo: str = "entrada"
    valor_total: Decimal
    metodo_pagamento: str # ex: "PIX"

class TransactionResponse(BaseModel):
    id: int
    tipo: str
    valor_total: Decimal
    metodo_pagamento: str
    created_at: datetime
    
    class Config:
        from_attributes = True