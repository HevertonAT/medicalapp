import sys
import os
import glob
from importlib import import_module
from datetime import datetime, date

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

for f in glob.glob("app/models/*.py"):
    name = f.replace("\\", ".").replace("/", ".").replace(".py", "")
    try:
        import_module(name)
    except:
        pass

from app.db.base import SessionLocal
from app.models.agendamentos import Appointment
from app.models.profissionais import Doctor
from app.models.pacientes import Patient

db = SessionLocal()
try:
    doctor = db.query(Doctor).filter(Doctor.id == 3).first()
    patient = db.query(Patient).filter(Patient.id == 2).first()
    
    if not doctor or not patient:
        print("Doctor or Patient not found. Make sure create_test_users.py has been run!")
        sys.exit(1)

    print(f"Creating test appointments for Doctor: {doctor.nome} (ID={doctor.id}) and Patient: {patient.nome_completo} (ID={patient.id})")
    
    # Let's delete any existing old test appointments for Doctor 3 to start fresh
    db.query(Appointment).filter(Appointment.doctor_id == 3).delete()
    db.commit()

    today_str = date.today().strftime("%Y-%m-%d")
    print(f"Target Date: {today_str}")

    # 1. Appointment at 09:00 (Status 1: Agendado)
    app1 = Appointment(
        clinic_id=1,
        doctor_id=3,
        patient_id=2,
        data_horario=datetime.strptime(f"{today_str} 09:00:00", "%Y-%m-%d %H:%M:%S"),
        duracao=30,
        status=1, # 1: Agendado
        observacoes="Consulta de rotina mensal."
    )

    # 2. Appointment at 10:00 (Status 2: Em Andamento)
    app2 = Appointment(
        clinic_id=1,
        doctor_id=3,
        patient_id=2,
        data_horario=datetime.strptime(f"{today_str} 10:00:00", "%Y-%m-%d %H:%M:%S"),
        duracao=30,
        status=2, # 2: Em Andamento
        observacoes="Retorno de exames de sangue."
    )

    # 3. Appointment at 11:30 (Status 3: Realizado)
    app3 = Appointment(
        clinic_id=1,
        doctor_id=3,
        patient_id=2,
        data_horario=datetime.strptime(f"{today_str} 11:30:00", "%Y-%m-%d %H:%M:%S"),
        duracao=30,
        status=3, # 3: Realizado
        observacoes="Primeira consulta - Avaliação geral."
    )

    db.add_all([app1, app2, app3])
    db.commit()
    print("Appointments created successfully!")

except Exception as e:
    db.rollback()
    print(f"Error seeding appointments: {e}")
finally:
    db.close()
