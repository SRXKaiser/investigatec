import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { TipoUsuario } from "../types";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: TipoUsuario[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, loading, sessionError, refreshUser } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        role="status"
      >
        Verificando tu sesión…
      </div>
    );
  }
  if (!user && sessionError) {
    return (
      <section role="alert" className="mx-auto mt-12 max-w-xl rounded-2xl border bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[var(--rojo-oscuro)]">No se pudo verificar tu sesión</h1>
        <p className="mt-2 text-sm">{sessionError}</p>
        <button type="button" className="mt-5 rounded-lg bg-[var(--rojo)] px-4 py-2 text-white" onClick={() => void refreshUser()}>Reintentar</button>
        <Link to="/login" className="ml-3 inline-block underline">Ir al inicio</Link>
      </section>
    );
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }
  if (roles?.length && !roles.some((role) => user.roles.includes(role))) {
    return (
      <section
        role="alert"
        className="mx-auto mt-12 max-w-xl rounded-2xl border bg-white p-8 text-center"
      >
        <h1 className="text-xl font-bold text-red-800">Acceso restringido</h1>
        <p className="mt-2 text-sm">
          Tu cuenta no tiene un rol autorizado para abrir esta pantalla.
        </p>
        <Link
          to="/dashboard"
          className="mt-5 inline-block rounded-lg border px-4 py-2"
        >
          Volver al panel
        </Link>
      </section>
    );
  }
  return <>{children}</>;
};

export default ProtectedRoute;
