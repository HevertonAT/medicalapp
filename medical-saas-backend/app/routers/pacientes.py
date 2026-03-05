from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.pacientes import Patient
from app.models.usuarios import User
from app.schemas.esquema_pacientes import PatientCreate, PatientResponse, PatientUpdate
from app.core.deps import get_current_user

router = APIRouter()

# --- 1. LISTAGEM DE PACIENTES (COM MURO DE CONCRETO) ---
@router.get("/", response_model=List[PatientResponse])
def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient)

    if current_user.role == 'superuser':
        return query.all()

    query = query.filter(Patient.clinic_id == current_user.clinic_id)
    return query.all()

# --- 2. CRIAÇÃO DE PACIENTE ---
@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_clinic_id = current_user.clinic_id
    if current_user.role == "superuser" and hasattr(patient, "clinic_id") and patient.clinic_id:
        target_clinic_id = patient.clinic_id

    if not target_clinic_id:
        raise HTTPException(status_code=400, detail="Não foi possível identificar a clínica para este cadastro.")

    # MURO DE CONCRETO (CPF): Verifica se o CPF já existe APENAS nesta clínica.
    if patient.cpf:
        existing_patient = db.query(Patient).filter(
            Patient.cpf == patient.cpf, 
            Patient.clinic_id == target_clinic_id
        ).first()
        
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este CPF já está cadastrado nesta clínica."
            )
    
    try:
        new_patient = Patient(
            clinic_id=target_clinic_id,
            nome_completo=patient.nome_completo,
            cpf=patient.cpf,
            telefone=patient.telefone,
            data_nascimento=patient.data_nascimento,
            endereco=patient.endereco, 
            genero=patient.genero,    
            ativo=True
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        return new_patient
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar paciente: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erro ao salvar paciente. Verifique se os dados estão corretos."
        )

# --- 3. ATUALIZAÇÃO (PUT) ---
@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int, 
    patient_data: PatientUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient).filter(Patient.id == patient_id)
    
    if current_user.role != 'superuser':
        query = query.filter(Patient.clinic_id == current_user.clinic_id)
        
    db_patient = query.first()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou não pertence à sua clínica.")
    
    update_data = patient_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
    
    db.commit()
    db.refresh(db_patient)
    return db_patient

# --- 4. INATIVAÇÃO (DELETE) ---
@router.delete("/{patient_id}")
def inactivate_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient).filter(Patient.id == patient_id)
    
    if current_user.role != 'superuser':
        query = query.filter(Patient.clinic_id == current_user.clinic_id)

    db_patient = query.first()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou não pertence à sua clínica.")
    
    db_patient.ativo = False 
    db.commit()
    return {"message": "Paciente inativado com sucesso"}

# --- 5. REATIVAÇÃO (PATCH) ---
@router.patch("/{patient_id}/reactivate")
def reactivate_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient).filter(Patient.id == patient_id)
    
    if current_user.role != 'superuser':
        query = query.filter(Patient.clinic_id == current_user.clinic_id)
        
    db_patient = query.first()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou não pertence à sua clínica.")
    
    db_patient.ativo = True 
    db.commit()
    return {"message": "Paciente reativado com sucesso"}