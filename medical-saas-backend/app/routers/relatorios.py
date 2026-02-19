from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from datetime import datetime

# Ajuste: Importar get_db de app.db.base
from app.db.base import get_db
from app.core.deps import get_current_user

# Ajuste: Importar Models Corretos (Inglês)
from app.models.usuarios import User
from app.models.transacoes import Transaction

router = APIRouter()

@router.get("/faturamento_pdf")
def generate_faturamento_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Buscar dados (Usando Transaction)
    transactions = db.query(Transaction).filter(
        Transaction.clinic_id == current_user.clinic_id
    ).order_by(Transaction.criado_em.desc()).all()

    # 2. Configurar PDF
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Tratamento seguro para email
    user_email = str(current_user.email) if current_user.email else "Usuario"

    # --- CABEÇALHO ---
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, f"Relatorio Financeiro") 
    
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 65, f"Gerado por: {user_email}")
    p.drawString(50, height - 80, f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    
    p.line(50, height - 90, width - 50, height - 90)

    # --- TABELA ---
    y = height - 120
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "DATA")
    p.drawString(150, y, "METODO") 
    p.drawString(300, y, "STATUS")
    p.drawString(450, y, "VALOR")
    
    y -= 10
    p.line(50, y, width - 50, y)
    y -= 20

    # --- DADOS ---
    p.setFont("Helvetica", 10)
    total = 0.0

    for trans in transactions:
        if y < 50: # Nova página se acabar o espaço
            p.showPage()
            y = height - 50
        
        # Correção dos Atributos (criado_em, forma_pagamento, valor)
        data_fmt = trans.criado_em.strftime("%d/%m/%Y") if trans.criado_em else "--"
        
        metodo = str(trans.forma_pagamento) if trans.forma_pagamento else "N/A"
        status = str(trans.status) if trans.status else "N/A" # Usando 'status' em vez de 'status_nfe' para o geral
        
        # Correção: usar 'valor' em vez de 'valor_total'
        valor_atual = trans.valor if trans.valor is not None else 0.0
        
        # Formatação Moeda Brasileira
        valor_fmt = f"R$ {valor_atual:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        
        p.drawString(50, y, data_fmt)
        p.drawString(150, y, metodo)
        p.drawString(300, y, status)
        p.drawString(450, y, valor_fmt)
        
        total += valor_atual
        y -= 20

    # --- TOTAL ---
    p.line(50, y + 10, width - 50, y + 10)
    y -= 20
    p.setFont("Helvetica-Bold", 12)
    p.drawString(300, y, "TOTAL ACUMULADO:")
    total_fmt = f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    p.drawString(450, y, total_fmt)

    p.showPage()
    p.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=relatorio_financeiro.pdf"}
    )