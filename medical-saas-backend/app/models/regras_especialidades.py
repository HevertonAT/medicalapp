from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class SpecialtyRule(Base):
    __tablename__ = "regras_especialidades"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    specialty = Column(String, index=True, nullable=False) # Retirado o unique=True
    
    # NOVO: Isolamento por clínica
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    
    settings = Column(JSON, default={})
    active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())