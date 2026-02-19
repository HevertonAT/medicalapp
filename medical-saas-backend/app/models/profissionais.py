from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

# NOME DA CLASSE: Doctor (Singular, Inglês) - Para compatibilidade com relationships
class Doctor(Base):
    __tablename__ = "profissionais" # NOME DA TABELA: profissionais (Plural, Português) - Para bater com as FKs

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome = Column(String, nullable=False)
    especialidade = Column(String, nullable=True)
    crm = Column(String, unique=True, nullable=True)
    
    # FKs (Inteiros)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    
    ativo = Column(Boolean, default=True)
    
    # Audit Timestamp
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="doctor_profile")
    clinic = relationship("Clinic", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    
    # Adicionado para suportar o arquivo comissoes_profissionais.py
    commissions = relationship("ProfessionalCommission", back_populates="doctor")