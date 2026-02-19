from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

# NOME DA CLASSE: MedicalRecord (Singular, Inglês)
class MedicalRecord(Base):
    __tablename__ = "prontuarios" # NOME DA TABELA: prontuarios (Plural, Português)

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # FKs como Inteiros
    appointment_id = Column(Integer, ForeignKey("agendamentos.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("profissionais.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=False)
    
    # Campos Clínicos
    anamnese = Column(Text, nullable=True)
    prescricao = Column(Text, nullable=True)
    exame_fisico = Column(Text, nullable=True)
    diagnostico_cid = Column(String, nullable=True)
    
    # Campo genérico para dados específicos por especialidade (JSON)
    specialty_data = Column(JSON, nullable=True)
    
    # --- NOVOS CAMPOS PARA REGISTRO DE TEMPO (TIMER REAL) ---
    data_inicio = Column(DateTime(timezone=True), nullable=True) # Data/Hora que abriu a tela
    data_fim = Column(DateTime(timezone=True), nullable=True)    # Data/Hora que finalizou
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    # O back_populates deve bater com os nomes nas classes Appointment e Patient
    appointment = relationship("Appointment", back_populates="medical_record")
    patient = relationship("Patient", back_populates="medical_records")
    clinic = relationship("Clinic")
    
    # Relacionamento simples com Médico (sem back_populates para evitar erro no arquivo profissionais.py)
    doctor = relationship("Doctor")