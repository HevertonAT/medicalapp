from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
class AuditLog(Base):
    __tablename__ = "logs_auditoria"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    acao = Column(String, nullable=False) # CREATE, UPDATE, DELETE, LOGIN
    tabela_afetada = Column(String, nullable=True)
    registro_id = Column(Integer, nullable=True) # ID do item alterado (agora Inteiro)
    detalhes = Column(Text, nullable=True) # JSON ou texto do que mudou
    
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    clinic = relationship("Clinic")