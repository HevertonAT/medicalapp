import json
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.agendamentos import Appointment
from app.models.pacientes import Patient 
from app.models.usuarios import User
from app.models.profissionais import Doctor
from app.schemas.esquema_agendamentos import agendamentosCreate, agendamentosResponse, agendamentosReschedule

router = APIRouter()

# --- 1. BUSCA DE HORÁRIOS DISPONÍVEIS (NOVO AGENDAMENTO) ---
@router.get("/available-slots")
def get_available_slots(
    doctor_id: int,
    data: str,  # Formato esperado: YYYY-MM-DD
    db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor or not doctor.agenda_config:
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
        slots_livres = [s for s in slots if s not in horas_ocupadas]

        return slots_livres

    except Exception as e:
        print(f"Erro na geração de slots: {e}")
        return []


# --- 2. LISTAR AGENDAMENTOS GERAIS (TELA DO MÉDICO / ADMIN) ---
@router.get("/", response_model=List[agendamentosResponse])
def list_all_appointments(
    data: Optional[str] = None, # Parâmetro opcional para filtrar pelo calendário da tela
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Appointment).options(
        joinedload(Appointment.doctor), 
        joinedload(Appointment.patient)
    )

    # Lógica de quem pode ver o quê
    if current_user.role == 'doctor':
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Appointment.doctor_id == doctor.id)
        else:
            return []
    elif current_user.role in ['admin', 'superuser'] and current_user.clinic_id:
        query = query.filter(Appointment.clinic_id == current_user.clinic_id)

    # Filtro de Data Anti-Fuso Horário
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

    # Retorna ordenado pela hora
    return query.order_by(Appointment.data_horario.asc()).all()


# --- 3. LISTAR MEUS AGENDAMENTOS (TELA DO PACIENTE) ---
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
    
    # Bloqueio de horário duplicado
    horario_conflito = db.query(Appointment).filter(
        Appointment.doctor_id == agendamento.doctor_id,
        Appointment.data_horario == agendamento.data_horario,
        Appointment.status.in_(["agendado", "confirmado"])
    ).first()

    if horario_conflito:
        raise HTTPException(status_code=400, detail="Este horário já foi preenchido. Por favor, escolha outro.")

    patient_id_real = agendamento.patient_id
    if current_user.role in ['patient', 'paciente']:
        meu_perfil = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if meu_perfil:
            patient_id_real = meu_perfil.id
            if meu_perfil.clinic_id is None:
                meu_perfil.clinic_id = doctor.clinic_id
                db.add(meu_perfil)
        else: raise HTTPException(status_code=400, detail="Perfil de paciente não encontrado.")

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
def cancel_appointment(appointment_id: int, body: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    
    app.status = "cancelado"
    
    db.commit()
    return {"message": "Consulta cancelada com sucesso"}


# --- 6. REAGENDAR CONSULTA ---
@router.patch("/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id: int, body: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    
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
    novo_status: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Apenas médicos ou admins/superusers podem mudar status da consulta no painel
    if current_user.role not in ['doctor', 'admin', 'superuser']:
        raise HTTPException(status_code=403, detail="Sem permissão para alterar status.")

    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
    
    app.status = novo_status
    db.commit()
    return {"message": f"Status atualizado para {novo_status} com sucesso"}