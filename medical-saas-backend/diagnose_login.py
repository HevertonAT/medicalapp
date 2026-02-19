from app.db.base import SessionLocal
# Importação total para evitar erros de relacionamento
from app.models.usuarios import User
from app.models.clinicas import Clinic
from app.models.profissionais import Doctor
from app.models.pacientes import Patient
from app.models.agendamentos import Appointment
from app.models.prontuarios import MedicalRecord
from app.models.transacoes import Transaction
from app.models.convenios import Insurance
from app.models.documentos import Document
from app.models.arquivos_pacientes import PatientFile
from app.models.regras_especialidades import SpecialtyRule
from app.models.comissoes_profissionais import ProfessionalCommission
from app.models.precos_procedimentos import ProcedurePrice
from app.models.cargos_usuarios import UserRole
from app.models.logs_auditoria import AuditLog
from app.models.comunicacoes import Communication

# Importa a função de verificação de segurança
try:
    from app.core.security import verify_password
except ImportError:
    # Caso o nome seja diferente, tente adaptar ou avise
    print("❌ Erro: Não encontrei 'verify_password' em app.core.security")
    exit(1)

# DADOS PARA TESTE
TEST_EMAIL = "heverton.alberto.tome@gmail.com"
TEST_PASSWORD = "030797HeVe@!#"

def test_login_internally():
    print("🕵️‍♂️ INICIANDO DIAGNÓSTICO DE LOGIN...")
    db = SessionLocal()
    
    try:
        # 1. Tenta achar o usuário
        user = db.query(User).filter(User.email == TEST_EMAIL).first()
        
        if not user:
            print(f"❌ FALHA: Usuário '{TEST_EMAIL}' NÃO encontrado no banco de dados.")
            print("   -> Verifique se o e-mail está correto ou se você está conectado ao banco certo.")
            return

        print(f"✅ Usuário encontrado: ID {user.id} | Nome: {user.full_name}")
        print(f"   -> E-mail no banco: '{user.email}' (Verifique se há espaços extras)")
        print(f"   -> Hash da senha gravado começa com: {user.hashed_password[:15]}...")
        
        # 2. Testar a senha
        print(f"\n🔑 Testando senha: '{TEST_PASSWORD}' ...")
        is_valid = verify_password(TEST_PASSWORD, user.hashed_password)
        
        if is_valid:
            print("\n✅ SUCESSO: A senha é VÁLIDA e o hash corresponde!")
            print("   -> Se o login no Frontend falha, o problema é no FRONTEND (envio dos dados).")
        else:
            print("\n❌ FALHA: A senha está INCORRETA segundo o hash do banco.")
            print("   -> O problema é que o 'force_password.py' gerou um hash que o 'verify_password' não reconhece.")
            print("   -> Isso pode acontecer se mudou a SECRET_KEY ou o algoritmo de hash.")

    except Exception as e:
        print(f"\n❌ ERRO TÉCNICO: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_login_internally()