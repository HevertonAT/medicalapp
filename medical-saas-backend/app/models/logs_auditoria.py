from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

# NOME DA CLASSE: AuditLog (Singular, Inglês)
class AuditLog(Base):
    __tablename__ = "logs_auditoria" # NOME DA TABELA: logs_auditoria (Plural, Português)

    # ID Inteiro (Serial)
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    acao = Column(String, nullable=False) # CREATE, UPDATE, DELETE, LOGIN
    tabela_afetada = Column(String, nullable=True)
    registro_id = Column(Integer, nullable=True) # ID do item alterado (agora Inteiro)
    detalhes = Column(Text, nullable=True) # JSON ou texto do que mudou
    
    # FKs como Inteiros
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    clinic_id = Column(Integer, ForeignKey("clinicas.id"), nullable=True)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos (Unidirecionais - O Log conhece o User, mas o User não precisa carregar todos os seus logs)
    user = relationship("User")
    clinic = relationship("Clinic")