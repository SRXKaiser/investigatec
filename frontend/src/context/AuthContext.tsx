import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { TipoUsuario, Usuario } from "../types";
import { authService } from "../services/authService";
import { SESSION_EXPIRED_EVENT, ApiRequestError } from "../services/api";

interface AuthContextValue {
  user: Usuario | null;
  login: (user: Usuario, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  selectRole: (role: TipoUsuario) => void;
  loading: boolean;
  sessionError: string | null;
  /** Permite remontar vistas privadas cuando cambia la cuenta/token. */
  sessionId: number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const PREFERRED_ROLE_KEY = "investigatec:preferred-role";
const VALID_ROLES: TipoUsuario[] = ["ADMIN", "REVISOR", "MIEMBRO"];

function readPreferredRole(): TipoUsuario | undefined {
  const stored = localStorage.getItem(PREFERRED_ROLE_KEY);
  return VALID_ROLES.find((role) => role === stored);
}

/** Se utiliza el exp únicamente como reloj local; la autorización la decide el servidor. */
function vencimientoToken(token: string): number | null {
  try {
    const fragmento = token.split(".")[1];
    if (!fragmento) return null;
    const normalized = fragmento.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof payload.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(0);
  const [activeToken, setActiveToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const sessionVersion = useRef(0);
  const lastValidation = useRef(0);

  // clearStorage=false: la sesión cambió en OTRA pestaña; no borrar su token nuevo.
  const endSession = useCallback((clearStorage: boolean) => {
    sessionVersion.current += 1;
    if (clearStorage) localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem(PREFERRED_ROLE_KEY);
    setUser(null);
    setActiveToken(null);
    setSessionError(null);
    setLoading(false);
    setSessionId((value) => value + 1);
  }, []);

  const logout = useCallback(() => endSession(true), [endSession]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      endSession(false);
      return;
    }
    const version = ++sessionVersion.current;
    try {
      const verified = await authService.validarSesion(
        token,
        readPreferredRole(),
      );
      if (
        version === sessionVersion.current &&
        localStorage.getItem("token") === token
      ) {
        setUser(verified);
        setActiveToken(token);
        setSessionError(null);
        localStorage.setItem(PREFERRED_ROLE_KEY, verified.tipo_usuario);
        lastValidation.current = Date.now();
      }
    } catch (error) {
      if (
        version !== sessionVersion.current ||
        localStorage.getItem("token") !== token
      )
        return;
      const status =
        error instanceof ApiRequestError ? error.status : undefined;
      if (status === 401 || status === 403) {
        endSession(true);
        return;
      }
      // Las caídas de red NO revocan la cuenta. En el arranque se ofrece reintentar.
      setSessionError(
        "No fue posible verificar tu sesión. Comprueba tu conexión y vuelve a intentarlo.",
      );
    } finally {
      if (version === sessionVersion.current) setLoading(false);
    }
  }, [endSession]);

  useEffect(() => {
    void refreshUser();
    // Solo al montar: los cambios posteriores se gestionan con storage y focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const invalidate = () => endSession(false);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "token") return;
      sessionVersion.current += 1;
      setUser(null);
      setSessionError(null);
      setSessionId((value) => value + 1);
      if (!event.newValue) {
        endSession(false);
      } else {
        localStorage.removeItem(PREFERRED_ROLE_KEY);
        setActiveToken(event.newValue);
        setLoading(true);
        void refreshUser();
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, invalidate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, invalidate);
      window.removeEventListener("storage", onStorage);
    };
  }, [endSession, refreshUser]);

  // Revalidación tras volver a la pestaña y cada 5 minutos: detecta roles revocados.
  useEffect(() => {
    const validarAlVolver = () => {
      if (
        document.visibilityState === "visible" &&
        localStorage.getItem("token") &&
        Date.now() - lastValidation.current > 60_000
      ) {
        void refreshUser();
      }
    };
    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        localStorage.getItem("token")
      ) {
        void refreshUser();
      }
    }, 5 * 60_000);
    window.addEventListener("focus", validarAlVolver);
    document.addEventListener("visibilitychange", validarAlVolver);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", validarAlVolver);
      document.removeEventListener("visibilitychange", validarAlVolver);
    };
  }, [refreshUser]);

  // Cierre oportuno de sesión expirada incluso cuando el usuario no hace peticiones.
  useEffect(() => {
    if (!activeToken) return;
    const expiry = vencimientoToken(activeToken);
    if (expiry === null) return;
    const remaining = expiry - Date.now();
    if (remaining <= 0) {
      logout();
      return;
    }
    const timeout = window.setTimeout(
      logout,
      Math.min(remaining, 2_147_483_647),
    );
    return () => window.clearTimeout(timeout);
  }, [activeToken, logout]);

  const login = (userData: Usuario, token: string) => {
    sessionVersion.current += 1;
    localStorage.setItem("token", token);
    localStorage.removeItem("user");
    localStorage.setItem(PREFERRED_ROLE_KEY, userData.tipo_usuario);
    setUser(userData);
    setActiveToken(token);
    setSessionError(null);
    setSessionId((value) => value + 1);
    lastValidation.current = Date.now();
    setLoading(false);
  };

  const selectRole = (role: TipoUsuario) => {
    if (!user?.roles.includes(role)) return;
    localStorage.setItem(PREFERRED_ROLE_KEY, role);
    setUser((current) => (current ? { ...current, tipo_usuario: role } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        selectRole,
        loading,
        sessionError,
        sessionId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
