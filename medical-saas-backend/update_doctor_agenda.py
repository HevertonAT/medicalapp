import sys
import os
import json

# Adiciona o diretório atual ao PYTHONPATH para importar os módulos da app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import SessionLocal, engine, Base
import glob
from importlib import import_module
for f in glob.glob("app/models/*.py"):
    name = f.replace("\\", ".").replace("/", ".").replace(".py", "")
    try:
        import_module(name)
    except:
        pass

from app.models.usuarios import User
from app.models.profissionais import Doctor

db = SessionLocal()
try:
    doc_email = "medico@clinica1.com"
    doc_user = db.query(User).filter(User.email == doc_email).first()
    if doc_user:
        doc_profile = db.query(Doctor).filter(Doctor.user_id == doc_user.id).first()
        if doc_profile:
            default_config = {
                "seg": { "ativo": True, "inicio": "08:00", "fim": "18:00" },
                "ter": { "ativo": True, "inicio": "08:00", "fim": "18:00" },
                "qua": { "ativo": True, "inicio": "08:00", "fim": "18:00" },
                "qui": { "ativo": True, "inicio": "08:00", "fim": "18:00" },
                "sex": { "ativo": True, "inicio": "08:00", "fim": "18:00" },
                "sab": { "ativo": False, "inicio": "08:00", "fim": "12:00" },
                "dom": { "ativo": False, "inicio": "08:00", "fim": "12:00" },
                "intervalo": 30
            }
            doc_profile.agenda_config = default_config
            db.commit()
            print("Agenda_config updated successfully for medico@clinica1.com.")
        else:
            print("Doctor profile not found.")
    else:
        print("User not found.")
except Exception as e:
    print(e)
finally:
    db.close()
