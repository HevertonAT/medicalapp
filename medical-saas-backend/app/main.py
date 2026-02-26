import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import engine
from app.db.base import Base
# --- IMPORTAÇÃO DOS MODELOS ---
from app.models.arquivos_pacientes import PatientFile
from app.models.documentos import Document
from app.models.prontuarios import MedicalRecord
from app.models.usuarios import User
from app.models.clinicas import Clinic 
from app.models.pacientes import Patient
from app.models.agendamentos import Appointment 
from app.models.transacoes import Transaction
from app.models.profissionais import Doctor
from app.models.convenios import Insurance
from app.models.assinaturas import Subscription
from app.models.comissoes_profissionais import ProfessionalCommission
from app.models.planos import Plan
from app.models.precos_procedimentos import ProcedurePrice
from app.models.unidades import Unit
from app.models.cargos import Role
from app.models.logs_auditoria import AuditLog
from app.models.regras_especialidades import SpecialtyRule

# --- IMPORTAÇÃO DAS ROTAS ---
from app.routers import (
    agendamentos,
    autenticacao, 
    clinicas,
    cids,
    macros,
    regras_especialidades, 
    usuarios, 
    profissionais, 
    pacientes, 
    prontuarios, 
    financeiro, 
    arquivos, 
    relatorios, 
    dashboard
)

app = FastAPI(
    title="Clinify API", 
    description="API para gerenciamento de clínicas, pacientes, agendamentos e mais.", 
    version="1.0.0"
)

#Base.metadata.create_all(bind=engine)

# --- CORREÇÃO DA CONFIGURAÇÃO DO CORS ---
# As vírgulas que faltavam foram adicionadas e a URL exata do seu Front-end Vercel foi incluída
origins = [
    "http://127.0.0.1:8000",
    "http://localhost:3000", 
    "http://localhost:5173", 
    "https://medicalappfront.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PROTEÇÃO PARA AMBIENTE NUVEM (VERCEL) ---
# Garante que a pasta uploads exista para a API não "quebrar" (erro 500/404) ao iniciar
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# MONTAGEM DE ARQUIVOS ESTÁTICOS
app.mount("/arquivos", StaticFiles(directory="uploads"), name="uploads")

# --- REGISTRO DAS ROTAS ---
app.include_router(autenticacao.router, prefix="/auth", tags=["Autenticação"])
app.include_router(clinicas.router, prefix="/clinics", tags=["Clínicas"])
app.include_router(profissionais.router, prefix="/doctors", tags=["Profissionais"]) 
app.include_router(usuarios.router, prefix="/users", tags=["Usuários"])
app.include_router(pacientes.router, prefix="/patients", tags=["Pacientes"])
app.include_router(agendamentos.router, prefix="/appointments", tags=["Agendamentos"])
app.include_router(prontuarios.router, prefix="/medical-records", tags=["Prontuário"])
app.include_router(financeiro.router, prefix="/financial", tags=["Financeiro"]) 
app.include_router(arquivos.router, prefix="/files", tags=["Arquivos"]) 
app.include_router(relatorios.router, prefix="/reports", tags=["Relatórios"])  
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(regras_especialidades.router, prefix="/specialties", tags=["Configuração Especialidades"])
app.include_router(macros.router, prefix="/macros", tags=["Macros"])
app.include_router(cids.router, prefix="/cids", tags=["CIDs"])

@app.get("/")
def health_check():
    return {"status": "API online 🚀"}