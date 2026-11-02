
// ═══════════════════════════════════════════════════════════
// TIPOS COMPARTIDOS DEL PROYECTO
// ═══════════════════════════════════════════════════════════

// Proyecto
export interface Proyecto {
  id: number;
  titulo: string;
  autor: string;
  departamento: string;
  materia: string;
  palabrasClave: string[];
  fecha: string; //estandar: "2025-08-15"
  resumen: string;
  popularidad: number;
  imagen: string | null;
}

//Proyecto
export type EstadoProyecto = 'Borrador' | 'En revisión' | 'Publicado' | 'Archivado';

export interface ProyectoDashboard {
  id: number;
  titulo: string;
  areaTematica: string;
  estado: EstadoProyecto;
  actualizadoEn: string;//date
}

// Actividad
export interface Actividad {
  id: number;
  tipo: 'creado' | 'enviado' | 'publicado' | 'actualizado';
  titulo: string;          // "Proyecto enviado a revisión"
  descripcion: string;     // nombre del proyecto
  fecha: string;
}


// Estadísticas
export interface EstadisticasDashboard {
  totalProyectos: number;
  borradores: number;
  enRevision: number;
  publicados: number;
}
// Servicio (para CardService)
export interface Servicio {
  id: number;
  titulo: string;
  subtitulo: string;
  descripcion: string;
}

// Razón de la caja azul (para BlueBox)
export interface RazonCaja {
  id: number;
  texto: string;
  align: 'left' | 'right';
}

// Filtros de busqueda
export interface Opcion {
  value: string;
  label: string;
}

export interface RangoFecha {
  desde: string;
  hasta: string;
}

export type TipoFiltro = 'text' | 'select' | 'multi' | 'date';

export type ValorFiltro = string | string[] | RangoFecha;

// Estado interno del componente (TODO obligatorio)
export interface FiltrosProyecto {
  query: string;
  titulo: string;
  autor: string;
  departamento: string;
  materia: string;
  palabrasClave: string[];
  fecha: RangoFecha;
  orden: OrdenFiltro;
}

// Valores por defecto
export const FILTROS_VACIOS: FiltrosProyecto = {
  query: '',
  titulo: '',
  autor: '',
  departamento: '',
  materia: '',
  palabrasClave: [],
  fecha: { desde: '', hasta: '' },
  orden: 'recientes',
};

export interface FiltrosQuery {
  query?: string;
  titulo?: string;
  autor?: string;
  departamento?: string;
  materia?: string;
  palabrasClave?: string[];
  fechaDesde?: string;
  fechaHasta?: string;
  orden?: OrdenFiltro;
}

// Resultados de búsqueda
export interface ResultadoProyectos {
  proyectos: Proyecto[];
  total: number;
}


//
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  user: Usuario;
  token: string;
}

export type OrdenFiltro = 'recientes' | 'populares' | 'alfabetico';


//------------------PARA BASE DE DATOS

export type TipoUsuario = 'ADMIN' | 'MIEMBRO' | 'REVISOR';

//1. END POINT REGISTER
export interface RegistroPayload {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  password: string;
}


export interface RegistroResponse {
  id_usuario: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo: string;
  activo: boolean;
  fecha_registro: string;
}

export interface ApiError {
  detail?: string | { msg: string; loc: string[] }[];
}

//2. ENDPOINT DE DEPARTAMENTOS, PARA FILTRAR LA LISTA
export interface Departamentos {
  id_departamento: number;
  nombre: string;
  descripcion: string | null;
}

//3. LO MISMO PERO AHORA PARA LAS CARRERAS SI EL USUARIO ES ALUMNO
export interface Carreras {
   id_carrera: number;
   nombre: string;
   siglas: string;
   //activa?: boolean;
   id_departamento: number;
}

//-----------ESTO ES PARA EL MOMENTO EN QUE EL USUARIO HAGA LOGIN
export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo: string;
  tipo_usuario: TipoUsuario;
  activo: boolean;
  fecha_registro: string;
}

export interface UsuarioAdmin extends Pick<Usuario, 'id_usuario' | 'nombre' | 'apellido_paterno' | 'correo' | 'activo'> {
  roles: string[];
}

export interface AsignacionRevisorApi {
  id_investigador: number;
  id_revisor: number;
  asignado_por: number;
  fecha_asignacion: string;
}

