import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  // Verifica se a pessoa tem a "chave de acesso" (token) salva no navegador
  const token = localStorage.getItem('medical_token');
  
  if (!token) {
    // Se não tiver o token, ele bloqueia e joga a pessoa de volta para a tela de Login
    return <Navigate to="/" replace />;
  }

  // Se a pessoa tiver o token, ele deixa passar e desenha a tela normalmente
  return children;
}