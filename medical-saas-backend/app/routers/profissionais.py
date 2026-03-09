from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import bcrypt 
from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.profissionais import Doctor
from app.models.usuarios import User
from app.models.pacientes import Patient 
from app.models.clinicas import Clinic 
from app.models.planos import Plan 
from app.schemas.esquema_profissionais import DoctorCreate, DoctorResponse, DoctorUpdate

router = APIRouter()

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

@router.get("/me", response_model=DoctorResponse)
def get_my_doctor_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Perfil de profissional não encontrado.")
    return doctor

@router.get("/", response_model=List[DoctorResponse])
def list_doctors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Doctor)
    if current_user.role == 'superuser':
        return query.all()

    if current_user.role in ['patient', 'paciente']:
        query = query.filter(Doctor.ativo == True)
        patient_profile = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient_profile and patient_profile.clinic_id:
            query = query.filter(Doctor.clinic_id == patient_profile.clinic_id)
    else:
        query = query.filter(Doctor.clinic_id == current_user.clinic_id)

    return query.all()

@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Sem permissão para criar profissionais.")

    target_clinic_id = current_user.clinic_id
    if current_user.role == "superuser" and hasattr(doctor, "clinic_id") and doctor.clinic_id:
        target_clinic_id = doctor.clinic_id
        
    if not target_clinic_id:
        raise HTTPException(status_code=400, detail="Não foi possível identificar a clínica.")

    #TRAVA DE LIMITE DO PLANO (COBRANÇA POR AGENDA)
    clinic = db.query(Clinic).filter(Clinic.id == target_clinic_id).first()
    if clinic and clinic.plano_id:
        plan = db.query(Plan).filter(Plan.id == clinic.plano_id).first()
        if plan and plan.max_usuarios: # max_usuarios agora significa max_agendas
            doctor_count = db.query(Doctor).filter(
                Doctor.clinic_id == target_clinic_id, 
                Doctor.ativo == True
            ).count()
            
            if doctor_count >= plan.max_usuarios:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Limite do plano atingido! Seu plano atual ({plan.nome}) permite no máximo {plan.max_usuarios} profissionais ativos. Contate o suporte para fazer um upgrade."
                )

    # VINCULAR ADMIN A UMA CONTA DE MÉDICO (SE E-MAIL FOR O MESMO)
    user_exists = db.query(User).filter(User.email == doctor.email).first()
    
    if user_exists:
        # Se o e-mail já existe, verificamos se ele é um Admin da MESMA clínica
        if user_exists.clinic_id == target_clinic_id and user_exists.role == 'admin':
            
            # Verifica se ele já não tem um perfil médico
            doctor_profile_exists = db.query(Doctor).filter(Doctor.user_id == user_exists.id).first()
            if doctor_profile_exists:
                raise HTTPException(status_code=400, detail="Este administrador já possui uma agenda de profissional vinculada.")
            
            # Mágica: Reaproveitamos o usuário Admin existente (NÃO cria usuário novo)
            new_user = user_exists 
        else:
            # Se for e-mail de paciente ou de outra clínica, dá erro normal
            raise HTTPException(status_code=400, detail="Este e-mail já está em uso por outro usuário no sistema.")
    else:
        # Se o e-mail NÃO existe, cria o usuário médico do zero
        new_user = User(
            full_name=doctor.nome,
            email=doctor.email,
            hashed_password=get_password_hash(doctor.senha),
            role="doctor",
            clinic_id=target_clinic_id,
            is_active=True
        )
        db.add(new_user)
        db.flush() 

    # Cria a agenda e perfil médico apontando para o usuário (Admin reaproveitado ou Novo)
    db_doctor = Doctor(
        nome=doctor.nome,
        crm=doctor.crm,
        especialidade=doctor.especialidade,
        genero=getattr(doctor, 'genero', None),
        clinic_id=target_clinic_id,
        user_id=new_user.id,
        agenda_config=doctor.agenda_config, 
        ativo=True
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    
    return db_doctor

@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, doctor_data: DoctorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor: raise HTTPException(status_code=404, detail="Médico não encontrado")

    is_owner = db_doctor.user_id == current_user.id
    is_admin_of_same_clinic = current_user.role == 'admin' and db_doctor.clinic_id == current_user.clinic_id
    is_superuser = current_user.role == 'superuser'

    if not (is_owner or is_admin_of_same_clinic or is_superuser):
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar.")

    if doctor_data.nome: db_doctor.nome = doctor_data.nome
    if doctor_data.crm: db_doctor.crm = doctor_data.crm
    if doctor_data.especialidade: db_doctor.especialidade = doctor_data.especialidade
    if hasattr(doctor_data, 'genero') and doctor_data.genero: 
        db_doctor.genero = doctor_data.genero
    if doctor_data.agenda_config is not None:
        db_doctor.agenda_config = doctor_data.agenda_config
    
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@router.delete("/{doctor_id}")
def inactivate_doctor(doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor: raise HTTPException(status_code=404, detail="Médico não encontrado")

    is_admin_of_same_clinic = current_user.role == 'admin' and db_doctor.clinic_id == current_user.clinic_id
    is_superuser = current_user.role == 'superuser'

    if not (is_admin_of_same_clinic or is_superuser):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    db_doctor.ativo = False
    db.commit()
    return {"message": "Médico inativado com sucesso"}

@router.patch("/{doctor_id}/reactivate")
def reactivate_doctor(doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor: raise HTTPException(status_code=404, detail="Médico não encontrado")

    is_admin_of_same_clinic = current_user.role == 'admin' and db_doctor.clinic_id == current_user.clinic_id
    is_superuser = current_user.role == 'superuser'

    if not (is_admin_of_same_clinic or is_superuser):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    db_doctor.ativo = True
    db.commit()
    return {"message": "Médico reativado"}