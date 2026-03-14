from pydantic import BaseModel
from typing import Dict, Any, Optional

class RuleBase(BaseModel):
    specialty: str
    settings: Dict[str, Any] = {}
    active: bool = True

class RuleCreate(RuleBase):
    clinic_id: Optional[int] = None # Será preenchido pelo Front-end se for Superuser

class RuleUpdate(RuleBase):
    pass

class RuleResponse(RuleBase):
    id: int
    clinic_id: Optional[int] = None # Permite que o Front-end saiba a quem pertence a regra
    
    class Config:
        from_attributes = True