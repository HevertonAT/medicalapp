from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

# Mantivemos o nome da classe em Inglês para compatibilidade com os relationships
class Appointment(Base):
    __tablename__ = "agendamentos" # Nome da tabela no banco em Português

    # ID como Integer (int4)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Data e Hora da Consulta
    data_horario = Column(DateTime, nullable=False)
    
    # Duração da Consulta
    duracao = Column(Integer, default=40) # Em minutos
    status = Column(String, default="agendado") # agendado, confirmado, cancelado, concluido

    # Observações
    observacoes = Column(String, nullable=True)

    # Chaves Estrangeiras (Todas como Integer agora)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("profissionais.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    # Strings apontam para os nomes das Classes definidos nos outros arquivos
    clinic = relationship("Clinic", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    
    # Relacionamentos 1-para-1 (uselist=False)
    medical_record = relationship("MedicalRecord", back_populates="appointment", uselist=False)
    transaction = relationship("Transaction", back_populates="appointment", uselist=False)

    # --- PROPRIEDADES ÚTEIS ---
    @property
    def doctor_nome(self):
        return self.doctor.nome if self.doctor else "Profissional Desconhecido"

    @property
    def patient_nome(self):
        return self.patient.nome_completo if self.patient else "Paciente Desconhecido"