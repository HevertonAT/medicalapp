from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel # <-- Importante para a rota da NF-e

from app.db.base import get_db
from app.models.usuarios import User
from app.models.transacoes import Transaction 
from app.core.deps import get_current_user, RoleChecker 
from app.schemas.esquema_transacoes import (
    TransactionCreate, 
    TransactionCompleteCreate, 
    TransactionCompleteUpdate, 
    TransactionResponse
)

router = APIRouter()

# --- DEFINIÇÃO DE SEGURANÇA ---
allow_only_admin = RoleChecker(["admin", "superuser"])

# Schema rápido para atualização da Nota Fiscal pela Tabela
class UpdateNotaFiscal(BaseModel):
    status_nota: str
    numero_nota: Optional[str] = None

@router.get("/stats")
def get_financial_stats(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin) 
):
    today = date.today()
    if not start_date:
        start_date = today.replace(day=1)
    else:
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        
    if not end_date:
        end_date = today
    else:
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    base_filter = [Transaction.clinic_id == current_user.clinic_id] if current_user.role != 'superuser' else []

    # 1. Total Receita no Período
    period_revenue = db.query(func.sum(Transaction.valor)).filter(
        *base_filter,
        Transaction.tipo == "entrada",
        func.date(Transaction.criado_em) >= start_date,
        func.date(Transaction.criado_em) <= end_date
    ).scalar() or 0.0

    # Total Despesa no Período
    period_expense = db.query(func.sum(Transaction.valor)).filter(
        *base_filter,
        Transaction.tipo == "saida",
        func.date(Transaction.criado_em) >= start_date,
        func.date(Transaction.criado_em) <= end_date
    ).scalar() or 0.0

    # 2. Total Geral Acumulado (Entradas)
    total_accumulated = db.query(func.sum(Transaction.valor)).filter(
        *base_filter,
        Transaction.tipo == "entrada"
    ).scalar() or 0.0

    # 3. Lista de Transações Recentes
    recent_transactions = db.query(Transaction).filter(*base_filter).order_by(desc(Transaction.criado_em)).limit(50).all()

    # MÁGICA: Mapeia as transações forçando a devolução da forma de pagamento e parcelas para o React
    transactions_data = [
        {
            "id": t.id,
            "descricao": t.descricao,
            "valor": t.valor,
            "data_vencimento": t.data_vencimento,
            "criado_em": t.criado_em,
            "forma_pagamento": getattr(t, 'forma_pagamento', None),
            "parcelas": getattr(t, 'parcelas', 1)
        } for t in recent_transactions
    ]

    # 4. Dados para o Gráfico (Somando Entradas por Dia)
    chart_data = []
    daily_sums = {}
    
    entradas_recentes = db.query(Transaction).filter(
        *base_filter,
        Transaction.tipo == "entrada",
        func.date(Transaction.criado_em) >= start_date,
        func.date(Transaction.criado_em) <= end_date
    ).all()

    for t in entradas_recentes:
        if t.criado_em:
             day_str = t.criado_em.strftime("%d/%m")
             daily_sums[day_str] = daily_sums.get(day_str, 0) + t.valor
    
    for day, val in daily_sums.items():
        chart_data.append({"name": day, "valor": val})
    
    chart_data = sorted(chart_data, key=lambda x: x['name'])

    return {
        "period_revenue": period_revenue,
        "period_expense": period_expense,
        "total_accumulated": total_accumulated,
        "transactions": transactions_data, # <-- Envia os dados completos
        "chart_data": chart_data
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_quick_transaction(
    transacao: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin) 
):
    target_clinic_id = current_user.clinic_id
    if not target_clinic_id and current_user.role != 'superuser':
        raise HTTPException(status_code=400, detail="Clínica não identificada.")

    new_trans = Transaction(
        clinic_id=target_clinic_id if target_clinic_id else 1,
        valor=transacao.valor_total,              
        forma_pagamento=transacao.metodo_pagamento, 
        descricao=transacao.descricao,            
        status_nfe=transacao.status_nfe,
        tipo=transacao.tipo, 
        data_vencimento=date.today(), 
        data_pagamento=date.today(),  
        status="pago"                 
    )
    
    db.add(new_trans)
    db.commit()
    db.refresh(new_trans)
    
    return {"message": "Lançamento realizado com sucesso!", "id": new_trans.id}


