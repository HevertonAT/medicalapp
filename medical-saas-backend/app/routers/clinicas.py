from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List 
import bcrypt 

from app.db.base import get_db
from app.core.deps import get_current_user
from app.models.clinicas import Clinic
from app.models.usuarios import User
from app.schemas.esquema_clinicas import CriarClinica, RespostaClinica, AtualizarClinica

router = APIRouter()

# --- FUNÇÃO AUXILIAR PARA CRIPTOGRAFIA ---
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

# --- ROTA 1: CRIAR CLÍNICA + CRIAR ADMIN AUTOMATICAMENTE ---
@router.post("/", response_model=RespostaClinica, status_code=status.HTTP_201_CREATED)
def create_clinic(
    clinicas_data: CriarClinica, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Segurança: Apenas o dono do SaaS (Superuser) pode criar novas clínicas
    if current_user.role != 'superuser':
        raise HTTPException(status_code=403, detail="Apenas superusuários podem cadastrar novas clínicas.")

    # 2. Validações Anti-Duplicidade
    if clinicas_data.cnpj:
        if db.query(Clinic).filter(Clinic.cnpj == clinicas_data.cnpj).first():
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado no sistema.")
            
    if clinicas_data.email_clinica:
        if db.query(Clinic).filter(Clinic.email == clinicas_data.email_clinica).first():
            raise HTTPException(status_code=400, detail="O e-mail da clínica já está em uso.")

    if db.query(User).filter(User.email == clinicas_data.email_admin).first():
        raise HTTPException(status_code=400, detail="O e-mail do administrador já está em uso por outro usuário.")

    # 3. Cria o objeto da Clínica com as NOVAS colunas
    nova_clinica = Clinic(
        nome=clinicas_data.nome, 
        cnpj=clinicas_data.cnpj,
        email=clinicas_data.email_clinica,
        telefone=clinicas_data.telefone,
        plano_id=clinicas_data.plano_id,
        cep=clinicas_data.cep,
        logradouro=clinicas_data.logradouro,
        numero=clinicas_data.numero,
        bairro=clinicas_data.bairro,
        cidade=clinicas_data.cidade,
        estado=clinicas_data.estado,
        complemento=clinicas_data.complemento,
        is_active=True
    )

    # 4. Salva a clínica no banco temporariamente para gerar o ID dela
    db.add(nova_clinica)
    db.flush() 

    # 5. Cria o Usuário Admin usando o ID da clínica que acabou de nascer
    novo_admin = User(
        full_name=clinicas_data.nome_admin,
        email=clinicas_data.email_admin,
        hashed_password=get_password_hash(clinicas_data.senha_admin),
        role="admin", 
        clinic_id=nova_clinica.id, 
        is_active=True
    )
    db.add(novo_admin)

    # 6. Efetiva as duas criações juntas (Se o banco cair no meio, ele cancela as duas)
    db.commit()
    db.refresh(nova_clinica) 

    return nova_clinica

# --- ROTA 2: LISTAR CLÍNICAS (Apenas Superuser) ---
@router.get("/", response_model=List[RespostaClinica])
def list_clinics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'superuser':
        raise HTTPException(status_code=403, detail="Acesso negado.")
        
    return db.query(Clinic).all()

# --- ROTA 3: PEGAR DADOS DA PRÓPRIA CLÍNICA (USADA NAS CONFIGURAÇÕES) ---
@router.get("/me", response_model=RespostaClinica)
def get_my_clinic(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verifica se o usuário pertence a alguma clínica
    if not current_user.clinic_id:
        raise HTTPException(status_code=404, detail="Usuário não está vinculado a nenhuma clínica.")
        
    clinica = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
    
    if not clinica:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")
        
    return clinica

# --- ROTA 4: ATUALIZAR DADOS DA CLÍNICA ---
@router.put("/{clinic_id}", response_model=RespostaClinica)
def update_clinic(
    clinic_id: int,
    clinic_data: AtualizarClinica, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'superuser' and current_user.clinic_id != clinic_id:
        raise HTTPException(status_code=403, detail="Acesso negado. Você só pode editar sua própria clínica.")

    clinica = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinica:
        raise HTTPException(status_code=404, detail="Clínica não encontrada.")

    update_data = clinic_data.dict(exclude_unset=True)
    
    if 'email_clinica' in update_data:
        update_data['email'] = update_data.pop('email_clinica')

    for key, value in update_data.items():
        if hasattr(clinica, key):
            setattr(clinica, key, value)

    db.commit()
    db.refresh(clinica) 

    return clinica