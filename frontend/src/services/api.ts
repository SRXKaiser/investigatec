import axios from "axios";

/** Dirección del servicio; nunca incluir credenciales en variables VITE_*. */
const configuredUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = (configuredUrl || "http://localhost:8001").replace(
  /\/+$/,
  "",
);

export const SESSION_EXPIRED_EVENT = "investigatec:session-expired";

export class ApiRequestError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

// Evita mostrar detalles técnicos, trazas y errores de infraestructura al usuario.
const MENSAJE_SERVICIO =
  "No pudimos completar la solicitud. Inténtalo de nuevo.";
const MENSAJE_CONEXION =
  "No fue posible establecer conexión. Comprueba tu conexión e inténtalo nuevamente.";
const TECNICO =
  /fastapi|backend|cors|traceback|exception|sqlalchemy|postgres|internal server error|database error|\bapi\b|http\s*[45]\d\d/i;

function mensajeError(detalle: unknown, status?: number): string {
  if (status && status >= 500) return MENSAJE_SERVICIO;
  let mensaje: string | undefined;
  if (typeof detalle === "string") mensaje = detalle.trim();
  else if (Array.isArray(detalle)) {
    const textos = detalle
      .map((item: unknown) => {
        if (!item || typeof item !== "object") return null;
        const { msg } = item as { msg?: unknown };
        return typeof msg === "string" ? msg : null;
      })
      .filter((item): item is string => Boolean(item));
    if (textos.length) mensaje = textos.join(". ");
  }
  if (mensaje && !TECNICO.test(mensaje)) return mensaje;
  if (status === 401)
    return "La sesión expiró o no es válida. Inicia sesión nuevamente.";
  if (status === 403) return "No tienes permisos para realizar esta acción.";
  if (status === 404) return "No se encontró la información solicitada.";
  if (status === 409)
    return "La operación no se pudo completar debido al estado actual del registro.";
  if (status === 413) return "El archivo supera el tamaño permitido.";
  if (status === 422)
    return "Revisa la información ingresada e inténtalo nuevamente.";
  return MENSAJE_SERVICIO;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Una solicitud con el token anterior NUNCA debe entregar resultados a la cuenta nueva.
// No se aplica a /auth/login ni a /auth/me del nuevo login, cuyo token aún no se guarda.
const tokenDeSolicitud = new WeakMap<object, string>();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const ruta = config.url || "";
  const rutaPublica =
    ruta.includes("/auth/login") || ruta.includes("/auth/register");
  if (token && !rutaPublica && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  const usado = String(config.headers.get("Authorization") || "");
  if (token && !rutaPublica && usado === `Bearer ${token}`) {
    tokenDeSolicitud.set(config, token);
  }
  return config;
});

function solicitudDesactualizada(config: object | undefined): boolean {
  if (!config) return false;
  const token = tokenDeSolicitud.get(config);
  return token !== undefined && token !== localStorage.getItem("token");
}

api.interceptors.response.use(
  (response) => {
    if (solicitudDesactualizada(response.config)) {
      return Promise.reject(
        new ApiRequestError(
          "La sesión cambió. Vuelve a cargar la información.",
        ),
      );
    }
    return response;
  },
  (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    // Descartar también errores de sesiones anteriores; no revocar la sesión nueva.
    if (solicitudDesactualizada(error.config)) {
      return Promise.reject(
        new ApiRequestError(
          "La sesión cambió. Vuelve a cargar la información.",
        ),
      );
    }
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isLogin = url.includes("/auth/login");
    const usedAuthorization = String(
      error.config?.headers?.get?.("Authorization") || "",
    );
    const currentToken = localStorage.getItem("token");
    if (
      status === 401 &&
      !isLogin &&
      currentToken &&
      usedAuthorization === `Bearer ${currentToken}`
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    if (!error.response) {
      const message =
        error.code === "ECONNABORTED"
          ? "La solicitud tardó demasiado. Inténtalo nuevamente."
          : MENSAJE_CONEXION;
      return Promise.reject(new ApiRequestError(message));
    }
    const detail = (error.response.data as { detail?: unknown } | undefined)
      ?.detail;
    return Promise.reject(
      new ApiRequestError(mensajeError(detail, status), status),
    );
  },
);

export default api;
