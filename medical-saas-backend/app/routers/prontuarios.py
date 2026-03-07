from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import desc
from datetime import datetime, date, timedelta, timezone

from app.db.base import get_db
from app.models.prontuarios import MedicalRecord
from app.models.agendamentos import Appointment
from app.models.usuarios import User
from app.models.profissionais import Doctor
from app.models.regras_especialidades import SpecialtyRule
from app.schemas.esquema_prontuarios import MedicalRecordCreate, MedicalRecordResponse
from app.core.deps import get_current_user

router = APIRouter()

# --- CONFIGURAÇÃO DO FUSO HORÁRIO DO BRASIL (UTC-3) ---
BRT_TZ = timezone(timedelta(hours=-3))

class RecordHistoryResponse(BaseModel):
    id: int 
    anamnese: Optional[str]
    prescricao: Optional[str]
    diagnostico_cid: Optional[str] = None 
    created_at: str 
    doctor_nome: str
    doctor_specialty: Optional[str] = None 
    doctor_document: Optional[str] = None  
    doctor_gender: Optional[str] = None 

    class Config:
        from_attributes = True

def calcular_idade_completa(data_nascimento):
    if not data_nascimento:
        return "Idade não informada"
    if isinstance(data_nascimento, str):
        try:
            data_nascimento = datetime.strptime(data_nascimento, "%Y-%m-%d").date()
        except:
            return "Idade não informada"

    hoje = date.today()
    anos = hoje.year - data_nascimento.year
    meses = hoje.month - data_nascimento.month
    
    if hoje.day < data_nascimento.day:
        meses -= 1
    if meses < 0:
        anos -= 1
        meses += 12
        
    return f"{anos} anos e {meses} meses"

@router.post("/", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
def create_medical_record(
    data: MedicalRecordCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        appointment = db.query(Appointment).filter(Appointment.id == data.appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")

        clinic_id = current_user.clinic_id
        if not clinic_id:
            raise HTTPException(status_code=400, detail="Usuário não está vinculado a uma clínica.")
        
        try:
            doctor = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
            specialty = (doctor.especialidade if doctor and doctor.especialidade else "Clínica Geral")

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
            sd = data.specialty_data.copy() if data.specialty_data else {}

        except Exception as e:
            print(f"⚠️ Aviso: Falha ao verificar regras. Erro: {e}")
            sd = {} 

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
            data_inicio=data.data_inicio,
            data_fim=data.data_fim
        )

        db.add(new_record)
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
        raise HTTPException(status_code=500, detail=f"Erro ao criar prontuário: {str(e)}")

@router.get("/patient/{patient_id}", response_model=List[RecordHistoryResponse])
def get_patient_records(
    patient_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id)
    if current_user.role != 'superuser' and current_user.clinic_id:
        query = query.filter(MedicalRecord.clinic_id == current_user.clinic_id)
        
    records = query.order_by(desc(MedicalRecord.criado_em)).all()
    results = []
    
    for r in records:
        doc_name = r.doctor.nome if r.doctor else "Profissional"
        doc_spec = r.doctor.especialidade if r.doctor and hasattr(r.doctor, 'especialidade') else "Clínica Geral"
        doc_gender = r.doctor.genero if r.doctor and hasattr(r.doctor, 'genero') else None
        
        doc_doc = ""
        if r.doctor:
            if hasattr(r.doctor, 'numero_conselho') and getattr(r.doctor, 'numero_conselho'):
                conselho = getattr(r.doctor, 'conselho', 'CRM')
                doc_doc = f"{conselho} {r.doctor.numero_conselho}"
            elif hasattr(r.doctor, 'documento') and getattr(r.doctor, 'documento'):
                doc_doc = getattr(r.doctor, 'documento')

        criado_brt = r.criado_em.astimezone(BRT_TZ) if r.criado_em else datetime.now(BRT_TZ)

        results.append({
            "id": r.id, 
            "anamnese": r.anamnese, 
            "prescricao": r.prescricao,
            "diagnostico_cid": r.diagnostico_cid,
            "created_at": criado_brt.strftime("%d/%m/%Y %H:%M"), 
            "doctor_nome": doc_name,
            "doctor_specialty": doc_spec,
            "doctor_document": doc_doc,
            "doctor_gender": doc_gender
        })
    return results

# ==========================================
# 📄 GERADOR DE PDF 1: EVOLUÇÃO (COMPLETO)
# ==========================================
@router.get("/{record_id}/evolucao/pdf")
def generate_evolucao_pdf(record_id: int, db: Session = Depends(get_db)):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record: raise HTTPException(404, "Prontuário não encontrado.")
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    paciente = record.patient
    profissional = record.doctor
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 800, f"Paciente: {paciente.nome_completo if paciente else 'Paciente não identificado'}")

    p.setFont("Helvetica", 10)
    idade_str = calcular_idade_completa(paciente.data_nascimento) if paciente and paciente.data_nascimento else "Idade não informada"
    p.drawString(50, 785, f"Idade do Paciente: {idade_str}")
    p.drawString(50, 770, f"Num. Prontuário: {str(record.id).zfill(9)}")

    if record.criado_em:
        data_formatada = record.criado_em.astimezone(BRT_TZ).strftime("%d/%m/%y - %H:%M")
    else:
        data_formatada = datetime.now(BRT_TZ).strftime("%d/%m/%y - %H:%M")
        
    p.drawString(50, 755, f"Data do Atendimento: {data_formatada}")
    p.drawString(50, 740, f"Nome do Profissional: {profissional.nome if profissional else 'Não identificado'}")

    p.line(50, 730, width - 50, 730)

    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 700, "Evolução:")
    
    p.setFont("Helvetica", 12)
    texto_completo = record.anamnese if record.anamnese else "Nenhum registro de evolução encontrado."
    
    text_object = p.beginText(50, 680)
    for line in texto_completo.split('\n'):
        text_object.textLine(line)
    p.drawText(text_object)
    
    # RODAPÉ DINÂMICO
    p.line(200, 120, 400, 120) 
    p.setFont("Helvetica-Bold", 10)
    p.drawCentredString(300, 105, profissional.nome if profissional else "Profissional")
    p.setFont("Helvetica", 10)
    p.drawCentredString(300, 90, profissional.especialidade if profissional and profissional.especialidade else "Clínico(a) Geral")
    p.drawCentredString(300, 75, profissional.crm if profissional and profissional.crm else "CR Não Informado")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=evolucao_{str(record.id).zfill(9)}.pdf"})

