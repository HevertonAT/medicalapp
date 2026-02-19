from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Communication(Base):
    __tablename__ = "comunicacoes" # Nome da tabela no banco

    # ID Inteiro
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    tipo = Column(String, nullable=False) # email, sms, whatsapp
    destinatario = Column(String, nullable=False)
    mensagem = Column(Text, nullable=False)
    status = Column(String, default="enviado") # enviado, falha, pendente
    
    # FKs atualizadas (Integers)
    patient_id = Column(Integer, ForeignKey("pacientes.id"), nullable=True)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    
    enviado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    # Permite acessar quem recebeu a mensagem: communication.patient
    patient = relationship("Patient")
    clinic = relationship("Clinic")