from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

# Ajuste: Importar get_db de app.db.base
from app.db.base import get_db

# Ajuste: Importar Models Corretos (Inglês)
from app.models.usuarios import User
from app.models.transacoes import Transaction # Model correto (antes era transaction)

# Ajuste: Importar RoleChecker
from app.core.deps import get_current_user, RoleChecker 

router = APIRouter()

# --- SCHEMA PARA LANÇAR NOTA ---
# Mantendo os nomes que o front-end envia, mas mapeando para o banco depois
class TransactionCreate(BaseModel):
    valor_total: float
    metodo_pagamento: str 
    status_nfe: str = "emitida"
    descricao: str = "Receita Avulsa" # Adicionei descrição pois é obrigatória no Model

# --- DEFINIÇÃO DE SEGURANÇA ---
# Apenas 'admin' e 'superuser' acessam.
allow_only_admin = RoleChecker(["admin", "superuser"])

# --- ROTAS ---

# 1. OBTER ESTATÍSTICAS
@router.get("/stats")
def get_financial_stats(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin) 
):
    # Se não vier data, define o padrão (Mês atual)
    today = date.today()
    if not start_date:
        start_date = today.replace(day=1)
    else:
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        
    if not end_date:
        end_date = today
    else:
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    # Filtro base
    # CORREÇÃO: Usar 'criado_em' em vez de 'created_at'
    base_query = db.query(Transaction).filter(
        Transaction.clinic_id == current_user.clinic_id,
        func.date(Transaction.criado_em) >= start_date,
        func.date(Transaction.criado_em) <= end_date
    )

    # 1. Total no Período Selecionado
    # CORREÇÃO: Usar 'valor' em vez de 'valor_total'
    period_revenue = db.query(func.sum(Transaction.valor)).filter(
        Transaction.clinic_id == current_user.clinic_id,
        func.date(Transaction.criado_em) >= start_date,
        func.date(Transaction.criado_em) <= end_date
    ).scalar() or 0.0

    # 2. Total Geral (Desde sempre)
    total_accumulated = db.query(func.sum(Transaction.valor)).filter(
        Transaction.clinic_id == current_user.clinic_id
    ).scalar() or 0.0

    # 3. Lista de Transações Recentes
    recent_transactions = base_query.order_by(desc(Transaction.criado_em)).limit(50).all()

    # 4. Dados para o Gráfico
    chart_data = []
    daily_sums = {}
    
    for t in recent_transactions:
        # Verifica e formata a data
        if t.criado_em:
             day_str = t.criado_em.strftime("%d/%m")
             # Soma usando o campo correto 'valor'
             daily_sums[day_str] = daily_sums.get(day_str, 0) + t.valor
    
    # Transforma o dict em lista para o gráfico
    for day, val in daily_sums.items():
        chart_data.append({"name": day, "valor": val})
    
    # Ordena pelo dia
    chart_data = sorted(chart_data, key=lambda x: x['name'])

    return {
        "period_revenue": period_revenue,
        "total_accumulated": total_accumulated,
        "transactions": recent_transactions,
        "chart_data": chart_data
    }

# 2. LANÇAR NOVA NOTA
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_transaction(
    transacao: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin) 
):
    # Cria o objeto Transaction mapeando os campos do Schema para o Model
    new_trans = Transaction(
        clinic_id=current_user.clinic_id,
        valor=transacao.valor_total,              # Mapeado: valor_total -> valor
        forma_pagamento=transacao.metodo_pagamento, # Mapeado: metodo -> forma
        descricao=transacao.descricao,            # Obrigatório no Model
        status_nfe=transacao.status_nfe,
        tipo="entrada", 
        data_vencimento=date.today(), # Obrigatório no Model (assume hoje se pago)
        data_pagamento=date.today(),  # Assume pago na hora
        status="pago"                 # Assume pago
        # criado_em é preenchido automaticamente pelo banco
    )
    
    db.add(new_trans)
    db.commit()
    db.refresh(new_trans)
    
    return {"message": "Lançamento realizado com sucesso!", "id": new_trans.id}