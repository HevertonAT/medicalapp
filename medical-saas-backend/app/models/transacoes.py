from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
class Transaction(Base):
    __tablename__ = "transacoes" 

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("pacientes.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("agendamentos.id"), nullable=True)
    
    descricao = Column(String, nullable=False)
    valor = Column(Float, nullable=False)
    tipo = Column(String, nullable=False) # entrada (receita) ou saida (despesa)
    categoria = Column(String, nullable=True) # consulta, aluguel, equipamentos
    data_vencimento = Column(Date, nullable=False)
    data_pagamento = Column(Date, nullable=True)
    status = Column(String, default="pendente") # pendente, pago, cancelado
    forma_pagamento = Column(String, nullable=True) # pix, cartao, dinheiro
    
    status_nfe = Column(String, default="pendente")
    link_nfe = Column(String, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    # O back_populates deve bater com o atributo "transaction" na classe Appointment
    appointment = relationship("Appointment", back_populates="transaction")
    
    # Relacionamentos simples (sem back_populates para evitar erro se não houver lista no outro lado)
    clinic = relationship("Clinic")
    patient = relationship("Patient")