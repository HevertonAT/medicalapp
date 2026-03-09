from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON 
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Doctor(Base):
    __tablename__ = "profissionais"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome = Column(String, nullable=False)
    especialidade = Column(String, nullable=True)
    crm = Column(String, unique=True, nullable=True)
    genero = Column(String, nullable=True)
    agenda_config = Column(JSON, nullable=True)
    
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="doctor_profile")
    clinic = relationship("Clinic", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    commissions = relationship("ProfessionalCommission", back_populates="doctor")