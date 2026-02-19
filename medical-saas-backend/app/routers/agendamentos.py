from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload # <--- IMPORTANTE: joinedload adicionado
from typing import List, Optional

# Ajuste: Importar get_db de app.db.base
from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.agendamentos import Appointment
from app.models.pacientes import Patient 
from app.models.usuarios import User
from app.models.profissionais import Doctor

# Ajuste: Schemas
from app.schemas.esquema_agendamentos import agendamentosCreate, agendamentosResponse, agendamentosReschedule

router = APIRouter()

# --- ROTAS ---

# ROTA ESPECÍFICA PARA O PACIENTE (Meus Agendamentos)
@router.get("/me", response_model=List[agendamentosResponse])
def list_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Descobre quem é o paciente ligado a este usuário
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    
    if not patient:
        return []

    # 2. Busca agendamentos deste paciente
    # USANDO JOINEDLOAD PARA TRAZER NOME DO MÉDICO E DADOS DO PACIENTE
    appointments = db.query(Appointment)\
        .options(joinedload(Appointment.doctor), joinedload(Appointment.patient))\
        .filter(Appointment.patient_id == patient.id)\
        .order_by(Appointment.data_horario.desc())\
        .all()
        
    return appointments


@router.get("/", response_model=List[agendamentosResponse])
def get_agendamentos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Inicia a query base COM JOINEDLOAD
    query = db.query(Appointment).options(joinedload(Appointment.doctor), joinedload(Appointment.patient))

    # REGRA 1: ADMIN / SUPERUSER - Vê tudo da sua clínica
    if current_user.role in ['admin', 'superuser']:
        if current_user.clinic_id:
            query = query.filter(Appointment.clinic_id == current_user.clinic_id)

    # REGRA 2: MÉDICO - Vê apenas as suas consultas
    elif current_user.role == 'doctor':
        # Busca o perfil de médico deste usuário
        doctor_profile = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor_profile:
            query = query.filter(Appointment.doctor_id == doctor_profile.id)
        else:
            return [] # Médico sem perfil cadastrado não vê nada

    # REGRA 3: PACIENTE - Vê apenas seus próprios agendamentos
    elif current_user.role in ['patient', 'paciente']:
        # Busca o perfil de paciente atrelado ao usuário logado
        patient_profile = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        
        if patient_profile:
            query = query.filter(Appointment.patient_id == patient_profile.id)
        else:
            return []

    # Ordena por data e retorna
    return query.order_by(Appointment.data_horario.asc()).all()

@router.post("/", response_model=agendamentosResponse, status_code=status.HTTP_201_CREATED)
def create_agendamentos(
    agendamento: agendamentosCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Busca o médico para descobrir de qual CLÍNICA ele é
    doctor = db.query(Doctor).filter(Doctor.id == agendamento.doctor_id).first()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Médico não encontrado.")

    # A clínica do agendamento será a mesma do médico
    clinic_id_real = doctor.clinic_id

    # 2. Identifica o Paciente Real
    patient_id_real = agendamento.patient_id

    # Lógica de Vínculo: Se for o próprio paciente agendando
    if current_user.role in ['patient', 'paciente']:
        meu_perfil = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        
        if meu_perfil:
            patient_id_real = meu_perfil.id
            
            # --- O PULO DO GATO: Vínculo Automático ---
            # Se o paciente não tem clínica (clinic_id is None), vincula agora!
            if meu_perfil.clinic_id is None:
                print(f"🔗 Vinculando Paciente {meu_perfil.nome_completo} à Clínica ID {clinic_id_real}")
                meu_perfil.clinic_id = clinic_id_real
                db.add(meu_perfil)
        else:
             raise HTTPException(status_code=400, detail="Perfil de paciente não encontrado.")

    # 3. Cria o objeto Appointment
    new_app = Appointment(
        clinic_id=clinic_id_real,      # Usa a clínica do médico
        doctor_id=agendamento.doctor_id,
        patient_id=patient_id_real,    # Usa o ID confirmado do paciente
        data_horario=agendamento.data_horario, 
        observacoes=agendamento.observacoes,
        duracao=agendamento.duracao, 
        status="agendado"
    )
    
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    
    return new_app 

# --- ROTA DE REAGENDAMENTO ---
@router.patch("/{agendamentos_id}/reschedule")
def reschedule_agendamentos(
    agendamentos_id: int, # ID agora é Inteiro
    data: agendamentosReschedule, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Busca o agendamento original
    original_app = db.query(Appointment).filter(Appointment.id == agendamentos_id).first()
    if not original_app:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    # 2. Cria o NOVO agendamento (Cópia com nova data)
    # Formata a data antiga para string (DD/MM/YYYY) para salvar no log
    data_antiga_str = original_app.data_horario.strftime('%d/%m/%Y %H:%M')
    
    new_app = Appointment(
        clinic_id=original_app.clinic_id,
        doctor_id=original_app.doctor_id,
        patient_id=original_app.patient_id,
        duracao=original_app.duracao,
        data_horario=data.data_horario, # Nova Data
        status="agendado",              # Status ativo
        observacoes=f"{data.motivo} (Reagendado de {data_antiga_str})"
    )
    
    # 3. Atualiza o status do ANTIGO para 'reagendado' (histórico)
    original_app.status = "reagendado"
    
    # 4. Salva tudo (Commit único para garantir integridade)
    db.add(new_app)
    db.add(original_app)
    db.commit()
    db.refresh(new_app)
    
    return {"message": "Reagendado com sucesso", "new_id": new_app.id}

@router.patch("/{id}/status")
def update_status(
    id: int, # ID Inteiro
    novo_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Busca garantindo que pertence à clínica
    app = db.query(Appointment).filter(
        Appointment.id == id,
        Appointment.clinic_id == current_user.clinic_id
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")

    app.status = novo_status
    db.commit()
    return {"message": "Status atualizado"}