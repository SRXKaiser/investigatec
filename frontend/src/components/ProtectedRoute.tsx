import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mientras el AuthContext verifica el localStorage → mostrar spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-cuerpo text-[var(--cafe)]">Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario → redirigir al login
  // Se guarda la ruta actual en `state.from` para volver después del login
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  // Si hay usuario → renderizar el contenido
  return <>{children}</>;
};

export default ProtectedRoute;