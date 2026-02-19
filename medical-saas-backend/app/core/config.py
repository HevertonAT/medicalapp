import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Clinify"
    PROJECT_VERSION: str = "1.0.0"

    # Tenta pegar do .env; se não achar, usa um valor padrão (fallback)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/db")

    # Segurança
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chave_padrao_insegura_para_dev")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 

settings = Settings() 