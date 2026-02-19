from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class PatientFile(Base):
    __tablename__ = "arquivos_pacientes"

    # ID Inteiro (Serial/Autoincrement)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Chave Estrangeira para Pacientes (Inteiro)
    patient_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documentos.id"), nullable=True)

    filename = Column(String, nullable=False)  # Ex: "exame.pdf"
    file_path = Column(String, nullable=False) # Ex: "uploads/exame.pdf"
    file_type = Column(String)                 # Ex: "application/pdf"
    
    # Padronizado para português para combinar com o resto do banco
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamento
    # O backref cria automaticamente um campo "files" dentro do Paciente, 
    # permitindo fazer patient.files para ver os arquivos dele.
    patient = relationship("Patient", back_populates="files")
    clinic = relationship("Clinic", back_populates="files")
    document = relationship("Document")