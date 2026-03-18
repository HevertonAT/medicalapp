import csv
import codecs
from fastapi import APIRouter, Query, Depends, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.base import get_db
from app.models.cids import Cid
from app.models.usuarios import User
from app.core.deps import get_current_user

router = APIRouter()

class CidResponse(BaseModel):
    codigo: str
    descricao: str

    class Config:
        from_attributes = True

# --- 1. BUSCA INTELIGENTE NO BANCO ---
@router.get("/busca", response_model=List[CidResponse])
def buscar_cid(q: str = Query(..., min_length=2, description="Código ou nome"), db: Session = Depends(get_db)):
    termo = f"%{q.lower().strip()}%"
    
    # Busca tanto pelo código quanto pela descrição, ignorando maiúsculas/minúsculas (ilike)
    resultados = db.query(Cid).filter(
        or_(
            Cid.codigo.ilike(termo),
            Cid.descricao.ilike(termo)
        )
    ).limit(30).all() # Limita a 30 para a tela não travar
    
    return resultados

# --- 2. SUGESTÕES INICIAIS ---
@router.get("/sugestoes", response_model=List[CidResponse])
def obter_sugestoes_gerais(db: Session = Depends(get_db)):
    """Devolve os CIDs mais comuns da prática médica como sugestão ao abrir a caixa"""
    sugestoes_comuns = ["Z00.0", "I10", "E11", "R51", "J00"]
    resultados = db.query(Cid).filter(Cid.codigo.in_(sugestoes_comuns)).all()
    return resultados

# --- 3. ROTA DE IMPORTAÇÃO EM MASSA (14 MIL CIDs) ---
@router.post("/importar-csv", description="Importe um arquivo CSV no formato: codigo;descricao")
def importar_cids_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Trava de segurança: Só você (superuser) pode subir essa lista
    if current_user.role != 'superuser':
        raise HTTPException(status_code=403, detail="Apenas o administrador do sistema pode importar CIDs.")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="O arquivo precisa ser um .csv")

    try:
        # Lê o CSV decodificando caracteres (acentos em português)
        csvReader = csv.reader(codecs.iterdecode(file.file, 'utf-8'), delimiter=';')
        
        # Pula a primeira linha (cabeçalho)
        next(csvReader, None) 
        
        cids_to_insert = []
        for row in csvReader:
            if len(row) >= 2:
                codigo = row[0].strip()
                descricao = row[1].strip()
                
                # Prepara o objeto para inserir
                cids_to_insert.append(Cid(codigo=codigo, descricao=descricao))
        
        # Insere todos os milhares de registros em um único comando super rápido!
        db.bulk_save_objects(cids_to_insert)
        db.commit()
        
        return {"message": f"{len(cids_to_insert)} CIDs foram importados com sucesso para o banco de dados!"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}")