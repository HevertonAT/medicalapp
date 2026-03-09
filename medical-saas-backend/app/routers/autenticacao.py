from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.models.usuarios import User
from app.models.pacientes import Patient 
from app.schemas.esquema_usuarios import UserCreate

router = APIRouter()

@router.post("/login")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    print(f"🔍 TENTATIVA DE LOGIN: {form_data.username}")

    email_limpo = form_data.username.strip()

    user = db.query(User).filter(User.email == email_limpo).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail incorreto.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha incorreta.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    print(f"📝 Iniciando cadastro para: {user.email}")

    # 1. Verifica se e-mail já existe
    user_exists = db.query(User).filter(User.email == user.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")

    # 1.5 Verifica se CPF já existe (Trava de Segurança)
    if user.cpf:
        cpf_exists = db.query(Patient).filter(Patient.cpf == user.cpf).first()
        if cpf_exists:
            raise HTTPException(status_code=400, detail="Este CPF já está em uso por outro paciente.")

    # 2. Cria o Usuário (Login)
    try:
        new_user = User(
            full_name=user.full_name,
            email=user.email,
            hashed_password=get_password_hash(user.password),
            role=user.role, 
            is_active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"✅ Usuário criado com ID: {new_user.id}")
    except Exception as e:
        print(f"❌ ERRO FATAL AO CRIAR USER: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar usuário no banco.")

    if user.role == 'paciente' or user.role == 'patient':
        try:
            print(f"   -> Criando perfil de Paciente para ID {new_user.id}...")
            
            new_patient = Patient(
                nome_completo=user.full_name, 
                user_id=new_user.id,          
                ativo=True,
                cpf=user.cpf, # Salvando o CPF
                telefone=user.telefone,  # Salvando o Telefone
                data_nascimento=user.data_nascimento, # Salvando a Data de Nascimento
                insurance_id=None
            )
            db.add(new_patient)
            db.commit()
            print("   -> ✅ Perfil de paciente criado com sucesso.")
            
        except Exception as e:
            print(f"❌ ERRO AO CRIAR PERFIL DE PACIENTE: {e}")
            print("⚠️ O usuário foi criado, mas o vínculo com Paciente falhou.")
            db.rollback()

    return {
        "id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "msg": "Usuário criado com sucesso!"
    }