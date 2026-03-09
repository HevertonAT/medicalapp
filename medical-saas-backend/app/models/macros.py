from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class Macro(Base):
    __tablename__ = "macros_profissionais"

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    doctor_id = Column(Integer, ForeignKey("profissionais.id"), nullable=False)
    
    titulo = Column(String, nullable=False) # Ex: "Evolução Fono", "Anamnese Inicial"
    texto_padrao = Column(Text, nullable=False)

    # Relacionamento 
    doctor = relationship("Doctor")