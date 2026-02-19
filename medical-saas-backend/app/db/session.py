from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Cria o "motor" de conexão
engine = create_engine(settings.DATABASE_URL)

# Fábrica de sessões: cada request vai pedir uma sessão nova daqui
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Função "Dependency Injection" para usar nas rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()