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
from app.models.usuarios import User
from app.models.profissionais import Doctor
from app.models.pacientes import Patient

db = SessionLocal()
users = db.query(User).all()
print(f"Users found: {len(users)}")
for u in users:
    print(f"User: ID={u.id}, Email={u.email}, Role={u.role}")
    if u.role == "doctor":
        doc = db.query(Doctor).filter(Doctor.user_id == u.id).first()
        if doc:
            print(f"  -> Linked Doctor Profile: ID={doc.id}, Name={doc.nome}, CRM={doc.crm}, ClinicID={doc.clinic_id}")
            print(f"  -> Agenda Config: {doc.agenda_config}")
        else:
            print("  -> ERROR: No Linked Doctor Profile!")
    elif u.role == "patient":
        pat = db.query(Patient).filter(Patient.user_id == u.id).first()
        if pat:
            print(f"  -> Linked Patient Profile: ID={pat.id}, Name={pat.nome_completo}, ClinicID={pat.clinic_id}")
        else:
            print("  -> ERROR: No Linked Patient Profile!")


