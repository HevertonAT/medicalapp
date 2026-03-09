from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Subscription(Base):
    __tablename__ = "assinaturas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Chaves Estrangeiras
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planos.id"), nullable=False)
    
    status = Column(String, default="ativo") # ativo, cancelado, inadimplente
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=True)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    clinic = relationship("Clinic") 
    plan = relationship("Plan", back_populates="subscriptions")