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
from app.models.profissionais import Doctor

db = SessionLocal()
doctors = db.query(Doctor).all()
print(f"Doctors found: {len(doctors)}")
for d in doctors:
    print(f"ID={d.id}, Name={d.nome}, CRM={d.crm}, UserID={d.user_id}, ClinicID={d.clinic_id}, Ativo={d.ativo}")
