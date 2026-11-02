import api from './api';
import type { AsignacionRevisorApi, ProyectoApi, UsuarioAdmin } from '../types';

export interface AuditoriaApi {
  id_auditoria: number;
  id_usuario: number;
  accion: string;
  entidad: string;
  id_registro: number | null;
  fecha_evento: string;
}

export interface SeguimientoApi {
  id_proyecto: number;
  titulo: string;
  estado_proyecto: string;
  id_investigador: number;
  documentos: Array<{
    id_documento: number;
    nombre_documento: string;
    estado: string;
    id_archivo_actual: number | null;
  }>;
}

export const adminService = {
  async usuarios() {
    const resultado: UsuarioAdmin[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data } = await api.get<UsuarioAdmin[]>('/admin/usuarios', { params: { limite: 100, offset } });
      resultado.push(...data);
      if (data.length < 100) return resultado;
    }
  },
  async proyectos() {
    const { data } = await api.get<ProyectoApi[]>('/proyectos/');
    return data;
  },
  async asignaciones() {
    const { data } = await api.get<AsignacionRevisorApi[]>('/asignaciones/');
    return data;
  },
  async asignarRevisor(idInvestigador: number, idRevisor: number) {
    const { data } = await api.put<AsignacionRevisorApi>(`/asignaciones/investigadores/${idInvestigador}/revisor`, { id_revisor: idRevisor });
    return data;
  },
  async resumen() {
    const { data } = await api.get<{ total_proyectos: number; aprobados: number; pendientes: number }>('/seguimiento/resumen/general');
    return data;
  },
  async auditoria() {
    const resultado: AuditoriaApi[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data } = await api.get<AuditoriaApi[]>('/admin/auditoria', { params: { limite: 100, offset } });
      resultado.push(...data);
      if (data.length < 100) return resultado;
    }
  },
  async seguimiento(idProyecto: number) {
    const { data } = await api.get<SeguimientoApi>(`/seguimiento/proyectos/${idProyecto}`);
    return data;
  },
  async cambiarEstadoUsuario(idUsuario: number, activo: boolean) {
    const { data } = await api.patch<UsuarioAdmin>(`/admin/usuarios/${idUsuario}/estado`, { activo });
    return data;
  },
  async roles() {
    const { data } = await api.get<Array<{ id_rol: number; nombre: string; descripcion: string | null }>>('/roles');
    return data;
  },
  async asignarRol(idUsuario: number, idRol: number) {
    await api.post(`/admin/usuarios/${idUsuario}/roles`, { id_rol: idRol });
  },
  async revocarRol(idUsuario: number, idRol: number) {
    await api.delete(`/admin/usuarios/${idUsuario}/roles/${idRol}`);
  },
};

export type { ProyectoApi };
