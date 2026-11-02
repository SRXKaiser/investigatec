import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { dashboardService, type RevisionAsignadaDetalle } from '../../services/dashboardService';
import type { ProyectoApi } from '../../types';

const RevisionsAssigned = () => {
  const [revisiones, setRevisiones] = useState<RevisionAsignadaDetalle[]>([]);
  const [sinRevision, setSinRevision] = useState<Array<{ proyecto: ProyectoApi; propietario: string }>>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seleccion, setSeleccion] = useState<RevisionAsignadaDetalle | null>(null);
  const [resultado, setResultado] = useState<'APROBADO' | 'CORRECCIONES'>('APROBADO');
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const [assignedReviews, allProjects, investigators] = await Promise.all([dashboardService.revisionesAsignadas(), dashboardService.proyectos(), dashboardService.misInvestigadores()]);
    setRevisiones(assignedReviews);
    const ownerIds = new Set(investigators.map(person => person.id_investigador));
    const investigatorNames = new Map(investigators.map(person => [person.id_investigador, `${person.nombre} ${person.apellido_paterno}`]));
    const projects = new Map(allProjects.filter(project => ownerIds.has(project.id_usuario)).map(project => [project.id_proyecto, project]));
    assignedReviews.forEach(review => projects.set(review.proyecto.id_proyecto, review.proyecto));
    const reviewedProjectIds = new Set(assignedReviews.map(review => review.proyecto.id_proyecto));
    setSinRevision([...projects.values()].filter(project => !reviewedProjectIds.has(project.id_proyecto)).map(project => ({
      proyecto: project,
      propietario: investigatorNames.get(project.id_usuario) ?? `Investigador #${project.id_usuario}`,
    })));
  }, []);
  useEffect(() => { void cargar().catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar las revisiones asignadas.')).finally(() => setCargando(false)); }, [cargar]);

  const abrirDecision = (revision: RevisionAsignadaDetalle, decision: 'APROBADO' | 'CORRECCIONES') => {
    setSeleccion(revision); setResultado(decision); setComentario(''); setError('');
  };
  const confirmar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!seleccion) return;
    if (resultado === 'CORRECCIONES' && !comentario.trim()) { setError('Describe las correcciones solicitadas.'); return; }
    setGuardando(true); setError('');
    try {
      await dashboardService.decidirRevision(seleccion.id_revision, resultado, comentario.trim());
      setSeleccion(null); await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar la decisión.'); }
    finally { setGuardando(false); }
  };

  return <section className="space-y-5">
    <div><h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">Revisiones asignadas</h1><p className="mt-1 text-sm text-[var(--cafe)]/70">Evalúa los documentos de proyectos que te fueron asignados. Solo tú puedes decidir sobre estas revisiones.</p></div>
    {error && !seleccion && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="overflow-x-auto rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-5"><table className="w-full min-w-[950px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-gray-500"><th className="p-3">Proyecto / documento</th><th className="p-3">Estado</th><th className="p-3">Creado por</th><th className="p-3">Asignada</th><th className="p-3">Acciones</th></tr></thead><tbody>{revisiones.map(review => <tr key={review.id_revision} className="border-b last:border-0"><td className="p-3"><strong>{review.proyecto.titulo}</strong><span className="mt-1 block text-xs text-gray-500">{review.archivo.nombre_original} Ã‚Â· v{review.archivo.version}</span></td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${review.estado === 'APROBADO' ? 'bg-green-100 text-green-800' : review.estado === 'CORRECCIONES' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{review.estado}</span><span className="mt-1 block text-xs text-gray-500">Proyecto: {review.proyecto.estado}</span></td><td className="p-3">{review.nombrePropietario}</td><td className="p-3">{new Date(review.fecha_asignacion).toLocaleDateString('es-MX')}</td><td className="p-3">{review.estado === 'PENDIENTE' ? <div className="flex gap-2"><button className="rounded-lg bg-green-700 px-3 py-1.5 font-semibold text-white" onClick={() => abrirDecision(review, 'APROBADO')}>Aprobar</button><button className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white" onClick={() => abrirDecision(review, 'CORRECCIONES')}>Corregir</button></div> : <details><summary className="cursor-pointer text-[var(--rojo)]">Consultar decisión</summary><p className="mt-2 max-w-xs text-xs text-gray-600">{review.observaciones || 'Sin comentarios.'}</p></details>}<button className="mt-2 rounded-lg border px-3 py-1.5 text-[var(--rojo)]" onClick={() => void dashboardService.descargarArchivo(review.archivo.id_archivo, review.archivo.nombre_original)}>Descargar documento</button></td></tr>)}{sinRevision.map(({ proyecto, propietario }) => <tr key={`assigned-${proyecto.id_proyecto}`} className="border-b last:border-0"><td className="p-3"><strong>{proyecto.titulo}</strong><span className="mt-1 block text-xs text-gray-500">Sin documento enviado a revisión</span></td><td className="p-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{proyecto.estado}</span></td><td className="p-3">{propietario}</td><td className="p-3"></td><td className="p-3 text-xs text-gray-500">Esperando envió del propietario</td></tr>)}{!cargando && !revisiones.length && !sinRevision.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No tienes proyectos asignados para revisar.</td></tr>}{cargando && <tr><td colSpan={5} className="p-8 text-center">Cargando revisiones</td></tr>}</tbody></table></div>
    {seleccion && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !guardando) setSeleccion(null); }}><form role="dialog" aria-modal="true" aria-labelledby="decision-title" onSubmit={confirmar} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><h2 id="decision-title" className="text-xl font-bold">{resultado === 'APROBADO' ? 'Confirmar aprobación' : 'Solicitar correcciones'}</h2><p className="mt-1 text-sm text-gray-600">{seleccion.proyecto.titulo} {seleccion.archivo.nombre_original}<br />El propietario recibirá tu decisión y comentario.</p><label htmlFor="review-comment" className="mt-5 block text-sm font-semibold">{resultado === 'APROBADO' ? 'Comentario para el dueño del proyecto (opcional)' : 'Correcciones que debe realizar'}</label><textarea id="review-comment" rows={5} maxLength={5000} required={resultado === 'CORRECCIONES'} className="mt-2 w-full rounded-lg border p-3" placeholder={resultado === 'APROBADO' ? 'Añade un comentario de aprobación' : 'Describe claramente las correcciones solicitadasâ€¦'} value={comentario} onChange={event => setComentario(event.target.value)} />{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" disabled={guardando} className="rounded-lg border px-4 py-2 disabled:opacity-50" onClick={() => setSeleccion(null)}>Cancelar</button><button disabled={guardando} className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white disabled:opacity-50">{guardando ? 'Guardandoâ€¦' : resultado === 'APROBADO' ? 'Confirmar aprobación' : 'Enviar correcciones'}</button></div></form></div>}
  </section>;
};
export default RevisionsAssigned;
