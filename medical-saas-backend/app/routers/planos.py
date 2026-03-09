from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.base import get_db
from app.models.planos import Plan

router = APIRouter()
class PlanResponse(BaseModel):
    id: int
    nome: str
    preco_mensal: float
    max_usuarios: Optional[int] = None
    max_pacientes: Optional[int] = None
    ativo: bool
    criado_em: Optional[datetime] = None

    class Config:
        from_attributes = True
#Busca todos os planos ativos para exibir no front-end (página de escolha de plano) - Somente leitura, sem criação ou edição por enquanto
@router.get("/", response_model=List[PlanResponse])
def listar_planos(db: Session = Depends(get_db)):
    planos = db.query(Plan).filter(Plan.ativo == True).all()
    return planos