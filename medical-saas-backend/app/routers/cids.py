from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class CidResponse(BaseModel):
    codigo: str
    descricao: str
    especialidade: Optional[str] = None

# --- NOSSO BANCO DE DADOS EM MEMÓRIA (MVP) ---
# Aqui estão os CIDs mais comuns já separados por especialidade.
CIDS_CURADOS = [
    # Fonoaudiologia
    {"codigo": "F80.0", "descricao": "Distúrbio específico da articulação da fala", "especialidade": "Fonoaudiologia"},
    {"codigo": "F80.1", "descricao": "Distúrbio da linguagem expressiva", "especialidade": "Fonoaudiologia"},
    {"codigo": "F80.2", "descricao": "Distúrbio da linguagem receptiva", "especialidade": "Fonoaudiologia"},
    {"codigo": "R47.0", "descricao": "Disfasia e afasia", "especialidade": "Fonoaudiologia"},
    {"codigo": "R47.1", "descricao": "Disartria e anartria", "especialidade": "Fonoaudiologia"},
    
    # Fisioterapia / Ortopedia
    {"codigo": "M54.4", "descricao": "Lumbago com ciática", "especialidade": "Fisioterapia"},
    {"codigo": "M54.5", "descricao": "Dor lombar baixa", "especialidade": "Fisioterapia"},
    {"codigo": "M25.5", "descricao": "Dor articular", "especialidade": "Fisioterapia"},
    {"codigo": "M79.1", "descricao": "Mialgia", "especialidade": "Fisioterapia"},
    
    # Psicologia / Psiquiatria
    {"codigo": "F32.0", "descricao": "Episódio depressivo leve", "especialidade": "Psicologia"},
    {"codigo": "F41.1", "descricao": "Ansiedade generalizada", "especialidade": "Psicologia"},
    {"codigo": "F43.2", "descricao": "Transtornos de adaptação", "especialidade": "Psicologia"},
    
    # Clínica Médica / Geral
    {"codigo": "I10",   "descricao": "Hipertensão essencial (primária)", "especialidade": "Clínica Médica"},
    {"codigo": "E11",   "descricao": "Diabetes mellitus não-insulino-dependente", "especialidade": "Clínica Médica"},
    {"codigo": "J00",   "descricao": "Nasofaringite aguda [resfriado comum]", "especialidade": "Clínica Médica"},
    {"codigo": "R51",   "descricao": "Cefaléia (Dor de cabeça)", "especialidade": "Clínica Médica"},
    {"codigo": "R05",   "descricao": "Tosse", "especialidade": "Clínica Médica"},
    {"codigo": "A09",   "descricao": "Diarréia e gastroenterite de origem infecciosa", "especialidade": "Clínica Médica"},
]

@router.get("/sugestoes", response_model=List[CidResponse])
def obter_sugestoes_por_especialidade(especialidade: Optional[str] = None):
    """Devolve até 5 CIDs comuns baseados na especialidade do profissional"""
    if especialidade:
        sugestoes = [c for c in CIDS_CURADOS if c.get("especialidade", "").lower() == especialidade.lower()]
        if sugestoes:
            return sugestoes[:5]
            
    # Se não tiver especialidade (ou não encontrar), devolve os de Clínica Geral
    return [c for c in CIDS_CURADOS if c.get("especialidade") == "Clínica Médica"][:5]

@router.get("/busca", response_model=List[CidResponse])
def buscar_cid(q: str = Query(..., min_length=2, description="Digite o código ou nome da doença")):
    """Busca um CID pelo código (ex: J00) ou pela descrição (ex: tosse)"""
    termo = q.lower().strip()
    
    resultados = [
        c for c in CIDS_CURADOS 
        if termo in c["codigo"].lower() or termo in c["descricao"].lower()
    ]
    
    return resultados[:10] # Limita a 10 resultados para não travar a tela