from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import bcrypt 

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.profissionais import Doctor
from app.models.usuarios import User
from app.schemas.esquema_profissionais import DoctorCreate, DoctorResponse, DoctorUpdate

router = APIRouter()

# --- FUNÇÃO AUXILIAR PARA CRIPTOGRAFIA ---
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

# --- 1. ROTA /ME (ORDEM PRIORITÁRIA) ---
# Deve ficar acima de /{doctor_id} para evitar que o FastAPI confunda "me" com um ID numérico.
@router.get("/me", response_model=DoctorResponse)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Busca o médico vinculado ao usuário logado
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Perfil de profissional não encontrado.")
    return doctor

# --- 2. LISTAGEM DE MÉDICOS ---
@router.get("/", response_model=List[DoctorResponse])
def list_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Doctor)

    # Pacientes veem todos os ativos para agendamento.
    if current_user.role in ['patient', 'paciente']:
        return query.filter(Doctor.ativo == True).all()

    # Admins e Médicos veem os colegas da mesma clínica.
    if current_user.role in ['admin', 'superuser', 'doctor']:
        if current_user.clinic_id:
            query = query.filter(Doctor.clinic_id == current_user.clinic_id)
        return query.all()

    return []

# --- 3. CRIAÇÃO DE MÉDICO ---
@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    doctor: DoctorCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Sem permissão para criar profissionais.")

    user_exists = db.query(User).filter(User.email == doctor.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Este email já está em uso.")

    # Cria o acesso (usuário)
    new_user = User(
        full_name=doctor.nome,
        email=doctor.email,
        hashed_password=get_password_hash(doctor.senha),
        role="doctor",
        clinic_id=current_user.clinic_id,
        is_active=True
    )
    db.add(new_user)
    db.flush() 

    # Cria o perfil médico com suporte à agenda_config
    db_doctor = Doctor(
        nome=doctor.nome,
        crm=doctor.crm,
        especialidade=doctor.especialidade,
        clinic_id=current_user.clinic_id,
        user_id=new_user.id,
        agenda_config=doctor.agenda_config, # Salva a agenda inicial se enviada
        ativo=True
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

# --- 4. ATUALIZAÇÃO (PUT) ---
# Ajustado para permitir que o médico edite a si mesmo e salve a agenda.
@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int, 
    doctor_data: DoctorUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Médico não encontrado")

    # PERMISSÃO: Admin ou o próprio dono do perfil pode editar.
    is_owner = db_doctor.user_id == current_user.id
    is_admin = current_user.role in ['admin', 'superuser']

    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar este perfil.")

    # Atualiza campos básicos
    if doctor_data.nome: db_doctor.nome = doctor_data.nome
    if doctor_data.crm: db_doctor.crm = doctor_data.crm
    if doctor_data.especialidade: db_doctor.especialidade = doctor_data.especialidade
    
    # ATUALIZA A AGENDA: Fundamental para tirar o "null" do banco.
    if doctor_data.agenda_config is not None:
        db_doctor.agenda_config = doctor_data.agenda_config
    
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

# --- 5. INATIVAÇÃO (DELETE) ---
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

# --- 6. REATIVAÇÃO (PATCH) ---
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