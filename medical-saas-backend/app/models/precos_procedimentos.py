from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class ProcedurePrice(Base):
    __tablename__ = "precos_procedimentos" # Nome da tabela no banco (Plural, Português)

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome_procedimento = Column(String, nullable=False) # Ex: Consulta Eletiva
    codigo_tuss = Column(String, nullable=True)
    valor = Column(Float, nullable=False)
    
    # Chaves Estrangeiras (Inteiros)
    insurance_id = Column(Integer, ForeignKey("convenios.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)

    # Audit Timestamp
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    insurance = relationship("Insurance", back_populates="procedure_prices")
    clinic = relationship("Clinic", back_populates="procedure_prices")
    insurance = relationship("Insurance", back_populates="procedure_prices")