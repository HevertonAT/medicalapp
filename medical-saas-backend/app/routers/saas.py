from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.db.base import get_db
from app.models.usuarios import User
from app.models.clinicas import Clinic 
from app.core.deps import RoleChecker

router = APIRouter()

# Trava de Segurança Máxima: Só você (superuser) entra aqui.
allow_only_superuser = RoleChecker(["superuser"])

# Validação dos dados que vêm do Front-end
class SaasUpdate(BaseModel):
    plano: str
    valor_mensalidade: float
    dia_vencimento: int
    status_assinatura: str

@router.get("/dashboard")
def get_saas_dashboard(
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_only_superuser)
):
    # 1. Total de Clínicas Cadastradas
    total_clinics = db.query(Clinic).count()

    # 2. Clínicas com pagamento em dia
    active_clinics = db.query(Clinic).filter(Clinic.status_assinatura == "ativa").count()

    # 3. Clínicas com pagamento atrasado
    defaulting_clinics = db.query(Clinic).filter(Clinic.status_assinatura == "inadimplente").count()

    # 4. MRR (Receita Recorrente Mensal) - Soma das mensalidades ativas
    mrr = db.query(func.sum(Clinic.valor_mensalidade)).filter(Clinic.status_assinatura == "ativa").scalar() or 0.0

    # 5. Lista detalhada de Clínicas
    clinics_list = db.query(Clinic).order_by(Clinic.nome).all()

    return {
        "metrics": {
            "total_clinics": total_clinics,
            "active_clinics": active_clinics,
            "defaulting_clinics": defaulting_clinics,
            "mrr": mrr
        },
        "clinics": clinics_list
    }

# Atualizar todos os dados da Assinatura
@router.put("/clinica/{clinic_id}")
def update_clinic_saas_info(
    clinic_id: int, 
    data: SaasUpdate,
    db: Session = Depends(get_db), 
    current_user: User = Depends(allow_only_superuser)
):
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clínica não encontrada")
    
    # Atualiza todos os campos de uma vez
    clinic.plano = data.plano
    clinic.valor_mensalidade = data.valor_mensalidade
    clinic.dia_vencimento = data.dia_vencimento
    clinic.status_assinatura = data.status_assinatura
    
    db.commit()
    return {"message": "Assinatura atualizada com sucesso"}