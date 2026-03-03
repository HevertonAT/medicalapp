from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# Importa a conexão com o banco
from app.db.base import get_db
# Importa o seu modelo Plan (exatamente como está no seu arquivo)
from app.models.planos import Plan

router = APIRouter()

# --- SCHEMA (MOLDE) PARA ENVIAR AO FRONT-END ---
class PlanResponse(BaseModel):
    id: int
    nome: str
    preco_mensal: float
    max_usuarios: Optional[int] = None
    max_pacientes: Optional[int] = None
    ativo: bool
    criado_em: Optional[datetime] = None

    class Config:
        from_attributes = True # Permite ler direto do modelo do SQLAlchemy

# --- ROTA GET /planos/ ---
@router.get("/", response_model=List[PlanResponse])
def listar_planos(db: Session = Depends(get_db)):
    # Busca todos os planos que estão com a flag ativo=True
    planos = db.query(Plan).filter(Plan.ativo == True).all()
    return planos