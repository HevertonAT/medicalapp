from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Plan(Base):
    __tablename__ = "planos" # Nome da tabela no banco (Plural, Português)

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome = Column(String, nullable=False) # Ex: Básico, Pro, Enterprise
    preco_mensal = Column(Float, nullable=False)
    max_usuarios = Column(Integer, nullable=True)
    max_pacientes = Column(Integer, nullable=True)
    
    ativo = Column(Boolean, default=True)
    
    # Audit Timestamp (Padrão do sistema)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    # O back_populates deve bater com o atributo "plan" na classe Subscription
    subscriptions = relationship("Subscription", back_populates="plan")