import logging
from sqlalchemy.orm import Session
from sqlalchemy import text # <--- Importação necessária para o comando SQL bruto
from app.db.base import Base, engine, SessionLocal
from app.core.security import get_password_hash

# --- IMPORTANTE: IMPORTAR TODOS OS MODELS ---
from app.models.clinicas import Clinic
from app.models.planos import Plan
from app.models.cargos import Role
from app.models.unidades import Unit
from app.models.convenios import Insurance
from app.models.usuarios import User
from app.models.cargos_usuarios import UserRole
from app.models.profissionais import Doctor
from app.models.pacientes import Patient
from app.models.agendamentos import Appointment
from app.models.prontuarios import MedicalRecord
from app.models.transacoes import Transaction
from app.models.assinaturas import Subscription
from app.models.documentos import Document
from app.models.arquivos_pacientes import PatientFile
from app.models.comunicacoes import Communication
from app.models.logs_auditoria import AuditLog
from app.models.macros import Macro
from app.models.precos_procedimentos import ProcedurePrice
from app.models.comissoes_profissionais import ProfessionalCommission
from app.models.convenios import Insurance
from app.models.regras_especialidades import SpecialtyRule

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    db: Session = SessionLocal()
    
    try:
        logger.info("☢️  MÓDULO NUCLEAR ATIVADO: Resetando Schema do Banco...")
        
        # --- AQUI ESTÁ A CORREÇÃO ---
        # Em vez de tentar apagar tabela por tabela, apagamos o esquema inteiro.
        # Isso remove as tabelas "fantasmas" antigas que estão travando o processo.
        with engine.connect() as connection:
            connection.execute(text("DROP SCHEMA public CASCADE;"))
            connection.execute(text("CREATE SCHEMA public;"))
            connection.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            connection.commit() # Confirma a destruição
        
        logger.info("🔨 Criando novas tabelas (IDs Inteiros e Nomes em PT-BR)...")
        Base.metadata.create_all(bind=engine)
        
        # --- SEED DATA (DADOS INICIAIS) ---
        logger.info("🌱 Inserindo dados iniciais...")

        # 1. Criar um Plano Básico
        plano_basico = Plan(
            nome="Plano Starter",
            preco_mensal=0.0,
            max_usuarios=5,
            max_pacientes=100
        )
        db.add(plano_basico)
        db.flush() 

        # 2. Criar uma Clínica Exemplo
        clinica = Clinic(
            nome="Clínica Exemplo",
            endereco="Rua das Flores, 123",
            telefone="(11) 99999-9999"
        )
        db.add(clinica)
        db.flush() 

        # 3. Criar uma Assinatura
        from datetime import date
        assinatura = Subscription(
            clinic_id=clinica.id,
            plan_id=plano_basico.id,
            data_inicio=date.today(),
            status="ativo"
        )
        db.add(assinatura)

        # 4. Criar Usuário Admin
        senha_hash = get_password_hash("admin")
        
        superuser = User(
            email="heverton.alberto.tome@gmail.com",
            hashed_password=senha_hash,
            full_name="Heverton SuperUser",
            role="admin",
            is_superuser=True,
            clinic_id=clinica.id
        )
        db.add(superuser)
        
        db.commit()
        logger.info("✅ Banco de dados recriado com sucesso!")
        logger.info(f"🔑 Usuário criado: admin@admin.com / Senha: admin")
        
    except Exception as e:
        logger.error(f"❌ Erro ao resetar banco: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("⚠️  ATENÇÃO: Isso apagará TODOS os dados do banco.")
    confirm = input("Digite 'SIM' para continuar: ")
    
    if confirm == "SIM":
        init_db()
    else:
        print("Operação cancelada.")