import api from "./api";

export interface PerfilApi {
  id_perfil: number;
  id_usuario: number;
  username: string;
  nombre_publico: string | null;
  biografia: string | null;
  foto_perfil: string | null;
  foto_portada: string | null;
  institucion: string | null;
  especialidad: string | null;
  perfil_visible: boolean;
}
export interface PerfilPublicoApi {
  id_usuario: number;
  username: string;
  nombre_publico: string | null;
  biografia: string | null;
  foto_perfil: string | null;
  institucion: string | null;
  especialidad: string | null;
}
/** Contrato de GET /perfiles/publicos, sin datos privados del usuario. */
export interface PerfilDirectorioApi {
  id_usuario: number;
  username: string;
  nombre_publico: string | null;
  foto_perfil: string | null;
  institucion: string | null;
  especialidad: string | null;
}
export interface DirectorioRespuestaApi {
  total: number;
  limite: number;
  offset: number;
  resultados: PerfilDirectorioApi[];
}
export type PerfilCambio = Pick<
  PerfilApi,
  | "username"
  | "nombre_publico"
  | "biografia"
  | "institucion"
  | "especialidad"
  | "perfil_visible"
>;
export interface AreaApi {
  id_area: number;
  nombre: string;
}
export interface EnlaceApi {
  id_enlace: number;
  id_perfil: number;
  tipo: string;
  url: string;
  orden: number;
}

export const perfilService = {
  async directorio(
    buscar = "",
    limite = 12,
    offset = 0,
  ): Promise<DirectorioRespuestaApi> {
    const { data } = await api.get<DirectorioRespuestaApi>(
      "/perfiles/publicos",
      {
        params: {
          ...(buscar.trim() ? { buscar: buscar.trim() } : {}),
          limite,
          offset,
        },
      },
    );
    return data;
  },
  async consultar(idUsuario: number): Promise<PerfilPublicoApi> {
    const { data } = await api.get<PerfilPublicoApi>(`/perfiles/${idUsuario}`);
    return data;
  },
  async obtener(): Promise<PerfilApi> {
    const { data } = await api.get<PerfilApi>("/perfiles/me");
    return data;
  },
  async actualizar(data: PerfilCambio): Promise<PerfilApi> {
    const response = await api.patch<PerfilApi>("/perfiles/me", data);
    return response.data;
  },
  async foto(url: string): Promise<string> {
    // El endpoint de fotografías requiere JWT; el blob conserva la autenticación de Axios.
    if (!/^\/perfiles\/\d+\/foto\/foto_[a-f0-9]+\.jpg$/.test(url))
      throw new Error("Ruta de fotografía no válida.");
    const { data } = await api.get<Blob>(url, { responseType: "blob" });
    return URL.createObjectURL(data);
  },
  async subirFoto(file: File): Promise<PerfilApi> {
    const form = new FormData();
    form.append("foto", file);
    const { data } = await api.put<PerfilApi>("/perfiles/me/foto", form);
    return data;
  },
  async eliminarFoto(): Promise<void> {
    await api.delete("/perfiles/me/foto");
  },
  async areas(): Promise<AreaApi[]> {
    const { data } = await api.get<AreaApi[]>("/academico/areas");
    return data;
  },
  async misAreas(): Promise<AreaApi[]> {
    const { data } = await api.get<AreaApi[]>("/academico/mis-areas");
    return data;
  },
  async guardarAreas(ids_areas: number[]): Promise<AreaApi[]> {
    const { data } = await api.put<AreaApi[]>("/academico/mis-areas", {
      ids_areas,
    });
    return data;
  },
  async enlaces(): Promise<EnlaceApi[]> {
    const { data } = await api.get<EnlaceApi[]>("/academico/enlaces");
    return data;
  },
  async agregarEnlace(tipo: string, url: string): Promise<EnlaceApi> {
    const { data } = await api.post<EnlaceApi>("/academico/enlaces", {
      tipo,
      url,
      orden: 0,
    });
    return data;
  },
  async actualizarEnlace(id: number, tipo: string, url: string): Promise<EnlaceApi> {
    const { data } = await api.patch<EnlaceApi>(`/academico/enlaces/${id}`, { tipo, url });
    return data;
  },
  async eliminarEnlace(id: number): Promise<void> {
    await api.delete(`/academico/enlaces/${id}`);
  },
};
