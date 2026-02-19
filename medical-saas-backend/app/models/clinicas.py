from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Clinic(Base):
    __tablename__ = "clinicas"  # <--- IMPORTANTE: Tem que bater com ForeignKey("clinicas.id")

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Padronizamos para 'nome' (antes podia estar razao_social)
    nome = Column(String, nullable=False) 
    cnpj = Column(String, unique=True, index=True, nullable=True)
    endereco = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # --- RELACIONAMENTOS ---
    # Estes back_populates devem existir nas outras classes
    users = relationship("User", back_populates="clinic")
    patients = relationship("Patient", back_populates="clinic")
    doctors = relationship("Doctor", back_populates="clinic")
    appointments = relationship("Appointment", back_populates="clinic")
    insurances = relationship("Insurance", back_populates="clinic")
    documents = relationship("Document", back_populates="clinic")
    files = relationship("PatientFile", back_populates="clinic")
    procedure_prices = relationship("ProcedurePrice", back_populates="clinic")
