from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class Macro(Base):
    __tablename__ = "macros"

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # FK corrigida para a tabela em português e tipo Inteiro
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)
    
    titulo = Column(String, nullable=False) # Ex: "Evolução Padrão", "Anamnese Inicial"
    texto_padrao = Column(Text, nullable=False)

    # Relacionamento (opcional, mas útil)
    clinic = relationship("Clinic")