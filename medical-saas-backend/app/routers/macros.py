from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.usuarios import User
from app.models.profissionais import Doctor
from app.models.macros import Macro
from app.schemas.esquema_macros import MacroCreate, MacroResponse

router = APIRouter()

# 1. LISTAR MACROS DO PROFISSIONAL LOGADO
@router.get("/", response_model=List[MacroResponse])
def get_my_macros(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Descobre quem é o médico/profissional logado
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        return [] 
    
    # Devolve apenas as macros DESTE médico
    return db.query(Macro).filter(Macro.doctor_id == doctor.id).all()

# 2. CRIAR UM NOVO MACRO
@router.post("/", response_model=MacroResponse, status_code=status.HTTP_201_CREATED)
def create_macro(macro: MacroCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Apenas profissionais de saúde podem criar macros.")
    
    new_macro = Macro(
        titulo=macro.titulo, 
        texto_padrao=macro.texto_padrao, 
        doctor_id=doctor.id # Salva com o ID dele
    )
    db.add(new_macro)
    db.commit()
    db.refresh(new_macro)
    return new_macro

# 3. DELETAR UM MACRO
@router.delete("/{macro_id}")
def delete_macro(macro_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    
    # Busca o macro e garante que ele pertence a este médico específico antes de deletar
    macro = db.query(Macro).filter(Macro.id == macro_id, Macro.doctor_id == doctor.id).first()
    if not macro:
        raise HTTPException(status_code=404, detail="Macro não encontrada.")
    
    db.delete(macro)
    db.commit()
    return {"detail": "Macro excluída com sucesso."}