from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

# Pega a string de conexão do .env
# Se não achar, tenta um default (ajuste se necessário)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("A variável DATABASE_URL não foi encontrada no arquivo .env")
# 1. Cria a Engine (O motor de conexão com o Banco)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
# 2. Cria a SessionLocal (Fábrica de sessões para usar no código)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# 3. Cria a Base (Classe pai de todos os models)
Base = declarative_base()
# Função auxiliar para pegar o DB (Dependency Injection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()