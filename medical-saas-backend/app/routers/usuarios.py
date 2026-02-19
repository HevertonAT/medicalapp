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
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar se e-mail já existe
    user_exists = db.query(User).filter(User.email == user_data.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")

    # 2. Verificar se a clínica existe (se foi passado um ID)
    if user_data.clinic_id:
        clinic = db.query(Clinic).filter(Clinic.id == user_data.clinic_id).first()
        if not clinic:
            raise HTTPException(status_code=404, detail="Clínica não encontrada.")

    # 3. Criar o Hash da senha
    hashed_pwd = get_password_hash(user_data.password)

    # 4. Criar o Usuário
    # ATENÇÃO: O model User não tem 'cpf'. O CPF deve ser salvo no perfil (Patient ou Doctor).
    novo_usuario = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_pwd, # Nome correto do campo no model User
        role=user_data.role,        # Importante passar a role (admin, doctor, patient)
        clinic_id=user_data.clinic_id,
        is_active=True
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario

# --- ROTA EXTRA ÚTIL: Listar Usuários ---
@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Exige login
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users