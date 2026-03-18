from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract, or_
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel # <-- Importante para a rota da NF-e

from app.db.base import get_db
from app.models.usuarios import User
from app.models.transacoes import Transaction 
from app.core.deps import get_current_user, RoleChecker 
from app.schemas.esquema_transacoes import TransactionCreate 
# Removemos os schemas restritos das rotas problemáticas para usar Body(dict)

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
    nf_status: Optional[str] = None,  # <-- O parâmetro que o React envia
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

    period_filter = base_filter + [
        func.date(Transaction.criado_em) >= start_date,
        func.date(Transaction.criado_em) <= end_date
    ]

    # --- O USO DO "OR_" ESTÁ AQUI (Isso faz a linha amarela sumir) ---
    if nf_status == 'emitida':
        period_filter.append(Transaction.status_nfe.in_(['emitida', 'emitido', 'concluída']))
    elif nf_status == 'pendente':
        period_filter.append(or_(
            Transaction.status_nfe == 'pendente', 
            Transaction.status_nfe.is_(None),
            Transaction.status_nfe == ''
        ))
    elif nf_status == 'dispensada':
        period_filter.append(Transaction.status_nfe.in_(['dispensada', 'não se aplica', 'nao_se_aplica']))

    # 1. Total Receita no Período
    period_revenue = db.query(func.sum(Transaction.valor)).filter(
        *period_filter,
        Transaction.tipo == "entrada"
    ).scalar() or 0.0

    # Total Despesa no Período
    period_expense = db.query(func.sum(Transaction.valor)).filter(
        *period_filter,
        Transaction.tipo == "saida"
    ).scalar() or 0.0

    # 2. Total Geral Acumulado (Entradas - Ignora o filtro de NF para mostrar o saldo real da clínica)
    total_accumulated = db.query(func.sum(Transaction.valor)).filter(
        *base_filter,
        Transaction.tipo == "entrada"
    ).scalar() or 0.0

    # 3. Lista de Transações Recentes
    recent_transactions = db.query(Transaction).filter(*period_filter).order_by(desc(Transaction.criado_em)).limit(50).all()

    # MÁGICA: Mapeia as transações forçando a devolução da forma de pagamento e parcelas para o React
    transactions_data = [
        {
            "id": t.id,
            "descricao": t.descricao,
            "valor": t.valor,
            "data_vencimento": t.data_vencimento,
            "criado_em": t.criado_em,
            "forma_pagamento": getattr(t, 'forma_pagamento', None),
            "parcelas": getattr(t, 'parcelas', 1),
            "status_nfe": getattr(t, 'status_nfe', 'pendente'),
            "link_nfe": getattr(t, 'link_nfe', None)
        } for t in recent_transactions
    ]

    # 4. Dados para o Gráfico (Somando Entradas por Dia e separando por cor)
    chart_data = []
    daily_sums = {}
    
    entradas_recentes = db.query(Transaction).filter(*period_filter, Transaction.tipo == "entrada").all()

    for t in entradas_recentes:
        if t.criado_em:
            day_str = t.criado_em.strftime("%d/%m")
            
            # Cria o "esqueleto" do dia se não existir
            if day_str not in daily_sums:
                daily_sums[day_str] = {"name": day_str, "emitida": 0.0, "pendente": 0.0, "dispensada": 0.0}
            
            # Identifica o status real
            status_raw = str(t.status_nfe).lower().strip() if t.status_nfe else 'pendente'
            
            # Soma o valor na "caixinha" correta daquele dia
            if status_raw in ['emitida', 'emitido', 'concluída']:
                daily_sums[day_str]["emitida"] += t.valor
            elif status_raw in ['dispensada', 'não se aplica', 'nao_se_aplica']:
                daily_sums[day_str]["dispensada"] += t.valor
            else:
                daily_sums[day_str]["pendente"] += t.valor
    
    # Transforma o dicionário em lista e ordena pela data
    chart_data = list(daily_sums.values())
    chart_data = sorted(chart_data, key=lambda x: x['name'])

    return {
        "period_revenue": period_revenue,
        "period_expense": period_expense,
        "total_accumulated": total_accumulated,
        "transactions": transactions_data,
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

@router.get("/all") # Removido o response_model restrito
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

    transacoes = query.order_by(Transaction.data_vencimento.desc()).all()

    # Mapeamento manual garantindo que os dados cheguem no front-end perfeitamente
    return [
        {
            "id": t.id,
            "descricao": getattr(t, 'descricao', getattr(t, 'description', '')),
            "categoria": getattr(t, 'categoria', getattr(t, 'category', '')),
            "data_vencimento": getattr(t, 'data_vencimento', getattr(t, 'due_date', None)),
            "valor": t.valor,
            "tipo": t.tipo,
            "forma_pagamento": getattr(t, 'forma_pagamento', None),
            "parcelas": getattr(t, 'parcelas', 1),
            "status": t.status,
            "status_nfe": getattr(t, 'status_nfe', 'pendente'),
            "link_nfe": getattr(t, 'link_nfe', None)
        } for t in transacoes
    ]


@router.post("/full", status_code=status.HTTP_201_CREATED)
def create_full_transaction(
    transacao: dict = Body(...), # Ignora o schema e lê o JSON puramente
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin)
):
    target_clinic_id = current_user.clinic_id
    if not target_clinic_id and current_user.role != 'superuser':
        raise HTTPException(status_code=400, detail="Clínica não identificada.")

    new_tx = Transaction(
        clinic_id=target_clinic_id if target_clinic_id else 1,
        patient_id=transacao.get('patient_id'),
        appointment_id=transacao.get('appointment_id'),
        descricao=transacao.get('descricao') or transacao.get('description') or "Sem descrição",
        valor=transacao.get('valor', 0.0),
        tipo=transacao.get('tipo', 'entrada'),
        categoria=transacao.get('categoria') or transacao.get('category') or "",
        data_vencimento=transacao.get('data_vencimento') or transacao.get('due_date') or date.today(),
        data_pagamento=transacao.get('data_pagamento'),
        status=transacao.get('status', 'pendente'),
        forma_pagamento=transacao.get('forma_pagamento'),
        parcelas=transacao.get('parcelas', 1),
        status_nfe=transacao.get('status_nfe', 'pendente'),
        link_nfe=transacao.get('link_nfe') 
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx


@router.put("/{tx_id}")
def update_transaction(
    tx_id: int, 
    tx_data: dict = Body(...), # Ignora o schema aqui também
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_only_admin)
):
    query = db.query(Transaction).filter(Transaction.id == tx_id)
    if current_user.role != 'superuser':
        query = query.filter(Transaction.clinic_id == current_user.clinic_id)

    db_tx = query.first()
    if not db_tx: raise HTTPException(status_code=404, detail="Transação não encontrada.")

    for key, value in tx_data.items():
        if hasattr(db_tx, key):
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