import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    // Se não tiver o registro do login, ele bloqueia e joga a pessoa de volta para a tela de Login
    return <Navigate to="/" replace />;
  }

  // Se a pessoa tiver feito login, ele deixa passar e desenha a tela normalmente
  return children;
}