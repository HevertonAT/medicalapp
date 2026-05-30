import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  // Verifica se o usuário tem a "chave de acesso" salva no navegador
  // Como agora o token é HTTPOnly (seguro), verificamos se existe a role salva
  const role = localStorage.getItem('user_role');
  
  if (!role) {
    // Se não tiver o registro do login, ele bloqueia e joga a pessoa de volta para a tela de Login
    return <Navigate to="/" replace />;
  }

  // Se a pessoa tiver feito login, ele deixa passar e desenha a tela normalmente
  return children;
}