# ==========================================
# 📄 GERADOR DE PDF 2: RECEITUÁRIO (SIMPLES)
# ==========================================
@router.get("/{record_id}/receita/pdf")
def generate_receita_pdf(record_id: int, db: Session = Depends(get_db)):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record: raise HTTPException(404, "Prontuário não encontrado.")
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    paciente = record.patient
    profissional = record.doctor
    
    if record.criado_em:
        data_formatada = record.criado_em.astimezone(BRT_TZ).strftime("%d/%m/%Y")
    else:
        data_formatada = datetime.now(BRT_TZ).strftime("%d/%m/%Y")

    # CABEÇALHO SIMPLES (Apenas Nome e Data)
    p.setFont("Helvetica-Bold", 20)
    p.drawCentredString(width / 2, 800, "RECEITUÁRIO")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, 750, f"Paciente: {paciente.nome_completo if paciente else 'Paciente não identificado'}")
    p.drawString(50, 730, f"Data do Atendimento: {data_formatada}")
    
    p.line(50, 720, width - 50, 720)

    # CORPO DA RECEITA
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 690, "Uso:")
    
    p.setFont("Helvetica", 12)
    prescricao_texto = record.prescricao if record.prescricao else "Sem prescrição."
    
    text_object = p.beginText(50, 670)
    for line in prescricao_texto.split('\n'):
        text_object.textLine(line)
    p.drawText(text_object)

    # RODAPÉ DINÂMICO
    p.line(200, 120, 400, 120) 
    p.setFont("Helvetica-Bold", 10)
    p.drawCentredString(300, 105, profissional.nome if profissional else "Profissional")
    p.setFont("Helvetica", 10)
    p.drawCentredString(300, 90, profissional.especialidade if profissional and profissional.especialidade else "Clínico(a) Geral")
    p.drawCentredString(300, 75, profissional.crm if profissional and profissional.crm else "CR Não Informado")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=receita_{str(record.id).zfill(9)}.pdf"})