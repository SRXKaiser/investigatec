import api from './api';
import type { ProyectoApi } from '../types';

export interface ArchivoApi {
  id_archivo: number;
  id_proyecto: number;
  id_documento: number;
  nombre_original: string;
  tipo_mime: string;
  version: number;
  resumen_detectado: string | null;
  fecha_subida: string;
}

export interface RevisionApi {
  id_revision: number;
  id_archivo: number;
  id_revisor: number;
  estado: string;
  observaciones: string | null;
  fecha_asignacion: string;
  fecha_revision: string | null;
}

export interface RevisionAsignadaDetalle extends RevisionApi {
  archivo: ArchivoApi;
  proyecto: ProyectoApi;
  nombrePropietario: string;
}

export interface DocumentoSeguimientoApi {
  id_documento: number;
  nombre_documento: string;
  estado: string;
  version_actual: number;
  id_archivo_actual: number | null;
  versiones: Array<{
    id_archivo: number;
    version: number;
    nombre_original: string;
    fecha_subida: string;
    estado: string;
    revisiones?: Array<{ estado: string; observaciones: string | null; fecha_revision: string | null }>;
  }>;
}

export interface SeguimientoProyectoApi {
  id_proyecto: number;
  titulo: string;
  estado_proyecto: string;
  id_investigador: number;
  documentos: DocumentoSeguimientoApi[];
}

export const dashboardService = {
  async proyectos() {
    const { data } = await api.get<ProyectoApi[]>('/proyectos/');
    return data;
  },
  async crearProyecto(titulo: string, descripcion: string) {
    const { data } = await api.post<ProyectoApi>('/proyectos/', { titulo, descripcion: descripcion || null });
    return data;
  },
  async archivos(idProyecto: number) {
    const { data } = await api.get<ArchivoApi[]>(`/archivos/proyectos/${idProyecto}`);
    return data;
  },
  async subirArchivo(idProyecto: number, archivo: File) {
    const form = new FormData();
    form.append('archivo', archivo);
    const { data } = await api.post<ArchivoApi>(`/archivos/proyectos/${idProyecto}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  async subirVersion(idArchivo: number, archivo: File) {
    const form = new FormData();
    form.append('archivo', archivo);
    const { data } = await api.post<ArchivoApi>(`/archivos/${idArchivo}/versiones`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  async enviarRevision(idArchivo: number) {
    const { data } = await api.post<RevisionApi>(`/revisiones/enviar/${idArchivo}`);
    return data;
  },
  async misRevisiones() {
    const { data } = await api.get<RevisionApi[]>('/revisiones/mis-revisiones');
    return data;
  },
  async misInvestigadores() {
    const { data } = await api.get<Array<{ id_investigador: number; nombre: string; apellido_paterno: string }>>('/asignaciones/mis-investigadores');
    return data;
  },
  async decidirRevision(idRevision: number, resultado: 'APROBADO' | 'CORRECCIONES', comentario: string) {
    const { data } = await api.post(`/revisiones/${idRevision}/decision`, { resultado, comentario: comentario || null });
    return data;
  },
  async seguimientoProyecto(idProyecto: number) {
    const { data } = await api.get<SeguimientoProyectoApi>(`/seguimiento/proyectos/${idProyecto}`);
    return data;
  },
  async descargarArchivo(idArchivo: number, nombre: string) {
    const { data } = await api.get<Blob>(`/archivos/${idArchivo}/descargar`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  async revisionesAsignadas() {
    const revisions = await this.misRevisiones();
    const ownerNames: Record<number, string> = {};
    try {
      const investigators = await this.misInvestigadores();
      investigators.forEach(owner => { ownerNames[owner.id_investigador] = `${owner.nombre} ${owner.apellido_paterno}`; });
    } catch { /* Algunas revisiones se asignan manualmente, sin asignación permanente. */ }
    return Promise.all(revisions.map(async revision => {
      const { data: archivo } = await api.get<ArchivoApi>(`/archivos/${revision.id_archivo}`);
      const { data: proyecto } = await api.get<ProyectoApi>(`/proyectos/${archivo.id_proyecto}`);
      let nombrePropietario = ownerNames[proyecto.id_usuario] || `Investigador #${proyecto.id_usuario}`;
      try {
        const { data: profile } = await api.get<{ nombre_publico?: string; username?: string }>(`/perfiles/${proyecto.id_usuario}`);
        nombrePropietario = profile.nombre_publico || profile.username || nombrePropietario;
      } catch { /* El perfil puede no ser público; el identificador del dueño se mantiene. */ }
      return { ...revision, archivo, proyecto, nombrePropietario };
    }));
  },
};
