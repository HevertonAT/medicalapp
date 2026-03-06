from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.core.deps import get_current_user 
from app.models.usuarios import User
from app.models.clinicas import Clinic
from app.schemas.esquema_usuarios import UserCreate, UserResponse
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Apenas admin ou superuser podem criar equipe
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    user_exists = db.query(User).filter(User.email == user_data.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")

    target_clinic_id = current_user.clinic_id
    if current_user.role == 'superuser' and user_data.clinic_id:
        target_clinic_id = user_data.clinic_id

    hashed_pwd = get_password_hash(user_data.password)

    novo_usuario = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_pwd, 
        role=user_data.role,        
        clinic_id=target_clinic_id,
        is_active=True
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

# --- MURO DE CONCRETO APLICADO ---
@router.get("/", response_model=List[UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(User)
    if current_user.role == 'superuser':
        return query.offset(skip).limit(limit).all()
        
    query = query.filter(User.clinic_id == current_user.clinic_id)
    return query.offset(skip).limit(limit).all()

# --- NOVO: EXCLUIR MEMBRO DA EQUIPE ---
@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Apenas administradores podem excluir usuários.")
        
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    if current_user.role != 'superuser' and user_to_delete.clinic_id != current_user.clinic_id:
        raise HTTPException(status_code=403, detail="Sem permissão para remover usuário de outra clínica.")
        
    # Impedir que o dono exclua a si mesmo
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir a sua própria conta.")
        
    # Exclusão física
    db.delete(user_to_delete)
    db.commit()
    return {"message": "Usuário excluído com sucesso."}