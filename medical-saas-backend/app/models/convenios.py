from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Insurance(Base):
    __tablename__ = "convenios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome = Column(String, nullable=False)
    registro_ans = Column(String, nullable=True)
    
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    clinic = relationship("Clinic")
    procedure_prices = relationship("ProcedurePrice", back_populates="insurance")