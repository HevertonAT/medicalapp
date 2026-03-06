from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.base import get_db
from app.models.regras_especialidades import SpecialtyRule
from app.models.usuarios import User
from app.core.deps import get_current_user
from app.schemas.esquema_especialidades import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter()

@router.get("/", response_model=List[RuleResponse])
def list_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # MURO DE CONCRETO
    return db.query(SpecialtyRule).filter(SpecialtyRule.clinic_id == current_user.clinic_id).all()

@router.get("/rules/{specialty_name}")
def get_effective_rule(specialty_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = db.query(SpecialtyRule).filter(
        func.lower(SpecialtyRule.specialty) == specialty_name.lower(),
        SpecialtyRule.clinic_id == current_user.clinic_id
    ).first()
    
    if not rule:
        return {"specialty": specialty_name, "settings": {}}
    return rule

@router.post("/", response_model=RuleResponse)
def create_rule(rule: RuleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_rule = db.query(SpecialtyRule).filter(
        func.lower(SpecialtyRule.specialty) == rule.specialty.lower(),
        SpecialtyRule.clinic_id == current_user.clinic_id
    ).first()
    
    if db_rule:
        raise HTTPException(status_code=400, detail="Regra já existe para esta especialidade na sua clínica.")
    
    new_rule = SpecialtyRule(
        specialty=rule.specialty,
        clinic_id=current_user.clinic_id, # AMARRA NA CLÍNICA
        settings=rule.settings,
        active=rule.active
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: int, rule_data: RuleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_rule = db.query(SpecialtyRule).filter(
        SpecialtyRule.id == rule_id,
        SpecialtyRule.clinic_id == current_user.clinic_id
    ).first()
    
    if not db_rule:
        raise HTTPException(status_code=404, detail="Regra não encontrada.")
    
    db_rule.settings = rule_data.settings
    db_rule.active = rule_data.active
    db.commit()
    db.refresh(db_rule)
    return db_rule