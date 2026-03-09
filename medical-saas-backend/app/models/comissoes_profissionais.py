from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class ProfessionalCommission(Base):
    __tablename__ = "comissoes_profissionais" # Nome da tabela em Português

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    doctor_id = Column(Integer, ForeignKey("profissionais.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("agendamentos.id"), nullable=True)
    transaction_id = Column(Integer, ForeignKey("transacoes.id"), nullable=True)
    
    valor_comissao = Column(Float, nullable=False)
    percentual_aplicado = Column(Float, nullable=True)
    status = Column(String, default="pendente") # pendente, pago
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    doctor = relationship("Doctor", back_populates="commissions")    
    appointment = relationship("Appointment")
    transaction = relationship("Transaction")