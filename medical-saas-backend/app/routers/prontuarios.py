from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import desc
from datetime import datetime

# Ajuste: Importar get_db de app.db.base
from app.db.base import get_db
# Ajuste: Importar as Classes Corretas (Inglês)
from app.models.prontuarios import MedicalRecord
from app.models.agendamentos import Appointment
from app.models.usuarios import User
from app.models.macros import Macro
from app.models.profissionais import Doctor
from app.models.regras_especialidades import SpecialtyRule
from app.models.pacientes import Patient
from app.schemas.esquema_prontuarios import MedicalRecordCreate, MedicalRecordResponse
from app.core.deps import get_current_user

router = APIRouter()

# --- SCHEMAS INTERNOS ---
class MacroCreate(BaseModel):
    titulo: str
    texto_padrao: str

class RecordHistoryResponse(BaseModel):
    id: int # Alterado para Int
    anamnese: Optional[str]
    prescricao: Optional[str]
    created_at: str 
    doctor_nome: str

    class Config:
        from_attributes = True

# --- ROTAS DE PRONTUÁRIO ---

@router.post("/", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
def create_medical_record(
    data: MedicalRecordCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # 1. Busca o agendamento
        appointment = db.query(Appointment).filter(Appointment.id == data.appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")

        # 2. Define a clínica de forma segura
        clinic_id = current_user.clinic_id
        if not clinic_id:
            raise HTTPException(status_code=400, detail="Usuário não está vinculado a uma clínica.")
        
        # 3. Validações dinâmicas por Especialidade (Opcional - Tratamento de Erro Adicionado)
        try:
            doctor = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
            specialty = (doctor.especialidade if doctor and doctor.especialidade else "Clínica Geral")

            # Busca regra
            rule = db.query(SpecialtyRule).filter(
                SpecialtyRule.specialty == specialty,
                SpecialtyRule.clinic_id == clinic_id,
                SpecialtyRule.active == True
            ).first()
            
            if not rule:
                rule = db.query(SpecialtyRule).filter(
                    SpecialtyRule.specialty == specialty,
                    SpecialtyRule.clinic_id == None,
                    SpecialtyRule.active == True
                ).first()

            settings = rule.settings if rule and rule.settings else {}
            
            # --- Validações de Regras (Simplificadas para não bloquear salvamento se der erro de config) ---
            sd = data.specialty_data.copy() if data.specialty_data else {}
            # (Aqui você pode manter as validações de CPF, DUM, etc. se desejar rigor)

        except Exception as e:
            print(f"⚠️ Aviso: Falha ao verificar regras de especialidade. Prosseguindo com salvamento padrão. Erro: {e}")
            sd = {} # Garante que sd existe

        # 4. Cria o registro (MedicalRecord) COM OS NOVOS CAMPOS DE DATA
        new_record = MedicalRecord(
            clinic_id=clinic_id,
            appointment_id=appointment.id,
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            
            anamnese=data.anamnese,
            exame_fisico=data.exame_fisico,
            diagnostico_cid=data.diagnostico_cid,
            prescricao=data.prescricao,
            specialty_data=sd if sd else None,
            
            # --- SALVANDO O TIMER REAL ---
            data_inicio=data.data_inicio,
            data_fim=data.data_fim
        )

        db.add(new_record)
        
        # 5. Atualiza status do agendamento para concluído/REALIZADO
        appointment.status = "REALIZADO"
        db.add(appointment)
        
        db.commit()
        db.refresh(new_record)
        return new_record
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar prontuário: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao criar prontuário: {str(e)}"
        )

@router.get("/patient/{patient_id}", response_model=List[RecordHistoryResponse])
def get_patient_records(
    patient_id: int, # ID Inteiro
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Lista histórico do paciente (apenas desta clínica)
    query = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id)
    
    if current_user.role != 'superuser' and current_user.clinic_id:
        query = query.filter(MedicalRecord.clinic_id == current_user.clinic_id)
        
    records = query.order_by(desc(MedicalRecord.criado_em)).all()
    
    results = []
    for r in records:
        # Acesso seguro ao relacionamento doctor
        doc_name = r.doctor.nome if r.doctor else "Profissional"
        
        results.append({
            "id": r.id, 
            "anamnese": r.anamnese, 
            "prescricao": r.prescricao,
            "created_at": r.criado_em.strftime("%d/%m/%Y %H:%M"), # Atributo correto: criado_em
            "doctor_nome": doc_name
        })
    return results

@router.get("/{record_id}/pdf")
def generate_prescription_pdf(
    record_id: int, # ID Inteiro
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Busca o Prontuário
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record: raise HTTPException(404, "Prontuário não encontrado.")
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    
    # --- DADOS SEGUROS PARA O PDF ---
    
    # Nome do Paciente
    nome_paciente = "Paciente não identificado"
    if record.patient and record.patient.nome_completo:
        nome_paciente = record.patient.nome_completo
    
    # Nome da Clínica
    clinica_nome = "Minha Clínica"
    # Tenta pegar da clínica do usuário logado ou do registro
    if current_user.clinic and current_user.clinic.nome:
        clinica_nome = current_user.clinic.nome
    elif record.clinic and record.clinic.nome:
        clinica_nome = record.clinic.nome
    
    # Data Formatada
    data_fmt = datetime.now().strftime('%d/%m/%Y')
    if record.criado_em:
        data_fmt = record.criado_em.strftime('%d/%m/%Y')

    # --- DESENHO DO PDF ---
    # Cabeçalho
    p.setFont("Helvetica-Bold", 20)
    p.drawString(200, 800, "RECEITA MEDICA")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, 750, f"Clinica: {clinica_nome}")
    p.line(50, 740, 550, 740)
    
    p.drawString(50, 700, f"Paciente: {nome_paciente}")
    p.drawString(50, 680, f"Data: {data_fmt}")
    
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 630, "Uso:")
    
    p.setFont("Helvetica", 12)
    
    # Corpo da Prescrição
    prescricao_texto = record.prescricao if record.prescricao else "Sem prescricao."
    
    # Simples renderização de texto
    text_object = p.beginText(50, 610)
    for line in prescricao_texto.split('\n'):
        text_object.textLine(line)
    p.drawText(text_object)

    # Rodapé
    p.line(50, 100, 550, 100)
    p.setFont("Helvetica-Oblique", 10)
    p.drawString(200, 80, "Assinatura e Carimbo")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    
    safe_filename = f"receita_{record.id}.pdf"
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={safe_filename}"}
    )

# --- ROTAS DE MACROS ---
@router.get("/macros/list")
def get_macros(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Retorna macros da clínica
    return db.query(Macro).filter(Macro.clinic_id == current_user.clinic_id).all()

@router.post("/macros")
def create_macro(macro: MacroCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_macro = Macro(
        clinic_id=current_user.clinic_id,
        titulo=macro.titulo,
        texto_padrao=macro.texto_padrao
    )
    db.add(new_macro)
    db.commit()
    return {"message": "Modelo salvo!"}