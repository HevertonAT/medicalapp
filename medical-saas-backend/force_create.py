from app.db.session import engine
from app.db.base import Base

# IMPORTS
from app.models.usuarios import User
from app.models.clinicas import Clinic
from app.models.pacientes import Patient
from app.models.profissionais import Doctor
from app.models.agendamentos import Appointment
from app.models.transacoes import Transaction
# NOVOS:
from app.models.prontuarios import MedicalRecord
from app.models.macros import Macro

print("🔨 Criando tabelas de Prontuário e Macros...")
Base.metadata.create_all(bind=engine)
print("✅ Tabelas criadas com sucesso!")