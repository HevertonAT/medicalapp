import os
import sys
from loguru import logger

# Garantir que a pasta logs existe
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Remover a configuração padrão do loguru para não duplicar
logger.remove()

# Configuração para o console (cores, infos)
logger.add(
    sys.stdout, 
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)

# Configuração para o arquivo (rotativo)
log_file_path = os.path.join(LOG_DIR, "app_{time:YYYY-MM-DD}.log")
logger.add(
    log_file_path,
    rotation="10 MB",     # Rotação a cada 10 MB
    retention="14 days",  # Manter logs por 14 dias
    compression="zip",    # Zipar logs antigos
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="INFO",
    backtrace=True,       # Incluir variáveis e stack de exceções completas
    diagnose=True         # Mais detalhes no erro
)
