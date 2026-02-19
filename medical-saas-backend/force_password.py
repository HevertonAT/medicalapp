from app.db.base import SessionLocal
from app.core.security import get_password_hash

# ==============================================================================
# 🛡️ IMPORTAÇÃO BLINDADA (TODOS OS MODELS DO SISTEMA)
# ==============================================================================
# Isso garante que o SQLAlchemy conheça todas as tabelas e relacionamentos.
# Se faltar UM, ele reclama que não achou o nome.

# 1. Essenciais (Núcleo)
from app.models.usuarios import User
from app.models.clinicas import Clinic
from app.models.unidades import Unit  # Se existir a classe Unit

# 2. Pessoas
from app.models.pacientes import Patient
from app.models.profissionais import Doctor

# 3. Operacional
from app.models.agendamentos import Appointment
from app.models.prontuarios import MedicalRecord
from app.models.transacoes import Transaction
from app.models.documentos import Document
from app.models.arquivos_pacientes import PatientFile
from app.models.assinaturas import Subscription

# 4. Configurações e Tabelas Auxiliares
from app.models.convenios import Insurance
from app.models.regras_especialidades import SpecialtyRule
from app.models.macros import Macro
from app.models.planos import Plan  # Se existir a classe Plan

# 5. Financeiro e Administrativo (Onde estava o erro atual!)
from app.models.comissoes_profissionais import ProfessionalCommission
from app.models.precos_procedimentos import ProcedurePrice
from app.models.cargos_usuarios import UserRole  # Verifique se o nome da classe é UserRole ou Role
from app.models.logs_auditoria import AuditLog
from app.models.comunicacoes import Communication

# ==============================================================================

# Configurações do Alvo
TARGET_EMAIL = "heverton.alberto.tome@gmail.com"
NEW_PASSWORD = "030797HeVe@!#" 

def reset_password():
    print("🔄 Iniciando conexão com o banco...")
    db = SessionLocal()
    try:
        print(f"🔍 Buscando usuário: {TARGET_EMAIL}...")
        
        # Busca o usuário
        user = db.query(User).filter(User.email == TARGET_EMAIL).first()
        
        if not user:
            print(f"❌ Erro: Usuário {TARGET_EMAIL} não encontrado no banco.")
            return

        print(f"✅ Usuário encontrado: {user.full_name} (ID: {user.id})")
        
        # Gera o novo hash da senha
        print("🔐 Gerando nova senha...")
        user.hashed_password = get_password_hash(NEW_PASSWORD)
        
        # Salva no banco
        db.commit()
        
        print("="*40)
        print(f"🚀 SUCESSO! Senha atualizada.")
        print(f"📧 Login: {TARGET_EMAIL}")
        print(f"🔑 Senha: {NEW_PASSWORD}")
        print("="*40)
        
    except Exception as e:
        print(f"❌ Erro crítico ao atualizar: {e}")
        # Dica extra se der erro de nome de classe
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("🔌 Conexão fechada.")

if __name__ == "__main__":
    reset_password()