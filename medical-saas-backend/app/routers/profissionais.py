from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.profissionais import Doctor
from app.models.usuarios import User

# Importando os schemas. 
# Nota: Certifique-se de que DoctorUpdate existe no seu arquivo de schemas.
# Caso não tenha criado o DoctorUpdate, você pode usar DoctorCreate temporariamente aqui.
from app.schemas.esquema_profissionais import DoctorCreate, DoctorResponse, DoctorUpdate

router = APIRouter()

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
    # Mostramos todos os médicos ATIVOS do sistema (Self-Service).
    if current_user.role in ['patient', 'paciente']:
        print("   -> É paciente: Retornando todos os médicos ativos.")
        return query.filter(Doctor.ativo == True).all()

    # 2. Se for ADMIN ou SUPERUSER, vê os médicos da sua clínica (se tiver clínica vinculada)
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
    # Apenas admins podem criar médicos
    if current_user.role not in ['admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Sem permissão")

    db_doctor = Doctor(
        nome=doctor.nome,
        crm=doctor.crm,
        especialidade=doctor.especialidade,
        clinic_id=current_user.clinic_id, # Vincula à clínica do admin que criou
        ativo=True
    )
    db.add(db_doctor)
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