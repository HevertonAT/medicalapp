from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Appointment(Base):
    __tablename__ = "agendamentos" # Nome da tabela no banco em Português

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Data e Hora da Consulta
    data_horario = Column(DateTime, nullable=False, index=True)
    
    # Duração da Consulta
    duracao = Column(Integer, default=40) # Em minutos
    status = Column(Integer, default=1) # 1=Agendado, 2=Em Andamento, 3=Realizado, 4=Cancelado, 5=Reagendado

    # Observações
    observacoes = Column(String, nullable=True)

    # Chaves Estrangeiras 
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True, index=True)
    doctor_id = Column(Integer, ForeignKey("profissionais.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False, index=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    clinic = relationship("Clinic", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    
    # Relacionamentos 1-para-1 (uselist=False)
    medical_record = relationship("MedicalRecord", back_populates="appointment", uselist=False)
    transaction = relationship("Transaction", back_populates="appointment", uselist=False)

    @property
    def doctor_nome(self):
        return self.doctor.nome if self.doctor else "Profissional Desconhecido"

    @property
    def patient_nome(self):
        return self.patient.nome_completo if self.patient else "Paciente Desconhecido"