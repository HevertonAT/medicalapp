from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class SpecialtyRule(Base):
    __tablename__ = "regras_especialidades"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Ex: "Pediatria", "Cardiologia"
    specialty = Column(String, unique=True, index=True, nullable=False)
    
    # Guarda as configurações (toggles) como JSON. Ex: {"require_cpf": true}
    settings = Column(JSON, default={})
    
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())