export interface ProyectoApi {
  id_proyecto: number;
  id_usuario: number;
  titulo: string;
  descripcion: string | null;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface NotificacionApi {
  id_notificacion: number;
  id_usuario: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}


//DATOS PARA DASHBOARDS



//ICONS DE SIDEBAR Y ESTADISTICAS
import { House, FileText, SquarePen, RotateCwClock, Users, LibraryBig, ArrowLeftRight, UserStar, ListChecks, GlobeCheck, PenLine, ListTodo,
  PartyPopper, Bell,
  ClipboardPen,FileSearchCorner, type LucideIcon } from 'lucide-react';

//interface d ela sidebar
export interface SideBar {
    to: string;
    label: string;
    icon: LucideIcon;
}

//links segun cada rol
export const LINKS_ROL: Record<TipoUsuario, SideBar[]> = {
    ADMIN: [
        { to: '/dashboard', label: 'Inicio', icon: House },
        { to: '/dashboard/seguimiento', label: 'Seguimiento', icon: RotateCwClock },
        { to: '/dashboard/usuarios_roles', label: 'Usuarios y roles', icon: Users},
        { to: '/dashboard/proyectos_totales', label: 'Todos los proyectos', icon: LibraryBig},
        { to: '/dashboard/asignacion_revisores', label: 'Asignacion de revisores', icon: ArrowLeftRight},
        { to: '/dashboard/supervicion', label: 'Supervición', icon: UserStar},
        { to: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell},
    ],
    MIEMBRO: [
        { to: '/dashboard', label: 'Inicio', icon: House },
        { to: '/dashboard/proyectos', label: 'Mis proyectos', icon: FileText },
        { to: '/dashboard/documentos', label: 'Mis documentos', icon: SquarePen},
        { to: '/dashboard/seguimiento', label: 'Seguimiento', icon: RotateCwClock },
        { to: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell},
    ],
    REVISOR: [
        { to: '/dashboard', label: 'Inicio', icon: House },
        { to: '/dashboard/revisiones_asignadas', label: 'Revisiones asignadas', icon: ListChecks},
        { to: '/dashboard/proyectos', label: 'Mis proyectos', icon: FileText},
        { to: '/dashboard/documentos', label: 'Mis documentos', icon: SquarePen},
        { to: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell},
    ]
}

export interface HeroContent {
  titulo: string;
  descripcion: string;
  rol: string;
}


//hero por cada rol
export const HERO_ROL: Record<TipoUsuario, HeroContent> = {
  ADMIN:
    {titulo: 'Administración académica', descripcion: 'Supervisa la gestión de usuarios, proyectos y revisiones de la plataforma.', rol: 'ADMINISTRADOR'},
  MIEMBRO: 
    {titulo: 'Espacio de investigación', descripcion: 'Consulta tu perfil y gestiona tus actividades de investigación.', rol: 'MIEMBRO'},
  REVISOR:
    { titulo: 'Revisión e investigación', descripcion: 'Consulta tu perfil y da seguimiento a tus actividades de revisión.', rol: 'REVISOR'}
}

//estadisticas en el dashboard
interface Stat {
    label: string;
    value: string;
    icon: LucideIcon;
};

//tarjetas de inicio segun cada rol
export const STAT_ROL: Record<TipoUsuario, Stat[]> = {
    ADMIN: [
        { label:'Usuarios activos', value:'',  icon: GlobeCheck},
        { label:'Proyectos', value:'', icon: LibraryBig},
        { label:'Proyectos aprobados', value:'', icon: PartyPopper},
        { label:'Proyectos pendientes de revisión', value:'', icon:PenLine},
        
    ],
    MIEMBRO: [
        { label:'Mis proyectos', value:'', icon: FileText},
        { label:'En revision', value:'', icon: FileSearchCorner},
        { label:'Aprobados', value:'', icon: PartyPopper},
        { label:'Correcciones pendientes', value:'', icon: ClipboardPen}
    ],
    REVISOR: [
        { label:'Revisiones pendientes', value:'', icon: PenLine},
        { label:'Revisiones realizadas', value:'', icon: ListChecks},
        { label:'Mis proyectos', value:'', icon: FileText},
        { label:'Mis proyectos en revision', value:'', icon: ListTodo}
    ],
}

//accesos directos
//interface
export interface AccesosDirectos {
    to: string;
    label: string;
}

//links segun cada rol
export const LINKS_DIRECTOS_ROL: Record<TipoUsuario, AccesosDirectos[]> = {
    ADMIN: [
        { to: '/dashboard/supervicion', label: 'ASIGNAR REVISOR' },
        { to: '/dashboard/usuarios_roles', label: 'GESTIONAR USUARIOS'},

    ],
    MIEMBRO: [
        { to: '/dashboard/proyectos', label: '+ NUEVO PROYECTO'},
        { to: '/dashboard/documentos', label: 'SUBIR DOCUMENTO'},

    ],
    REVISOR: [
        { to: '/dashboard/proyectos', label: '+ NUEVO PROYECTO'},
        { to: '/dashboard/documentos', label: 'SUBIR DOCUMENTO'},
        { to: '/dashboard/revisiones_asignadas', label: 'REVISIONES ASIGNADAS'},
    ]
}


//para las notificacioes en el header
export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}

// Mock de notificaciones (por mientras)
export const NOTIFICACIONES_MOCK: Notificacion[] = [
  {
    id: 1,
    titulo: 'Nuevo proyecto asignado',
    mensaje: 'Se te ha asignado un nuevo proyecto para revisión.',
    fecha: new Date().toISOString(),
    leida: false,
  },
  {
    id: 2,
    titulo: 'Correcciones solicitadas',
    mensaje: 'El revisor solicitó cambios en el documento "Marco Teórico".',
    fecha: new Date(Date.now() - 86400000).toISOString(), // Ayer
    leida: false,
  },
  {
    id: 3,
    titulo: 'Proyecto aprobado',
    mensaje: 'Tu proyecto "Sistema de Trazabilidad" ha sido aprobado.',
    fecha: new Date(Date.now() - 172800000).toISOString(), // Antier
    leida: true,
  },
];
