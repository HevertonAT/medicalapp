from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt # Importação para criptografar a senha do admin

# Ajuste: Importar get_db de app.db.base e get_current_user para autenticação
from app.db.base import get_db
from app.core.deps import get_current_user

# Ajuste: Models corretos
from app.models.clinicas import Clinic
from app.models.usuarios import User

# Mantendo seus schemas
from app.schemas.esquema_clinicas import CriarClinica, RespostaClinica

router = APIRouter()

# --- FUNÇÃO AUXILIAR PARA SENHA ---
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

@router.post("/", response_model=RespostaClinica, status_code=status.HTTP_201_CREATED)
def create_clinic(
    clinicas_data: CriarClinica, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protege a rota exigindo token
):
    # 0. Segurança: Apenas superusers podem criar novas clínicas
    if current_user.role != 'superuser' and getattr(current_user, 'is_superuser', False) == False:
        raise HTTPException(status_code=403, detail="Apenas superusuários podem cadastrar clínicas.")

    # 1. Verifica se CNPJ já existe (mantendo sua lógica original)
    if hasattr(Clinic, 'cnpj') and clinicas_data.cnpj:
        existing_clinic = db.query(Clinic).filter(Clinic.cnpj == clinicas_data.cnpj).first()
        if existing_clinic:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado no sistema.")

    # 2. Verifica se o email do novo Admin já está em uso
    # (Usamos hasattr para não quebrar caso o schema ainda não tenha sido atualizado)
    if hasattr(clinicas_data, 'email_admin') and clinicas_data.email_admin:
        user_exists = db.query(User).filter(User.email == clinicas_data.email_admin).first()
        if user_exists:
            raise HTTPException(status_code=400, detail="O email do administrador já está em uso.")

    # 3. Cria o objeto da Clínica
    nova_clinica = Clinic(
        nome=clinicas_data.razao_social, 
        cnpj=clinicas_data.cnpj,
        endereco=getattr(clinicas_data, 'endereco', None),
        telefone=getattr(clinicas_data, 'telefone', None)
    )

    # 4. Salva a clínica no banco temporariamente para gerar o ID
    db.add(nova_clinica)
    db.flush() # O nova_clinica.id agora existe!

    # 5. Cria o Usuário Admin vinculado a esta nova clínica
    if hasattr(clinicas_data, 'email_admin') and clinicas_data.email_admin:
        novo_admin = User(
            full_name=clinicas_data.nome_admin,
            email=clinicas_data.email_admin,
            hashed_password=get_password_hash(clinicas_data.senha_admin),
            role="admin",
            clinic_id=nova_clinica.id, # <-- Vincula o admin à clínica
            is_active=True
        )
        db.add(novo_admin)

    # 6. Efetiva as duas criações juntas (Se falhar uma, a outra é cancelada)
    db.commit()
    db.refresh(nova_clinica) 

    return nova_clinica