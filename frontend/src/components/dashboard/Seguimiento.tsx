import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { dashboardService, type SeguimientoProyectoApi } from '../../services/dashboardService';
import api from '../../services/api';
import type { AsignacionRevisorApi, ProyectoApi, UsuarioAdmin } from '../../types';

type Asesor = { nombre: string; correo?: string };
type ProyectoConAsesor = SeguimientoProyectoApi & { asesor: Asesor | null };
type Fila = { id: string; proyecto: ProyectoConAsesor; documento: string; estado: string };

const estiloEstado = (estado: string) => {
  if (estado === 'APROBADO') return 'bg-green-100 text-green-800';
  if (estado === 'CORRECCIONES') return 'bg-red-100 text-red-800';
  if (estado.includes('PENDIENTE')) return 'bg-amber-100 text-amber-900';
  return 'bg-gray-100 text-gray-700';
};

export default function Seguimiento() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoConAsesor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seleccion, setSeleccion] = useState<ProyectoConAsesor | null>(null);
  const [correo, setCorreo] = useState('');
  const [consulta, setConsulta] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(async () => {
    if (!user) return;
    setError('');
    const proyectosApi: ProyectoApi[] = await dashboardService.proyectos();
    const seguimientos = await Promise.all(proyectosApi.map(project => dashboardService.seguimientoProyecto(project.id_proyecto)));
    let asesorPorInvestigador = new Map<number, Asesor>();

    if (user.tipo_usuario === 'ADMIN') {
      const [asignaciones, usuarios] = await Promise.all([adminService.asignaciones(), adminService.usuarios()]);
      const porId = new Map<number, UsuarioAdmin>(usuarios.map(persona => [persona.id_usuario, persona]));
      asesorPorInvestigador = new Map<number, Asesor>(asignaciones.map((asignacion: AsignacionRevisorApi) => {
        const persona = porId.get(asignacion.id_revisor);
        return [asignacion.id_investigador, persona ? { nombre: `${persona.nombre} ${persona.apellido_paterno}`, correo: persona.correo } : { nombre: `Asesor #${asignacion.id_revisor}` }];
      }));
    } else {
      try {
        const { data: asignacion } = await api.get<AsignacionRevisorApi>(`/asignaciones/investigadores/${user.id_usuario}/revisor`);
        let nombre = `Asesor #${asignacion.id_revisor}`;
        try {
          const { data: perfil } = await api.get<{ nombre_publico?: string; username?: string }>(`/perfiles/${asignacion.id_revisor}`);
          nombre = perfil.nombre_publico || perfil.username || nombre;
        } catch { /* El perfil puede no estar disponible. */ }
        asesorPorInvestigador.set(user.id_usuario, { nombre });
      } catch { /* Proyecto sin asesor asignado. */ }
    }

    setProyectos(seguimientos.map(seguimiento => ({
      ...seguimiento,
      asesor: asesorPorInvestigador.get(seguimiento.id_investigador) ?? null,
    })));
  }, [user]);

  useEffect(() => {
    void cargar().catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar el seguimiento.')).finally(() => setCargando(false));
  }, [cargar]);

  const filas = useMemo<Fila[]>(() => proyectos.flatMap(project => project.documentos.length
    ? project.documentos.map(document => ({ id: `${project.id_proyecto}-${document.id_documento}`, proyecto: project, documento: document.nombre_documento, estado: document.estado }))
    : [{ id: `${project.id_proyecto}-sin-documento`, proyecto: project, documento: 'Sin documentos cargados', estado: project.estado_proyecto }]), [proyectos]);

  const abrirConsulta = (project: ProyectoConAsesor) => {
    setSeleccion(project);
    setCorreo(project.asesor?.correo ?? '');
    setConsulta('');
    setMensaje('');
  };

  const enviarConsulta = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!seleccion || !correo.trim() || !consulta.trim()) return;
    const asunto = `Consulta sobre el proyecto ${seleccion.titulo}`;
    const cuerpo = `Hola ${seleccion.asesor?.nombre ?? 'asesor'},\n\nTengo una duda sobre el proyecto "${seleccion.titulo}":\n\n${consulta.trim()}\n\nSaludos.`;
    window.location.href = `mailto:${encodeURIComponent(correo.trim())}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    setMensaje('Se abrió tu aplicación de correo con la consulta preparada para enviarla.');
  };

  return <section className="space-y-5">
    <header>
      <h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">Seguimiento</h1>
      <p className="mt-1 text-sm text-[var(--cafe)]/70">Consulta el estado de los documentos, las correcciones y las aprobaciones de tus proyectos.</p>
    </header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="overflow-x-auto rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-5">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead><tr className="border-b text-xs uppercase text-gray-500"><th className="p-3">Documento / proyecto</th><th className="p-3">Estado</th><th className="p-3">Asesor</th><th className="p-3">Acción</th></tr></thead>
        <tbody>
          {filas.map(fila => <tr key={fila.id} className="border-b last:border-0">
            <td className="p-3"><strong>{fila.documento}</strong><span className="mt-1 block text-xs text-gray-500">{fila.proyecto.titulo}</span></td>
            <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estiloEstado(fila.estado)}`}>{fila.estado.replaceAll('_', ' ')}</span>{fila.estado === 'CORRECCIONES' && <details className="mt-2"><summary className="cursor-pointer text-xs text-[var(--rojo)]">Ver observaciones</summary><div className="mt-1 space-y-1 text-xs text-gray-600">{fila.proyecto.documentos.find(doc => doc.nombre_documento === fila.documento)?.versiones.flatMap(version => version.revisiones ?? []).filter(revision => revision.estado === 'CORRECCIONES').map((revision, index) => <p key={index}>{revision.observaciones || 'Sin comentario del revisor.'}</p>)}</div></details>}</td>
            <td className="p-3">{fila.proyecto.asesor?.nombre ?? 'Sin asesor asignado'}</td>
            <td className="p-3"><button disabled={!fila.proyecto.asesor} className="rounded-lg border border-[var(--cafe)] px-3 py-1.5 font-semibold text-[var(--rojo)] transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => abrirConsulta(fila.proyecto)}>Consulta</button></td>
          </tr>)}
          {!cargando && !filas.length && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay proyectos para mostrar.</td></tr>}
          {cargando && <tr><td colSpan={4} className="p-8 text-center">Cargando seguimiento…</td></tr>}
        </tbody>
      </table>
    </div>

    {seleccion && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSeleccion(null); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="consulta-title" onSubmit={enviarConsulta} className="w-full max-w-lg rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-6 shadow-2xl">
        <h2 id="consulta-title" className="text-xl font-bold text-[var(--rojo-oscuro)]">Consulta al asesor</h2>
        <p className="mt-1 text-sm text-gray-600">Proyecto: {seleccion.titulo} · Asesor: {seleccion.asesor?.nombre}</p>
        <label htmlFor="asesor-email" className="mt-5 block text-sm font-semibold">Correo del asesor</label>
        <input id="asesor-email" required type="email" value={correo} onChange={event => setCorreo(event.target.value)} className="mt-2 w-full rounded-lg border p-3" placeholder="asesor@institucion.edu.mx" />
        <label htmlFor="consulta-texto" className="mt-4 block text-sm font-semibold">Tu duda</label>
        <textarea id="consulta-texto" required maxLength={3000} rows={5} value={consulta} onChange={event => setConsulta(event.target.value)} className="mt-2 w-full rounded-lg border p-3" placeholder="Escribe tu consulta…" />
        {mensaje && <p role="status" className="mt-3 text-sm text-green-800">{mensaje}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" className="rounded-lg border px-4 py-2" onClick={() => setSeleccion(null)}>Cerrar</button><button className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white">Preparar correo</button></div>
      </form>
    </div>}
  </section>;
}
