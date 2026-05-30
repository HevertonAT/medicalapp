import sys
import os

# Adiciona o diretório atual ao PYTHONPATH para importar os módulos da app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import SessionLocal, engine, Base
from app.models.usuarios import User
import glob
from importlib import import_module
for f in glob.glob("app/models/*.py"):
    name = f.replace("\\", ".").replace("/", ".").replace(".py", "")
    try:
        import_module(name)
    except:
        pass

from app.models.profissionais import Doctor
from app.models.pacientes import Patient
from app.models.clinicas import Clinic
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_users():
    db = SessionLocal()
    try:
        # Garante que as tabelas existam
        Base.metadata.create_all(bind=engine)
        
        # Garante que existe a clínica 1
        clinica = db.query(Clinic).filter(Clinic.id == 1).first()
        if not clinica:
            clinica = Clinic(id=1, nome="Clínica Teste Principal")
            db.add(clinica)
            db.commit()

        # 1. ADMIN
        admin_email = "admin@clinica1.com"
        if not db.query(User).filter(User.email == admin_email).first():
            admin_user = User(
                email=admin_email,
                full_name="Admin Teste",
                hashed_password=get_password_hash("123456"),
                role="admin",
                clinic_id=1,
                is_active=True
            )
            db.add(admin_user)

        # 2. MÉDICO
        doc_email = "medico@clinica1.com"
        doc_user = db.query(User).filter(User.email == doc_email).first()
        if not doc_user:
            doc_user = User(
                email=doc_email,
                full_name="Dr. Teste Médico",
                hashed_password=get_password_hash("123456"),
                role="doctor",
                clinic_id=1,
                is_active=True
            )
            db.add(doc_user)
            db.commit()
            db.refresh(doc_user)
            
        # Cria o perfil de profissional
        doc_profile = db.query(Doctor).filter(Doctor.user_id == doc_user.id).first()
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
        if doc_user and not doc_profile:
            doc_profile = Doctor(
                user_id=doc_user.id,
                nome="Dr. Teste Médico",
                crm="12345-SP",
                especialidade="Clínico Geral",
                clinic_id=1,
                ativo=True,
                agenda_config=default_config
            )
            db.add(doc_profile)
        elif doc_profile and not doc_profile.agenda_config:
            doc_profile.agenda_config = default_config

        # 3. RECEPCIONISTA
        rec_email = "recepcao@clinica1.com"
        if not db.query(User).filter(User.email == rec_email).first():
            rec_user = User(
                email=rec_email,
                full_name="Recepcionista Teste",
                hashed_password=get_password_hash("123456"),
                role="recepcionista",
                clinic_id=1,
                is_active=True
            )
            db.add(rec_user)

        # 4. PACIENTE
        pat_email = "paciente@clinica1.com"
        pat_user = db.query(User).filter(User.email == pat_email).first()
        if not pat_user:
            pat_user = User(
                email=pat_email,
                full_name="Paciente Teste",
                hashed_password=get_password_hash("123456"),
                role="patient",
                clinic_id=1,
                is_active=True
            )
            db.add(pat_user)
            db.commit()
            db.refresh(pat_user)
            
        # Cria perfil de paciente
        if pat_user and not db.query(Patient).filter(Patient.user_id == pat_user.id).first():
            pat_profile = Patient(
                user_id=pat_user.id,
                nome_completo="Paciente Teste",
                cpf="11122233344",
                telefone="11999999999",
                clinic_id=1,
                ativo=True
            )
            db.add(pat_profile)

        db.commit()
        print("Usuários criados com sucesso!")
        print("Logins disponíveis:")
        print("- Admin: admin@clinica1.com | Senha: 123456")
        print("- Médico: medico@clinica1.com | Senha: 123456")
        print("- Recepcionista: recepcao@clinica1.com | Senha: 123456")
        print("- Paciente: paciente@clinica1.com | Senha: 123456")
        
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar usuários: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_users()
