from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.db.base import get_db
from app.models.regras_especialidades import SpecialtyRule
from app.models.usuarios import User
from app.core.deps import get_current_user
from app.schemas.esquema_especialidades import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter()

# Lista todas as regras da clínica (com filtro opcional para o Superuser)
@router.get("/", response_model=List[RuleResponse])
def list_rules(clinic_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Se for superuser e ele enviou um clinic_id na URL, busca daquela clínica. 
    # Senão, busca da clínica do próprio usuário logado.
    target_clinic = clinic_id if (current_user.role == 'superuser' and clinic_id) else current_user.clinic_id
    
    return db.query(SpecialtyRule).filter(SpecialtyRule.clinic_id == target_clinic).all()

# Busca a regra de uma especialidade específica (Usado pela Agenda na hora da consulta)
@router.get("/rules/{specialty_name}")
def get_effective_rule(specialty_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = db.query(SpecialtyRule).filter(
        func.lower(SpecialtyRule.specialty) == specialty_name.lower(),
        SpecialtyRule.clinic_id == current_user.clinic_id
    ).first()
    
    if not rule:
        # Se não houver regra, devolvemos um dicionário vazio mas válido para não quebrar o site
        return {"specialty": specialty_name, "settings": {}}
    return rule

# ==========================================
# O CORAÇÃO DA CORREÇÃO: A ROTA UPSERT
# Aceita / e /rules para acabar com o Erro 405
# ==========================================
@router.post("/", response_model=RuleResponse)
@router.post("/rules", response_model=RuleResponse)
@router.post("/rules/", response_model=RuleResponse)
def create_or_update_rule(rule: RuleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    # Descobre de quem é a regra: se o superuser mandou um ID, usa ele. Se não, usa do próprio usuário.
    target_clinic = rule.clinic_id if (current_user.role == 'superuser' and rule.clinic_id) else current_user.clinic_id

    db_rule = db.query(SpecialtyRule).filter(
        func.lower(SpecialtyRule.specialty) == rule.specialty.lower(),
        SpecialtyRule.clinic_id == target_clinic
    ).first()
    
    if db_rule:
        # 1. ATUALIZAR: Se a regra já existe, apenas trocamos as chavinhas e salvamos! (Sem erro 400)
        db_rule.settings = rule.settings
        db_rule.active = rule.active
        db.commit()
        db.refresh(db_rule)
        return db_rule
    else:
        # 2. CRIAR: Se é a primeira vez que clica em "Salvar Configurações", ele cria.
        new_rule = SpecialtyRule(
            specialty=rule.specialty,
            clinic_id=target_clinic,
            settings=rule.settings,
            active=rule.active
        )
        db.add(new_rule)
        db.commit()
        db.refresh(new_rule)
        return new_rule

# Atualizar via ID (Mantido para compatibilidade)
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