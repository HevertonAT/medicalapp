import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.arquivos_pacientes import PatientFile
from app.models.pacientes import Patient # Para verificar se o paciente pertence à clínica do usuário
from app.models.usuarios import User

from app.schemas.esquema_arquivos import FileResponse
from app.core.deps import get_current_user

router = APIRouter()

# Configuração da pasta de destino
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True) # Cria a pasta se não existir

@router.post("/{patient_id}", response_model=FileResponse)
def upload_file(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 0. SEGURANÇA: Verificar se o paciente existe e pertence à clínica do usuário
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado ou acesso negado.")

    # 1. Gerar um nome único para não sobrescrever arquivos
    # Ex: 15_exame_sangue.pdf
    unique_filename = f"{patient_id}_{file.filename}"
    file_location = f"{UPLOAD_DIR}/{unique_filename}"
    
    # 2. Salvar o arquivo no disco
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo no disco: {str(e)}")

    # 3. Salvar o registro no Banco
    # A classe PatientFile deve estar correta no model arquivos_pacientes.py
    new_file = PatientFile(
        patient_id=patient_id,
        filename=file.filename,
        file_path=file_location,
        file_type=file.content_type
    )
    
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return new_file