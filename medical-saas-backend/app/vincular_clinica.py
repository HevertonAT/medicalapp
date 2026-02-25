from app.db.session import SessionLocal
from app.models.clinicas import Clinic
from app.models.usuarios import User
from app.models.pacientes import Patient
from app.models.profissionais import Doctor
from app.models.agendamentos import Appointment
from app.models.transacoes import Transaction
from app.models.prontuarios import MedicalRecord
from app.models.arquivos_pacientes import PatientFile
from app.models.documentos import Document
from app.models.convenios import Insurance
from app.models.assinaturas import Subscription
from app.models.comissoes_profissionais import ProfessionalCommission
from app.models.planos import Plan
from app.models.precos_procedimentos import ProcedurePrice
from app.models.unidades import Unit
from app.models.cargos import Role
from app.models.logs_auditoria import AuditLog

def resgatar_banco():
    db = SessionLocal()
    
    clinica = db.query(Clinic).first()
    if not clinica:
        print("Erro: Nenhuma clínica encontrada.")
        return

    # As linhas que já rodamos antes (não faz mal rodar de novo)
    db.query(User).filter(User.clinic_id == None).update({"clinic_id": clinica.id})
    db.query(Doctor).filter(Doctor.clinic_id == None).update({"clinic_id": clinica.id})
    
    # --- A LINHA MÁGICA QUE FALTAVA: Vinculando os pacientes! ---
    pacientes_atualizados = db.query(Patient).filter(Patient.clinic_id == None).update({"clinic_id": clinica.id})
    
    db.commit()
    print(f"✅ Sucesso! {pacientes_atualizados} pacientes foram resgatados e vinculados à clínica.")
    db.close()

if __name__ == "__main__":
    resgatar_banco()