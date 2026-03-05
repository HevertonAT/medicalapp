from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Patient(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome_completo = Column(String, nullable=False)
    cpf = Column(String, index=True, nullable=True) 
    telefone = Column(String, nullable=True)
    data_nascimento = Column(Date, nullable=True)
    genero = Column(String, nullable=True)
    
    # --- ENDEREÇO ESTRUTURADO ---
    cep = Column(String, nullable=True)
    logradouro = Column(String, nullable=True) # Rua, Avenida, etc.
    numero = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    estado = Column(String, nullable=True) # Sigla UF (SP, RJ, MG...)
    
    # FKs
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    insurance_id = Column(Integer, ForeignKey("convenios.id"), nullable=True)
    
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    user = relationship("User", back_populates="patient_profile")
    clinic = relationship("Clinic", back_populates="patients")
    insurance = relationship("Insurance")

    appointments = relationship("Appointment", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")
    files = relationship("PatientFile", back_populates="patient")
    documents = relationship("Document", back_populates="patient")