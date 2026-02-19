from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

# NOME DA CLASSE: Document (Singular, Inglês)
class Document(Base):
    __tablename__ = "documentos" # NOME DA TABELA: documentos (Plural, Português)

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    nome_arquivo = Column(String, nullable=False)
    tipo = Column(String, nullable=True) # exame, laudo, identidade
    url = Column(String, nullable=False) # Caminho no S3 ou local
    
    # FKs como Inteiros
    patient_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    # Certifique-se de adicionar 'documents = relationship(...)' nos models Patient e Clinic
    patient = relationship("Patient", back_populates="documents")
    clinic = relationship("Clinic", back_populates="documents")
    