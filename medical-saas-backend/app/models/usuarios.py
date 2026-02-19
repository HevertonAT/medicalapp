from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

# NOME DA CLASSE: User (Singular, Inglês) - Fundamental para o auth e relacionamentos
class User(Base):
    __tablename__ = "usuarios" # NOME DA TABELA: usuarios (Plural, Português)

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="patient")
    
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # FK (Inteiro)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    clinic = relationship("Clinic", back_populates="users")
    
    # Relacionamentos 1-para-1 com perfis específicos
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    patient_profile = relationship("Patient", back_populates="user", uselist=False)