# =========================================================================
# 2. ROTAS COMPLETAS E ATUALIZAÇÕES RÁPIDAS
# =========================================================================

@router.get("/all")
def get_all_transactions(
    mes: Optional[int] = None,
    ano: Optional[int] = None,
    tipo: Optional[str] = None,
    status_pagamento: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin)
):
    query = db.query(Transaction)

    if current_user.role != 'superuser':
        query = query.filter(Transaction.clinic_id == current_user.clinic_id)

    if tipo: query = query.filter(Transaction.tipo == tipo)
    if status_pagamento: query = query.filter(Transaction.status == status_pagamento)
    
    if mes and ano:
        query = query.filter(extract('month', Transaction.data_vencimento) == mes)
        query = query.filter(extract('year', Transaction.data_vencimento) == ano)

    return query.order_by(Transaction.data_vencimento.desc()).all()


@router.post("/full", status_code=status.HTTP_201_CREATED)
def create_full_transaction(
    transacao: TransactionCompleteCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin)
):
    target_clinic_id = current_user.clinic_id
    if not target_clinic_id and current_user.role != 'superuser':
        raise HTTPException(status_code=400, detail="Clínica não identificada.")

    new_tx = Transaction(
        clinic_id=target_clinic_id if target_clinic_id else 1,
        patient_id=getattr(transacao, 'patient_id', None),
        appointment_id=getattr(transacao, 'appointment_id', None),
        descricao=transacao.descricao,
        valor=transacao.valor,
        tipo=transacao.tipo,
        categoria=getattr(transacao, 'categoria', None),
        data_vencimento=transacao.data_vencimento,
        data_pagamento=getattr(transacao, 'data_pagamento', None),
        status=transacao.status,
        forma_pagamento=getattr(transacao, 'forma_pagamento', None),
        parcelas=getattr(transacao, 'parcelas', 1), # Garante as parcelas
        status_nfe=getattr(transacao, 'status_nfe', 'pendente'),
        link_nfe=getattr(transacao, 'link_nfe', None) # Garante o link da nota
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx


@router.put("/{tx_id}")
def update_transaction(
    tx_id: int, 
    tx_data: TransactionCompleteUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin)
):
    query = db.query(Transaction).filter(Transaction.id == tx_id)
    if current_user.role != 'superuser':
        query = query.filter(Transaction.clinic_id == current_user.clinic_id)

    db_tx = query.first()
    if not db_tx: raise HTTPException(status_code=404, detail="Transação não encontrada.")

    update_data = tx_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tx, key, value)

    if db_tx.status == 'pago' and not db_tx.data_pagamento:
        db_tx.data_pagamento = date.today()

    db.commit()
    db.refresh(db_tx)
    return db_tx


# --- ROTA NOVA: Atualização Rápida de NF-e ---
@router.patch("/{tx_id}/nota")
def update_nota_status(
    tx_id: int,
    nota_data: UpdateNotaFiscal,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin)
):
    query = db.query(Transaction).filter(Transaction.id == tx_id)
    
    if current_user.role != 'superuser':
        query = query.filter(Transaction.clinic_id == current_user.clinic_id)
        
    transaction = query.first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado.")

    # Atualiza o status e o link/numero da nota
    transaction.status_nfe = nota_data.status_nota
    transaction.link_nfe = nota_data.numero_nota

    db.commit()
    return {"message": "Nota atualizada com sucesso"}


@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin)
):
    query = db.query(Transaction).filter(Transaction.id == tx_id)
    if current_user.role != 'superuser':
        query = query.filter(Transaction.clinic_id == current_user.clinic_id)

    db_tx = query.first()
    if not db_tx: raise HTTPException(status_code=404, detail="Transação não encontrada.")

    db.delete(db_tx)
    db.commit()
    return {"message": "Transação excluída com sucesso"}