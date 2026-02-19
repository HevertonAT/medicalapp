from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Role(Base):
    __tablename__ = "cargos"

    # ID Inteiro Sequencial
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome = Column(String, unique=True, index=True, nullable=False)
    descricao = Column(String, nullable=True)