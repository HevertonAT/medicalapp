from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class PatientFile(Base):
    __tablename__ = "arquivos_pacientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    patient_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documentos.id"), nullable=True)

    filename = Column(String, nullable=False)  # Ex: "exame.pdf"
    file_path = Column(String, nullable=False) # Ex: "uploads/exame.pdf"
    file_type = Column(String) # Ex: "application/pdf"
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamento
    patient = relationship("Patient", back_populates="files")
    clinic = relationship("Clinic", back_populates="files")
    document = relationship("Document")