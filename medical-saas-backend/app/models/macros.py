from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class Macro(Base):
    __tablename__ = "macros"

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # FK vinculando o macro diretamente ao perfil do profissional
    doctor_id = Column(Integer, ForeignKey("profissionais.id"), nullable=False)
    
    titulo = Column(String, nullable=False) # Ex: "Evolução Fono", "Anamnese Inicial"
    texto_padrao = Column(Text, nullable=False)

    # Relacionamento (Assumindo que a sua classe de profissional se chama Doctor)
    doctor = relationship("Doctor")