from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

# NOME DA CLASSE: Unit (Singular, Inglês)
class Unit(Base):
    __tablename__ = "unidades" # NOME DA TABELA: unidades (Plural, Português)

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome = Column(String, nullable=False) # Ex: Matriz, Filial Centro
    endereco = Column(String, nullable=True)
    
    # FKs (Inteiros)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)

    # Relacionamento
    clinic = relationship("Clinic")