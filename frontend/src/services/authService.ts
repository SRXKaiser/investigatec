import api, { ApiRequestError } from "./api";
import type {
  LoginResponse,
  RegistroPayload,
  RegistroResponse,
  TipoUsuario,
  Usuario,
  UsuarioBaseApi,
} from "../types";

type RolApi = { id_rol: number; nombre: string; descripcion: string | null };
const ROLES_VALIDOS: TipoUsuario[] = ["ADMIN", "REVISOR", "MIEMBRO"];

function isRole(value: string): value is TipoUsuario {
  return ROLES_VALIDOS.some((role) => role === value);
}

/** Se consultan siempre /auth/me y /roles/me: el perfil almacenado NO concede permisos. */
async function cargarUsuario(
  token: string,
  preferido?: TipoUsuario,
): Promise<Usuario> {
  const headers = { Authorization: `Bearer ${token}` };
  const [usuarioResponse, rolesResponse] = await Promise.all([
    api.get<UsuarioBaseApi>("/auth/me", { headers }),
    api.get<RolApi[]>("/roles/me", { headers }),
  ]);
  const roles = [
    ...new Set(rolesResponse.data.map((role) => role.nombre).filter(isRole)),
  ];
  if (!usuarioResponse.data.activo)
    throw new ApiRequestError(
      "La cuenta está desactivada. Contacta al administrador.",
      403,
    );
  if (!roles.length)
    throw new ApiRequestError(
      "La cuenta no tiene ningún rol habilitado. Consulta al administrador.",
      403,
    );
  const tipo_usuario =
    preferido && roles.includes(preferido)
      ? preferido
      : ROLES_VALIDOS.find((role) => roles.includes(role))!;
  return { ...usuarioResponse.data, roles, tipo_usuario };
}

export const authService = {
  async registrarUsuario(payload: RegistroPayload): Promise<RegistroResponse> {
    const { data } = await api.post<RegistroResponse>("/auth/register", {
      ...payload,
      nombre: payload.nombre.trim(),
      apellido_paterno: payload.apellido_paterno.trim(),
      apellido_materno: payload.apellido_materno?.trim() || null,
      correo: payload.correo.trim().toLowerCase(),
    });
    return data;
  },

  async login(
    correo: string,
    password: string,
  ): Promise<{ usuario: Usuario; token: string }> {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      correo: correo.trim().toLowerCase(),
      password,
    });
    if (!data.access_token || data.token_type.toLowerCase() !== "bearer") {
      throw new Error("No fue posible iniciar sesión. Inténtalo nuevamente.");
    }
    // El token se envía explícitamente, sin persistir una sesión parcial.
    const usuario = await cargarUsuario(data.access_token);
    return { usuario, token: data.access_token };
  },

  async validarSesion(
    token: string,
    preferido?: TipoUsuario,
  ): Promise<Usuario> {
    return cargarUsuario(token, preferido);
  },
};
