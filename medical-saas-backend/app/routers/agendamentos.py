import json
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.agendamentos import Appointment
from app.models.pacientes import Patient 
from app.models.usuarios import User
from app.models.profissionais import Doctor
from app.schemas.esquema_agendamentos import agendamentosCreate, agendamentosResponse, agendamentosReschedule

router = APIRouter()

# --- 1. BUSCA DE HORÁRIOS DISPONÍVEIS ---
@router.get("/available-slots")
def get_available_slots(
    doctor_id: int,
    data: str,  # Formato esperado: YYYY-MM-DD
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor or not doctor.agenda_config:
        return []

    # MURO DE CONCRETO (INTELIGENTE PARA PACIENTES)
    if current_user.role in ['patient', 'paciente']:
        patient_profile = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        # Se o paciente já tem clínica vinculada, ele só vê médicos daquela clínica
        if patient_profile and patient_profile.clinic_id and doctor.clinic_id != patient_profile.clinic_id:
            return []
    elif current_user.role != 'superuser' and doctor.clinic_id != current_user.clinic_id:
        return []

    try:
        agenda_dict = doctor.agenda_config
        if isinstance(agenda_dict, str):
            agenda_dict = json.loads(agenda_dict)

        data_obj = datetime.strptime(data, "%Y-%m-%d").date()
        
        mapa_dias = {0: 'seg', 1: 'ter', 2: 'qua', 3: 'qui', 4: 'sex', 5: 'sab', 6: 'dom'}
        dia_chave = mapa_dias[data_obj.weekday()]

        config_dia = agenda_dict.get(dia_chave)
        if not config_dia or not config_dia.get('ativo'):
            return []

        inicio_str = config_dia.get('inicio', "08:00")
        fim_str = config_dia.get('fim', "18:00")
        intervalo = int(agenda_dict.get('intervalo', 30))

        slots = []
        base_date_str = datetime.today().strftime("%Y-%m-%d")
        atual = datetime.strptime(f"{base_date_str} {inicio_str}", "%Y-%m-%d %H:%M")
        limite = datetime.strptime(f"{base_date_str} {fim_str}", "%Y-%m-%d %H:%M")

        while atual < limite:
            slots.append(atual.strftime("%H:%M"))
            atual += timedelta(minutes=intervalo)

        start_of_day = datetime.strptime(f"{data} 00:00:00", "%Y-%m-%d %H:%M:%S")
        end_of_day = datetime.strptime(f"{data} 23:59:59", "%Y-%m-%d %H:%M:%S")

        appointments_ocupados = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.data_horario >= start_of_day,
            Appointment.data_horario <= end_of_day,
            Appointment.status.in_(["agendado", "confirmado", "em_andamento"]) 
        ).all()

        horas_ocupadas = [app.data_horario.strftime("%H:%M") for app in appointments_ocupados]
        
        fuso_brasil = timezone(timedelta(hours=-3))
        agora = datetime.now(fuso_brasil)
        data_hoje_str = agora.strftime("%Y-%m-%d")

        slots_livres = []
        for s in slots:
            if s in horas_ocupadas:
                continue
            
            if data == data_hoje_str:
                hora_slot = datetime.strptime(s, "%H:%M").time()
                if hora_slot <= agora.time():
                    continue 
            
            slots_livres.append(s)

        return slots_livres

    except Exception as e:
        print(f"Erro na geração de slots: {e}")
        return []


# --- 2. LISTAR AGENDAMENTOS GERAIS ---
@router.get("/", response_model=List[agendamentosResponse])
def list_all_appointments(
    data: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Appointment).options(
        joinedload(Appointment.doctor), 
        joinedload(Appointment.patient)
    )

    if current_user.role != 'superuser':
        query = query.filter(Appointment.clinic_id == current_user.clinic_id)

    if current_user.role == 'doctor':
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Appointment.doctor_id == doctor.id)
        else:
            return [] 

    if data:
        try:
            start_of_day = datetime.strptime(f"{data} 00:00:00", "%Y-%m-%d %H:%M:%S")
            end_of_day = datetime.strptime(f"{data} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(
                Appointment.data_horario >= start_of_day,
                Appointment.data_horario <= end_of_day
            )
        except Exception as e:
            print(f"Erro ao filtrar data na agenda: {e}")

    return query.order_by(Appointment.data_horario.asc()).all()


# --- 3. LISTAR MEUS AGENDAMENTOS (PACIENTE) ---
@router.get("/me", response_model=List[agendamentosResponse])
def list_my_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient: return []
    return db.query(Appointment).options(
        joinedload(Appointment.doctor), 
        joinedload(Appointment.patient)
    ).filter(Appointment.patient_id == patient.id).order_by(Appointment.data_horario.desc()).all()


