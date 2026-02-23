from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.base import get_db
from app.models.regras_especialidades import SpecialtyRule
from app.schemas.esquema_especialidades import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter()

@router.get("/", response_model=List[RuleResponse])
def list_rules(db: Session = Depends(get_db)):
    return db.query(SpecialtyRule).all()

# --- ROTA CORRIGIDA PARA BATER COM O FRONT-END ---
@router.get("/rules/{specialty_name}")
def get_effective_rule(specialty_name: str, db: Session = Depends(get_db)):
    # Busca configurações da especialidade ignorando diferenças de maiúsculas e minúsculas
    rule = db.query(SpecialtyRule).filter(
        func.lower(SpecialtyRule.specialty) == specialty_name.lower()
    ).first()
    
    # Se não encontrar regra, devolve Sucesso (200 OK) vazio para não gerar erro 404 na tela
    if not rule:
        return {"specialty": specialty_name, "settings": {}}
    return rule

# --- ROTA RESERVA (Garante compatibilidade caso o prefixo no main.py já inclua o /rules) ---
@router.get("/{specialty_name}")
def get_effective_rule_fallback(specialty_name: str, db: Session = Depends(get_db)):
    rule = db.query(SpecialtyRule).filter(
        func.lower(SpecialtyRule.specialty) == specialty_name.lower()
    ).first()
    
    if not rule:
        return {"specialty": specialty_name, "settings": {}}
    return rule

@router.post("/", response_model=RuleResponse)
def create_rule(rule: RuleCreate, db: Session = Depends(get_db)):
    # Verifica duplicidade ignorando maiúsculas e minúsculas
    db_rule = db.query(SpecialtyRule).filter(
        func.lower(SpecialtyRule.specialty) == rule.specialty.lower()
    ).first()
    
    if db_rule:
        raise HTTPException(status_code=400, detail="Regra já existe para esta especialidade.")
    
    new_rule = SpecialtyRule(
        specialty=rule.specialty,
        settings=rule.settings,
        active=rule.active
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: int, rule_data: RuleUpdate, db: Session = Depends(get_db)):
    db_rule = db.query(SpecialtyRule).filter(SpecialtyRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Regra não encontrada.")
    
    db_rule.specialty = rule_data.specialty
    db_rule.settings = rule_data.settings
    db_rule.active = rule_data.active
    
    db.commit()
    db.refresh(db_rule)
    return db_rule