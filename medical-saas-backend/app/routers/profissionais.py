from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import bcrypt # Importação adicionada para criptografar a senha do médico

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.profissionais import Doctor
from app.models.usuarios import User

from app.schemas.esquema_profissionais import DoctorCreate, DoctorResponse, DoctorUpdate

router = APIRouter()

# --- FUNÇÃO AUXILIAR PARA SENHA ---
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

@router.get("/", response_model=List[DoctorResponse])
def list_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Log para debug no terminal
    print(f"🔍 Usuário {current_user.email} (Role: {current_user.role}) solicitou lista de médicos.")

    # Inicia a query base
    query = db.query(Doctor)

    # LÓGICA DE PERMISSÃO:
    
    # 1. Se for PACIENTE, ele precisa ver os médicos para agendar.
    if current_user.role in ['patient', 'paciente']:
        print("   -> É paciente: Retornando todos os médicos ativos.")
        return query.filter(Doctor.ativo == True).all()

    # 2. Se for ADMIN ou SUPERUSER, vê os médicos da sua clínica
    if current_user.role in ['admin', 'superuser']:
        if current_user.clinic_id:
            query = query.filter(Doctor.clinic_id == current_user.clinic_id)
        # Se for superuser sem clinica (DEV), vê tudo
        return query.all()

    # 3. Se for MÉDICO, vê a si mesmo ou colegas da clínica
    if current_user.role == 'doctor':
        if current_user.clinic_id:
            query = query.filter(Doctor.clinic_id == current_user.clinic_id)
        return query.all()

    return []

@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    doctor: DoctorCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Apenas admins/superusers podem criar médicos
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Sem permissão")

    # 1. Verifica se o email já está em uso no sistema (Tabela User)
    user_exists = db.query(User).filter(User.email == doctor.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Este email já está em uso.")

    # 2. Cria o ACESSO (Usuário) do Médico
    new_user = User(
        full_name=doctor.nome,
        email=doctor.email,
        hashed_password=get_password_hash(doctor.senha),
        role="doctor",
        clinic_id=current_user.clinic_id,
        is_active=True
    )
    db.add(new_user)
    db.flush() # Gera o ID do usuário (new_user.id) sem commitar definitivamente

    # 3. Cria o PERFIL (Médico) vinculado ao usuário criado acima
    db_doctor = Doctor(
        nome=doctor.nome,
        crm=doctor.crm,
        especialidade=doctor.especialidade,
        clinic_id=current_user.clinic_id,
        user_id=new_user.id, # <-- Vincula o acesso ao perfil
        ativo=True
    )
    db.add(db_doctor)
    
    # 4. Salva ambos no banco de dados
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int, 
    doctor_data: DoctorUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Sem permissão")

    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Médico não encontrado")

    # Atualiza os campos enviados
    if doctor_data.nome:
        db_doctor.nome = doctor_data.nome
    if doctor_data.crm:
        db_doctor.crm = doctor_data.crm
    if doctor_data.especialidade:
        db_doctor.especialidade = doctor_data.especialidade
    
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@router.delete("/{doctor_id}")
def inactivate_doctor(
    doctor_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Sem permissão")

    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Médico não encontrado")

    db_doctor.ativo = False
    db.commit()
    return {"message": "Médico inativado com sucesso"}

@router.patch("/{doctor_id}/reactivate")
def reactivate_doctor(
    doctor_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Sem permissão")

    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Médico não encontrado")

    db_doctor.ativo = True
    db.commit()
    return {"message": "Médico reativado"}