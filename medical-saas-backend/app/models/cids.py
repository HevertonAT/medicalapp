# app/models/cids.py
from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Cid(Base):
    __tablename__ = "cids"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(10), unique=True, index=True)
    descricao = Column(String(255), index=True)