from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Ajuste: Importar get_db de app.db.base
from app.db.base import get_db

# Ajuste: Model correto (Clinic)
from app.models.clinicas import Clinic

# Mantendo seus schemas (assumindo que existem)
from app.schemas.esquema_clinicas import CriarClinica, RespostaClinica

router = APIRouter()

@router.post("/", response_model=RespostaClinica, status_code=status.HTTP_201_CREATED)
def create_clinic( # Nome da função em inglês (padrão)
    clinicas_data: CriarClinica, 
    db: Session = Depends(get_db)
):
    # 1. Verifica se CNPJ já existe (se o model tiver esse campo)
    # Verifique se no seu model Clinic existe o campo 'cnpj'. Se não, remova esta checagem.
    if hasattr(Clinic, 'cnpj'):
        existing_clinic = db.query(Clinic).filter(Clinic.cnpj == clinicas_data.cnpj).first()
        if existing_clinic:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado no sistema.")

    # 2. Cria o objeto
    # ATENÇÃO: O model Clinic (usado no reset_db) usa 'nome'.
    # Estamos mapeando 'razao_social' do input para 'nome' do banco.
    nova_clinica = Clinic(
        nome=clinicas_data.razao_social, 
        cnpj=clinicas_data.cnpj,
        # Adicione endereço e telefone se vierem no schema
        endereco=getattr(clinicas_data, 'endereco', None),
        telefone=getattr(clinicas_data, 'telefone', None)
    )

    # 3. Salva no banco
    db.add(nova_clinica)
    db.commit()
    db.refresh(nova_clinica) # O ID agora será um Inteiro

    return nova_clinica