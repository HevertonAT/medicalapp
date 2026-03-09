from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
class Unit(Base):
    __tablename__ = "unidades"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome = Column(String, nullable=False) # Ex: Matriz, Filial Centro
    endereco = Column(String, nullable=True)

    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)

    # Relacionamento
    clinic = relationship("Clinic")