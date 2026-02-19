from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from typing import Optional
from app.db.base import get_db
from app.core.deps import get_current_user

# Ajuste: Importar Models Corretos (Inglês) dos arquivos em Português
from app.models.usuarios import User
from app.models.pacientes import Patient
from app.models.agendamentos import Appointment

router = APIRouter()

@router.get("/")
def get_dashboard_stats(
    period: str = "today", 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Lógica de Datas
    today = date.today()
    filter_start = today
    filter_end = today

    if period == "weekly":
        filter_start = today - timedelta(days=today.weekday()) # Segunda-feira
        filter_end = today
    elif period == "monthly":
        filter_start = today.replace(day=1) # Dia 1 do mês
        filter_end = today
    elif period == "custom" and start_date and end_date:
        try:
            filter_start = datetime.strptime(start_date, "%Y-%m-%d").date()
            filter_end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            pass # Mantém o padrão (today) se der erro na conversão
    
    # 1. Total de Pacientes (Sempre total geral da clínica)
    total_patients = db.query(Patient).filter(
        Patient.clinic_id == current_user.clinic_id,
        Patient.ativo == True
    ).count()

    # 2. Consultas no Período (Contagem)
    # Usamos func.date para comparar apenas a parte da data, ignorando a hora
    appointments_query = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        func.date(Appointment.data_horario) >= filter_start,
        func.date(Appointment.data_horario) <= filter_end
    )
    
    # Filtramos cancelados da contagem do card
    appointments_count = appointments_query.filter(Appointment.status != 'cancelado').count()

    # 3. LISTA DE ATENDIMENTOS DO PERÍODO
    period_appointments = appointments_query.order_by(Appointment.data_horario.desc()).all()

    appointments_list = []
    for app in period_appointments:
        # CORREÇÃO CRÍTICA: Acessar via relacionamento (ORM)
        # Verificamos se app.patient existe para evitar erro se o paciente foi deletado
        pat_name = app.patient.nome_completo if app.patient else "Paciente Excluído"
        doc_name = app.doctor.nome if app.doctor else "Médico não atribuído"

        appointments_list.append({
            "id": app.id, # Agora é Inteiro
            "patient_name": pat_name,
            "doctor_name": doc_name,
            "data_horario": app.data_horario,
            "status": app.status
        })

    return {
        "period": period,
        "total_patients": total_patients,
        "appointments_count": appointments_count,
        "appointments_list": appointments_list
    }