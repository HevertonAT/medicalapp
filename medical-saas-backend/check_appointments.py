import sys
import os
import glob
from importlib import import_module

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

for f in glob.glob("app/models/*.py"):
    name = f.replace("\\", ".").replace("/", ".").replace(".py", "")
    try:
        import_module(name)
    except:
        pass

from app.db.base import SessionLocal
from app.models.agendamentos import Appointment

db = SessionLocal()
appointments = db.query(Appointment).all()
print(f"Appointments found: {len(appointments)}")
for a in appointments:
    print(f"ID={a.id}, DoctorID={a.doctor_id}, PatientID={a.patient_id}, DateTime={a.data_horario}, Status={a.status}")
