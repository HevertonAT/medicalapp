from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Plan(Base):
    __tablename__ = "planos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome = Column(String, nullable=False) # Ex: Básico, Pro, Enterprise
    preco_mensal = Column(Float, nullable=False)
    max_usuarios = Column(Integer, nullable=True)
    max_pacientes = Column(Integer, nullable=True)
    
    ativo = Column(Boolean, default=True)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    subscriptions = relationship("Subscription", back_populates="plan")