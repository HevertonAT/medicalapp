from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import desc
from datetime import datetime, date, timedelta, timezone # <-- ADICIONADO 'date' PARA CÁLCULO DE IDADE

from app.db.base import get_db
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

# --- CONFIGURAÇÃO DO FUSO HORÁRIO DO BRASIL (UTC-3) ---
BRT_TZ = timezone(timedelta(hours=-3))

# --- SCHEMAS INTERNOS ---
class MacroCreate(BaseModel):
    titulo: str
    texto_padrao: str

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

# --- FUNÇÃO AUXILIAR DE IDADE ---
def calcular_idade_completa(data_nascimento):
    if not data_nascimento:
        return "Idade não informada"
    
    # Caso venha como string do banco, converte para data
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


# --- ROTAS DE PRONTUÁRIO ---

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
            print(f"⚠️ Aviso: Falha ao verificar regras de especialidade. Prosseguindo com salvamento padrão. Erro: {e}")
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
        print(f"❌ Erro ao criar prontuário: {e}")
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

        # --- A MÁGICA DA CONVERSÃO DE TEMPO ACONTECE AQUI ---
        criado_brt = r.criado_em.astimezone(BRT_TZ) if r.criado_em else datetime.now(BRT_TZ)

        results.append({
            "id": r.id, 
            "anamnese": r.anamnese, 
            "prescricao": r.prescricao,
            "diagnostico_cid": r.diagnostico_cid,
            "created_at": criado_brt.strftime("%d/%m/%Y %H:%M"), # Hora 100% corrigida
            "doctor_nome": doc_name,
            "doctor_specialty": doc_spec,
            "doctor_document": doc_doc,
            "doctor_gender": doc_gender
        })
    return results


# --- GERADOR DE PDF DE EVOLUÇÃO (ATUALIZADO E DINÂMICO) ---
@router.get("/{record_id}/pdf")
def generate_prescription_pdf(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record: raise HTTPException(404, "Prontuário não encontrado.")
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    paciente = record.patient
    profissional = record.doctor
    
    # --- CABEÇALHO DA EVOLUÇÃO ---
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 800, f"Paciente: {paciente.nome_completo if paciente else 'Paciente não identificado'}")

    p.setFont("Helvetica", 10)
    idade_str = calcular_idade_completa(paciente.data_nascimento) if paciente and paciente.data_nascimento else "Idade não informada"
    p.drawString(50, 785, f"Idade do Paciente: {idade_str}")
    p.drawString(50, 770, f"Num. Prontuário: {str(record.id).zfill(9)}")

    # Data do atendimento no formato DD/MM/YY - HH:MM
    if record.criado_em:
        data_formatada = record.criado_em.astimezone(BRT_TZ).strftime("%d/%m/%y - %H:%M")
    else:
        data_formatada = datetime.now(BRT_TZ).strftime("%d/%m/%y - %H:%M")
        
    p.drawString(50, 755, f"Data do Atendimento: {data_formatada}")
    
    nome_prof = profissional.nome if profissional else "Não identificado"
    p.drawString(50, 740, f"Nome do Profissional: {nome_prof}")

    # Linha divisória
    p.line(50, 730, width - 50, 730)

    # --- CORPO DO TEXTO (EVOLUÇÃO E PRESCRIÇÃO) ---
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 700, "Evolução / Prescrição:")
    
    p.setFont("Helvetica", 12)
    conteudo = []
    if record.anamnese:
        conteudo.append("Evolução:")
        conteudo.append(record.anamnese)
        conteudo.append("") # Quebra de linha visual
    if record.prescricao:
        conteudo.append("Prescrição / Receita:")
        conteudo.append(record.prescricao)
        
    texto_completo = "\n".join(conteudo) if conteudo else "Nenhum registro encontrado neste atendimento."
    
    text_object = p.beginText(50, 680)
    for line in texto_completo.split('\n'):
        text_object.textLine(line)
        
    p.drawText(text_object)
    
    # --- ÁREA DE ASSINATURA (RODAPÉ DINÂMICO) ---
    p.line(200, 120, 400, 120) 
    
    # Nome do Profissional (Centralizado)
    p.setFont("Helvetica-Bold", 10)
    nome_prof_assinatura = profissional.nome if profissional else "Profissional Responsável"
    p.drawCentredString(300, 105, nome_prof_assinatura)

    # Especialidade Dinâmica (Ex: Fonoaudióloga)
    p.setFont("Helvetica", 10)
    especialidade_prof = profissional.especialidade if profissional and profissional.especialidade else "Clínico(a) Geral"
    p.drawCentredString(300, 90, especialidade_prof)

    # Número do Conselho Dinâmico (Ex: CRFa-12345)
    crm_prof = profissional.crm if profissional and profissional.crm else "CR Não Informado"
    p.drawCentredString(300, 75, crm_prof)
    
    p.showPage()
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=evolucao_{str(record.id).zfill(9)}.pdf"}
    )