import { useEffect, useMemo, useState } from 'react';
import { dashboardService, type RevisionAsignadaDetalle } from '../../../services/dashboardService';
import type { ProyectoApi } from '../../../types';

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const lastSevenDays = (today: Date) => Array.from({ length: 7 }, (_, i) => { const date = new Date(today); date.setDate(date.getDate() - (6 - i)); return date; });
const labelDay = (date: Date) => new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' }).format(date);

interface Props { userId: number; }
const ReviewerAnalytics = ({ userId }: Props) => {
  const [today, setToday] = useState(() => new Date());
  const [reviews, setReviews] = useState<RevisionAsignadaDetalle[]>([]);
  const [projects, setProjects] = useState<ProyectoApi[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<ProyectoApi[]>([]);
  const [uploads, setUploads] = useState<Array<{ fecha: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { const timer = window.setInterval(() => setToday(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    let active = true;
    void Promise.all([dashboardService.revisionesAsignadas(), dashboardService.proyectos(), dashboardService.misInvestigadores()]).then(async ([assignedReviews, allProjects, investigators]) => {
      const ownedProjects = allProjects.filter(project => project.id_usuario === userId);
      const ownerIds = new Set(investigators.map(investigator => investigator.id_investigador));
      const projectsForReview = new Map(allProjects.filter(project => ownerIds.has(project.id_usuario)).map(project => [project.id_proyecto, project]));
      assignedReviews.forEach(review => projectsForReview.set(review.proyecto.id_proyecto, review.proyecto));
      const documents = await Promise.all(ownedProjects.map(project => dashboardService.archivos(project.id_proyecto).catch(() => [])));
      if (active) {
        setReviews(assignedReviews);
        setProjects(ownedProjects);
        setAssignedProjects([...projectsForReview.values()]);
        setUploads(documents.flat().map(document => ({ fecha: document.fecha_subida })));
      }
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'No se pudo cargar la actividad del revisor.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const dates = lastSevenDays(today);
  const activity: Record<string, [boolean, boolean, boolean]> = {};
  dates.forEach(date => { activity[dayKey(date)] = [false, false, false]; });
  reviews.forEach(review => { if (review.fecha_revision) { const key = dayKey(new Date(review.fecha_revision)); if (activity[key]) activity[key][0] = true; } });
  projects.forEach(project => { const key = dayKey(new Date(project.fecha_creacion)); if (activity[key]) activity[key][1] = true; });
  uploads.forEach(upload => { const key = dayKey(new Date(upload.fecha)); if (activity[key]) activity[key][2] = true; });

  const totals = useMemo(() => {
    const projectStates = new Map(assignedProjects.map(project => [project.id_proyecto, project.estado]));
    reviews.forEach(review => projectStates.set(review.proyecto.id_proyecto, review.proyecto.estado));
    const states = [...projectStates.values()];
    const corrections = states.filter(state => state === 'CORRECCIONES').length;
    const reviewed = states.filter(state => state === 'APROBADO').length;
    return { total: states.length, corrections, reviewed, pending: states.length - corrections - reviewed };
  }, [assignedProjects, reviews]);
  const circumference = 2 * Math.PI * 58;
  const slices = [
    { label: 'Revisados y aprobados', value: totals.reviewed, color: '#13865d' },
    { label: 'Con correcciones', value: totals.corrections, color: '#c74848' },
    { label: 'Pendientes / sin dictamen', value: totals.pending, color: '#d69a35' },
  ];
  let offset = 0;
  const dashSegments = slices.map(slice => {
    const length = totals.total ? slice.value / totals.total * circumference : 0;
    const segment = { ...slice, length, offset };
    offset += length;
    return segment;
  });

  return <section className="grid gap-5 xl:grid-cols-2">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 xl:col-span-2">{error}</p>}
    <article className="rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-5">
      <div className="mb-4"><h2 className="font-bold text-[var(--rojo-oscuro)]">Mi actividad</h2><p className="text-xs text-gray-500">Actividad diaria en los últimos siete días</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-center text-sm"><thead><tr><th className="p-2 text-left">Actividad</th>{dates.map(date => <th className="p-2 text-xs text-gray-500" key={dayKey(date)}>{labelDay(date)}</th>)}</tr></thead><tbody>{([
        ['Realicé una revisión', 0], ['Creé un proyecto', 1], ['Cargué un documento', 2],
      ] as const).map(([label, actionIndex]) => <tr key={label} className="border-t"><th className="p-3 text-left text-xs font-semibold">{label}</th>{dates.map(date => { const done = activity[dayKey(date)][actionIndex]; return <td className="p-2" key={dayKey(date)}><span title={`${label}: ${done ? 'realizado' : 'sin actividad'}`} aria-label={`${label}, ${labelDay(date)}: ${done ? 'realizado' : 'sin actividad'}`} className={`mx-auto block h-7 w-7 rounded-md border ${done ? 'border-red-700 bg-red-600' : 'border-gray-200 bg-white'}`} /></td>; })}</tr>)}</tbody></table></div>
      <p className="mt-3 text-xs text-gray-500">Rojo indica que ese día realizaste la actividad.</p>
    </article>
    <article className="rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-5">
      <div className="mb-4"><h2 className="font-bold text-[var(--rojo-oscuro)]">Proyectos asignados para revisión</h2><p className="text-xs text-gray-500">Estado general de los proyectos que te fueron asignados</p></div>
      <div className="flex flex-col items-center justify-center gap-5 sm:flex-row"><div className="relative h-44 w-44 shrink-0"><svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={`Gráfica de dona: ${totals.total} proyectos asignados`}><circle cx="70" cy="70" r="58" fill="none" stroke="#e5e7eb" strokeWidth="18" />{dashSegments.map(segment => <circle key={segment.label} cx="70" cy="70" r="58" fill="none" stroke={segment.color} strokeWidth="18" strokeDasharray={`${segment.length} ${circumference - segment.length}`} strokeDashoffset={-segment.offset} />)}</svg><div className="absolute inset-0 grid place-content-center text-center"><strong className="text-3xl text-[var(--rojo-oscuro)]">{loading ? '…' : error ? '—' : totals.total}</strong><span className="text-xs text-gray-500">proyectos</span></div></div><ul className="space-y-3 text-sm">{slices.map(slice => <li key={slice.label} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} /><span>{slice.label}</span><strong className="ml-auto pl-4">{loading || error ? '—' : slice.value}</strong></li>)}</ul></div>
    </article>
  </section>;
};
export default ReviewerAnalytics;
