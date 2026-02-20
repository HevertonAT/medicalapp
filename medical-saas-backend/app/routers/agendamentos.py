from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func # <--- IMPORTANTE: Adicionado para filtros de data
from typing import List, Optional
from datetime import datetime, timedelta # <--- IMPORTANTE: Adicionado para lógica de horários

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.agendamentos import Appointment
from app.models.pacientes import Patient 
from app.models.usuarios import User
from app.models.profissionais import Doctor
from app.schemas.esquema_agendamentos import agendamentosCreate, agendamentosResponse, agendamentosReschedule

router = APIRouter()

# --- NOVA ROTA: BUSCA DE HORÁRIOS DISPONÍVEIS ---
@router.get("/available-slots")
def get_available_slots(
    doctor_id: int,
    data: str,  # Formato esperado: YYYY-MM-DD
    db: Session = Depends(get_db)
):
    # 1. Busca o profissional e sua configuração de agenda
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor or not doctor.agenda_config:
        return []

    try:
        # 2. Converte a data da string para objeto date
        data_obj = datetime.strptime(data, "%Y-%m-%d").date()
        
        # 3. Identifica o dia da semana (seg, ter, qua...)
        # weekday() retorna 0 para segunda e 6 para domingo em Python
        mapa_dias = {0: 'seg', 1: 'ter', 2: 'qua', 3: 'qui', 4: 'sex', 5: 'sab', 6: 'dom'}
        dia_chave = mapa_dias[data_obj.weekday()]

        # 4. Verifica se o médico atende nesse dia
        config_dia = doctor.agenda_config.get(dia_chave)
        if not config_dia or not config_dia.get('ativo'):
            return []

        # 5. Gera os slots possíveis baseados no intervalo
        inicio_str = config_dia.get('inicio', "08:00")
        fim_str = config_dia.get('fim', "18:00")
        intervalo = int(doctor.agenda_config.get('intervalo', 30))

        slots = []
        # Usamos uma data base fictícia para somar as horas
        atual = datetime.strptime(inicio_str, "%H:%M")
        limite = datetime.strptime(fim_str, "%H:%M")

        while atual < limite:
            slots.append(atual.strftime("%H:%M"))
            atual += timedelta(minutes=intervalo)

        # 6. Busca agendamentos ocupados no banco de dados para este médico nesta data
        # Filtramos apenas agendamentos que NÃO estão cancelados
        appointments_ocupados = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            func.date(Appointment.data_horario) == data_obj,
            Appointment.status != "CANCELADO"
        ).all()

        # Extrai as horas ocupadas para comparação (formato HH:MM)
        horas_ocupadas = [app.data_horario.strftime("%H:%M") for app in appointments_ocupados]

        # 7. Filtro final: Retorna apenas slots que NÃO estão ocupados
        slots_livres = [s for s in slots if s not in horas_ocupadas]

        return slots_livres

    except Exception as e:
        print(f"Erro ao gerar slots: {e}")
        return []

# --- MANTIDAS AS OUTRAS ROTAS ABAIXO ---
@router.get("/me", response_model=List[agendamentosResponse])
def list_my_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient: return []
    return db.query(Appointment).options(joinedload(Appointment.doctor), joinedload(Appointment.patient)).filter(Appointment.patient_id == patient.id).order_by(Appointment.data_horario.desc()).all()

@router.post("/", response_model=agendamentosResponse, status_code=status.HTTP_201_CREATED)
def create_agendamentos(agendamento: agendamentosCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.id == agendamento.doctor_id).first()
    if not doctor: raise HTTPException(status_code=404, detail="Médico não encontrado.")
    
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