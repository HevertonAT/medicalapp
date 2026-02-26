from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("A variável DATABASE_URL não foi encontrada no arquivo .env")

# --- AJUSTE MÁGICO PARA VERCEL + RENDER ---
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True, # Testa se a conexão está viva antes de usar (Evita quedas da Render)
    pool_size=5,        # Limita o número de conexões para a Vercel não sobrecarregar o banco
    max_overflow=10,
    connect_args={"connect_timeout": 10} # Se demorar mais de 10s para conectar, ele avisa em vez de travar
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()