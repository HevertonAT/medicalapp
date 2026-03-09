from sqlalchemy import Column, Integer, ForeignKey
from app.db.base import Base

class UserRole(Base):
    __tablename__ = "cargos_usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Chaves Estrangeiras 
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("cargos.id"), nullable=False, index=True)