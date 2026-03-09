from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class CidResponse(BaseModel):
    codigo: str
    descricao: str
    especialidade: Optional[str] = None

# --- NOSSO BANCO DE DADOS EM MEMÓRIA (MVP) ---
CIDS_CURADOS = [
    # --- FONOAUDIOLOGIA ---
    {"codigo": "F80.0", "descricao": "Distúrbio específico da articulação da fala", "especialidade": "Fonoaudiologia"},
    {"codigo": "F80.1", "descricao": "Distúrbio da linguagem expressiva", "especialidade": "Fonoaudiologia"},
    {"codigo": "F80.2", "descricao": "Distúrbio da linguagem receptiva", "especialidade": "Fonoaudiologia"},
    {"codigo": "F80.9", "descricao": "Atraso no desenvolvimento da fala e da linguagem", "especialidade": "Fonoaudiologia"},
    {"codigo": "R47.0", "descricao": "Disfasia e afasia", "especialidade": "Fonoaudiologia"},
    {"codigo": "R47.1", "descricao": "Disartria e anartria", "especialidade": "Fonoaudiologia"},
    {"codigo": "R49.0", "descricao": "Disfonia (Rouquidão)", "especialidade": "Fonoaudiologia"},
    {"codigo": "F98.5", "descricao": "Gagueira (Espasmofemia)", "especialidade": "Fonoaudiologia"},
    {"codigo": "H90.3", "descricao": "Perda auditiva bilateral neurossensorial", "especialidade": "Fonoaudiologia"},

    # --- FISIOTERAPIA / ORTOPEDIA ---
    {"codigo": "M54.2", "descricao": "Cervicalgia (Dor no pescoço)", "especialidade": "Fisioterapia"},
    {"codigo": "M54.4", "descricao": "Lumbago com ciática", "especialidade": "Fisioterapia"},
    {"codigo": "M54.5", "descricao": "Dor lombar baixa (Lombalgia)", "especialidade": "Fisioterapia"},
    {"codigo": "M25.5", "descricao": "Dor articular", "especialidade": "Fisioterapia"},
    {"codigo": "M79.1", "descricao": "Mialgia (Dor muscular)", "especialidade": "Fisioterapia"},
    {"codigo": "M75.0", "descricao": "Capsulite adesiva do ombro", "especialidade": "Fisioterapia"},
    {"codigo": "M75.1", "descricao": "Síndrome do manguito rotador", "especialidade": "Fisioterapia"},
    {"codigo": "M77.1", "descricao": "Epicondilite lateral (Cotovelo de tenista)", "especialidade": "Fisioterapia"},
    {"codigo": "G56.0", "descricao": "Síndrome do túnel do carpo", "especialidade": "Fisioterapia"},
    {"codigo": "M21.4", "descricao": "Pé chato (Pé plano)", "especialidade": "Fisioterapia"},
    {"codigo": "M17", "descricao": "Gonartrose (Artrose do joelho)", "especialidade": "Fisioterapia"},
    {"codigo": "M40", "descricao": "Cifose e lordose", "especialidade": "Fisioterapia"},
    {"codigo": "M41", "descricao": "Escoliose", "especialidade": "Fisioterapia"},

    # --- PSICOLOGIA / PSIQUIATRIA ---
    {"codigo": "F32.0", "descricao": "Episódio depressivo leve", "especialidade": "Psicologia"},
    {"codigo": "F32.1", "descricao": "Episódio depressivo moderado", "especialidade": "Psicologia"},
    {"codigo": "F32.2", "descricao": "Episódio depressivo grave sem sintomas psicóticos", "especialidade": "Psicologia"},
    {"codigo": "F41.0", "descricao": "Transtorno de pânico", "especialidade": "Psicologia"},
    {"codigo": "F41.1", "descricao": "Ansiedade generalizada (TAG)", "especialidade": "Psicologia"},
    {"codigo": "F41.2", "descricao": "Transtorno misto ansioso e depressivo", "especialidade": "Psicologia"},
    {"codigo": "F43.2", "descricao": "Transtornos de adaptação", "especialidade": "Psicologia"},
    {"codigo": "F90.0", "descricao": "Distúrbios da atividade e da atenção (TDAH)", "especialidade": "Psicologia"},
    {"codigo": "F84.0", "descricao": "Autismo infantil", "especialidade": "Psicologia"},
    {"codigo": "F10.2", "descricao": "Dependência de álcool", "especialidade": "Psicologia"},

    # --- CLÍNICA MÉDICA / GERAL (OS MAIS BUSCADOS) ---
    {"codigo": "I10", "descricao": "Hipertensão essencial (primária)", "especialidade": "Clínica Médica"},
    {"codigo": "E11", "descricao": "Diabetes mellitus tipo 2", "especialidade": "Clínica Médica"},
    {"codigo": "E66", "descricao": "Obesidade", "especialidade": "Clínica Médica"},
    {"codigo": "J00", "descricao": "Resfriado comum (Nasofaringite)", "especialidade": "Clínica Médica"},
    {"codigo": "J01", "descricao": "Sinusite aguda", "especialidade": "Clínica Médica"},
    {"codigo": "J03", "descricao": "Amigdalite aguda", "especialidade": "Clínica Médica"},
    {"codigo": "J06", "descricao": "Infecção aguda das vias aéreas superiores", "especialidade": "Clínica Médica"},
    {"codigo": "J30", "descricao": "Rinite alérgica", "especialidade": "Clínica Médica"},
    {"codigo": "K21", "descricao": "Refluxo gastroesofágico", "especialidade": "Clínica Médica"},
    {"codigo": "N39.0", "descricao": "Infecção urinária", "especialidade": "Clínica Médica"},
    {"codigo": "R05", "descricao": "Tosse", "especialidade": "Clínica Médica"},
    {"codigo": "R51", "descricao": "Cefaléia (Dor de cabeça)", "especialidade": "Clínica Médica"},
    {"codigo": "R50", "descricao": "Febre", "especialidade": "Clínica Médica"},
    {"codigo": "A09", "descricao": "Diarréia e gastroenterite", "especialidade": "Clínica Médica"},
    {"codigo": "B35", "descricao": "Micoses (Dermatofitose)", "especialidade": "Clínica Médica"},
    {"codigo": "L70", "descricao": "Acne", "especialidade": "Clínica Médica"},
    {"codigo": "Z00.0", "descricao": "Exame médico geral (Check-up)", "especialidade": "Clínica Médica"},
    {"codigo": "D64.9", "descricao": "Anemia não especificada", "especialidade": "Clínica Médica"},
    {"codigo": "E03.9", "descricao": "Hipotireoidismo", "especialidade": "Clínica Médica"},
    {"codigo": "I83", "descricao": "Varizes das extremidades inferiores", "especialidade": "Clínica Médica"},
    {"codigo": "K29", "descricao": "Gastrite e duodenite", "especialidade": "Clínica Médica"},
    {"codigo": "M10", "descricao": "Gota", "especialidade": "Clínica Médica"},
    {"codigo": "N20", "descricao": "Cálculo renal (Pedra nos rins)", "especialidade": "Clínica Médica"}
]

@router.get("/sugestoes", response_model=List[CidResponse])
def obter_sugestoes_por_especialidade(especialidade: Optional[str] = None):
    """Devolve até 5 CIDs comuns baseados na especialidade do profissional"""
    if especialidade:
        sugestoes = [c for c in CIDS_CURADOS if c.get("especialidade", "").lower() == especialidade.lower()]
        if sugestoes:
            return sugestoes[:5]
            
    return [c for c in CIDS_CURADOS if c.get("especialidade") == "Clínica Médica"][:5]

@router.get("/busca", response_model=List[CidResponse])
def buscar_cid(q: str = Query(..., min_length=2, description="Digite o código ou nome da doença")):
    """Busca um CID pelo código (ex: J00) ou pela descrição (ex: tosse)"""
    termo = q.lower().strip()
    
    resultados = [
        c for c in CIDS_CURADOS 
        if termo in c["codigo"].lower() or termo in c["descricao"].lower()
    ]
    
    return resultados[:20] 