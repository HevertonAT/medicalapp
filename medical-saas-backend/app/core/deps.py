from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

# Ajuste: Importar get_db de app.db.base (onde definimos a engine)
from app.db.base import get_db

# Ajuste: Importar a Classe User correta (Inglês)
from app.models.usuarios import User

from app.core.config import settings

# Define onde o token é esperado (na URL /auth/login)
# Certifique-se que no main.py você montou o router de auth com prefixo '/auth'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- FUNÇÃO DE AUTENTICAÇÃO ---
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodifica o Token JWT
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Busca o usuário no banco pelo email
    user = db.query(User).filter(User.email == email).first()
    
    if user is None:
        raise credentials_exception
        
    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        # 1. Superusuário (Dev) tem chave mestra, entra em tudo
        if user.is_superuser: 
            return user
            
        # 2. Se o cargo do usuário não estiver na lista permitida, bloqueia (Erro 403)
        # Normalizamos para garantir que 'admin' e 'Admin' funcionem igual
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Acesso negado: O perfil '{user.role}' não permite esta ação."
            )
        return user