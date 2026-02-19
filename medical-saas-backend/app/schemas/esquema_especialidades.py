from pydantic import BaseModel
from typing import Dict, Any, Optional

class RuleBase(BaseModel):
    specialty: str
    settings: Dict[str, Any] = {}
    active: bool = True

class RuleCreate(RuleBase):
    pass

class RuleUpdate(RuleBase):
    pass

class RuleResponse(RuleBase):
    id: int
    
    class Config:
        from_attributes = True