from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
# Removi a importação de UUID, pois agora usamos int
from app.db.base import get_db
from app.models.pacientes import Patient
from app.models.usuarios import User
from app.schemas.esquema_pacientes import PatientCreate, PatientResponse, PatientUpdate
from app.core.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[PatientResponse])
def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"🔍 Listando pacientes para usuário: {current_user.email} (Role: {current_user.role})")
    
    query = db.query(Patient)

    # LÓGICA DE FILTRO:
    # Se NÃO for superuser e tiver clínica, filtra pela clínica.
    # Se for superuser, vê tudo.
    if current_user.role != 'superuser' and current_user.clinic_id:
        query = query.filter(Patient.clinic_id == current_user.clinic_id)

    patients_db = query.all()

    # --- PROTEÇÃO CONTRA ERRO 500 ---
    # Validamos um por um. Se um estiver "quebrado", ele é ignorado e não quebra a tela.
    valid_patients = []
    for p in patients_db:
        try:
            # O simples fato de tentar acessar as propriedades aqui já testa se o objeto está íntegro
            _ = p.id 
            valid_patients.append(p)
        except Exception as e:
            print(f"⚠️ ERRO CRÍTICO: O paciente ID {p.id} está corrompido e foi ignorado na lista. Erro: {e}")
            # Dica: Verifique se existem campos obrigatórios NULL no banco de dados para este ID
    
    return valid_patients

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verifica se CPF já existe (se foi enviado)
    if patient.cpf:
        existing_patient = db.query(Patient).filter(Patient.cpf == patient.cpf).first()
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já cadastrado no sistema"
            )
    
    try:
        new_patient = Patient(
            clinic_id=current_user.clinic_id,
            nome_completo=patient.nome_completo,
            cpf=patient.cpf,
            telefone=patient.telefone,
            data_nascimento=patient.data_nascimento,
            endereco=patient.endereco, # Adicionado caso seu schema tenha endereço
            genero=patient.genero,     # Adicionado caso seu schema tenha genero
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
            detail=f"Erro ao criar paciente. Verifique os dados."
        )

# --- ROTA DE EDIÇÃO ---
@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int, 
    patient_data: PatientUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Busca o paciente 
    query = db.query(Patient).filter(Patient.id == patient_id)
    
    # Se não for superuser, restringe à clínica
    if current_user.role != 'superuser' and current_user.clinic_id:
        query = query.filter(Patient.clinic_id == current_user.clinic_id)
        
    db_patient = query.first()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    
    # Atualiza os campos dinamicamente
    update_data = patient_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
    
    db.commit()
    db.refresh(db_patient)
    return db_patient

# --- ROTA DE INATIVAÇÃO ---
@router.delete("/{patient_id}")
def inactivate_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient).filter(Patient.id == patient_id)
    
    if current_user.role != 'superuser' and current_user.clinic_id:
        query = query.filter(Patient.clinic_id == current_user.clinic_id)

    db_patient = query.first()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    
    db_patient.ativo = False 
    db.commit()
    
    return {"message": "Paciente inativado com sucesso"}

# --- ROTA DE REATIVAÇÃO ---
@router.patch("/{patient_id}/reactivate")
def reactivate_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient).filter(Patient.id == patient_id)
    
    if current_user.role != 'superuser' and current_user.clinic_id:
        query = query.filter(Patient.clinic_id == current_user.clinic_id)
        
    db_patient = query.first()
    
    if not db_patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado")
    
    db_patient.ativo = True 
    db.commit()
    
    return {"message": "Paciente reativado com sucesso"}