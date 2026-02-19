import sys
from app.db.base import engine, SessionLocal, Base
from app.core.security import get_password_hash

# Importar TODOS os models para que SQLAlchemy consiga resolver os relacionamentos
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

def create_super_user():
    try:
        # Criar todas as tabelas se não existirem
        Base.metadata.create_all(bind=engine)
        
        db = SessionLocal()
        
        EMAIL_DEV = "heverton.alberto.tome@gmail.com"
        SENHA_DEV = "030797HeVe@!#"
        NOME_DEV = "Heverton Dev"

        print(f"🔍 Verificando se {EMAIL_DEV} já existe...")
        
        user = db.query(User).filter(User.email == EMAIL_DEV).first()
        
        if user:
            print(f"⚠️ O usuário {EMAIL_DEV} já existe!")
            user.role = "superuser"
            user.is_superuser = True
            user.is_active = True
            user.full_name = NOME_DEV
            db.commit()
            print(f"✅ Atualizado para 'superuser' com sucesso.")
        else:
            print("✨ Criando novo Superusuário...")
            new_user = User(
                email=EMAIL_DEV,
                full_name=NOME_DEV,
                hashed_password=get_password_hash(SENHA_DEV),
                role="superuser", 
                is_superuser=True,
                is_active=True,
                clinic_id=None  # Superuser não precisa estar vinculado a uma clínica
            )
            db.add(new_user)
            db.commit()
            print(f"🚀 Sucesso! Superusuário criado com sucesso.")
        
        print(f"\n📋 Dados de acesso:")
        print(f"📧 E-mail: {EMAIL_DEV}")
        print(f"🔑 Senha:  {SENHA_DEV}")
        print(f"👤 Nome:   {NOME_DEV}")
        print(f"👑 Tipo:   SUPERUSER (DEV)\n")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar superusuário: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = create_super_user()
    sys.exit(0 if success else 1)