# --- 4. CRIAR NOVO AGENDAMENTO ---
@router.post("/", response_model=agendamentosResponse, status_code=status.HTTP_201_CREATED)
def create_agendamentos(agendamento: agendamentosCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.id == agendamento.doctor_id).first()
    if not doctor: raise HTTPException(status_code=404, detail="Médico não encontrado.")
    
    # MURO DE CONCRETO: Separação de Regras
    patient_id_real = agendamento.patient_id
    
    if current_user.role in ['patient', 'paciente']:
        meu_perfil = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not meu_perfil:
            raise HTTPException(status_code=400, detail="Perfil de paciente não encontrado.")
        patient_id_real = meu_perfil.id
        
        # Se o paciente já tem clínica vinculada, ele não pode agendar em outra
        if meu_perfil.clinic_id and doctor.clinic_id != meu_perfil.clinic_id:
            raise HTTPException(status_code=403, detail="Você não pode agendar com profissionais de outras clínicas.")
            
        # Se o paciente ainda não tinha clínica, vincula ele agora
        if not meu_perfil.clinic_id:
            meu_perfil.clinic_id = doctor.clinic_id
            db.commit()
    else:
        # Se for Admin/Recepção/Médico, verifica a clínica
        if current_user.role != 'superuser' and doctor.clinic_id != current_user.clinic_id:
            raise HTTPException(status_code=403, detail="Acesso negado. Este profissional não pertence à sua clínica.")

    horario_conflito = db.query(Appointment).filter(
        Appointment.doctor_id == agendamento.doctor_id,
        Appointment.data_horario == agendamento.data_horario,
        Appointment.status.in_(["agendado", "confirmado"])
    ).first()

    if horario_conflito:
        raise HTTPException(status_code=400, detail="Este horário já foi preenchido. Por favor, escolha outro.")

    new_app = Appointment(
        clinic_id=doctor.clinic_id,
        doctor_id=agendamento.doctor_id,
        patient_id=patient_id_real,
        data_horario=agendamento.data_horario, 
        observacoes=agendamento.observacoes,
        duracao=agendamento.duracao, 
        status="agendado"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


# --- 5. CANCELAR AGENDAMENTO ---
@router.patch("/{appointment_id}/cancel")
def cancel_appointment(appointment_id: int, body: dict = Body(default={}), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    
    # MURO DE CONCRETO: Paciente só cancela a própria consulta
    if current_user.role in ['patient', 'paciente']:
        patient_profile = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient_profile or app.patient_id != patient_profile.id:
            raise HTTPException(status_code=403, detail="Você só tem permissão para cancelar suas próprias consultas.")
    elif current_user.role != 'superuser' and app.clinic_id != current_user.clinic_id:
        raise HTTPException(status_code=403, detail="Acesso negado a este agendamento.")
    
    app.status = "cancelado"
    db.commit()
    return {"message": "Consulta cancelada com sucesso"}


# --- 6. REAGENDAR CONSULTA ---
@router.patch("/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id: int, body: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    
    # MURO DE CONCRETO
    if current_user.role in ['patient', 'paciente']:
        patient_profile = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient_profile or app.patient_id != patient_profile.id:
            raise HTTPException(status_code=403, detail="Você só tem permissão para reagendar suas próprias consultas.")
    elif current_user.role != 'superuser' and app.clinic_id != current_user.clinic_id:
        raise HTTPException(status_code=403, detail="Acesso negado a este agendamento.")
    
    nova_data = body.get("data_horario")
    if nova_data:
        app.data_horario = datetime.strptime(nova_data, "%Y-%m-%dT%H:%M:%S")
    
    app.status = "agendado"
    db.commit()
    return {"message": "Consulta reagendada com sucesso"}


# --- 7. ATUALIZAR STATUS DA CONSULTA (INICIAR, FINALIZAR, ETC) ---
@router.patch("/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int, 
    novo_status: Optional[str] = Query(None),
    body: Optional[dict] = Body(default=None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['doctor', 'admin', 'superuser', 'medico']:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar status.")

    app_db = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app_db:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    
    if current_user.role != 'superuser' and app_db.clinic_id != current_user.clinic_id:
        raise HTTPException(status_code=403, detail="Acesso negado a este agendamento.")
    
    status_final = novo_status
    if not status_final and body and "novo_status" in body:
        status_final = body.get("novo_status")

    if not status_final:
        raise HTTPException(status_code=400, detail="O novo status não foi informado na requisição.")

    app_db.status = status_final
    db.commit()
    return {"message": f"Status atualizado para {status_final} com sucesso"}