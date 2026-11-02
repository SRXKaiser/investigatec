import { useEffect, useMemo, useState } from 'react';
import { adminService, type AuditoriaApi } from '../../../services/adminService';
import type { ProyectoApi } from '../../../types';

const getDates = (today: Date) => Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - (6 - i)); return d; });
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayLabel = (d: Date) => new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' }).format(d);
const AdminAnalytics = () => {

  const [today, setToday] = useState(() => new Date());
  const [proyectos, setProyectos] = useState<ProyectoApi[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaApi[]>([]);

  useEffect(() => {
     const timer = window.setInterval(() => setToday(new Date()), 60000); 
     return () => window.clearInterval(timer); }, []);

  useEffect(() => { 
    void Promise.all([adminService.proyectos(), adminService.auditoria()]).
    then(([p, a]) => 
      { setProyectos(p); setAuditoria(a); }).catch(() => undefined); }, []);

  const dates = getDates(today);
  const countByDay = useMemo(() => dates.map(d => proyectos.filter(p => isoDay(new Date(p.fecha_creacion)) === isoDay(d)).length), [proyectos, today]);
  const max = Math.max(1, ...countByDay);
  const points = countByDay.map((count, i) => `${65 + count / max * 545},${35 + i * 23}`).join(' ');
  const auditsFor = (date: Date, kind: 'users' | 'reviewers') => auditoria.some(a => {
    if (isoDay(new Date(a.fecha_evento)) !== isoDay(date)) return false;
    return kind === 'users' ? ['usuarios', 'usuarios_roles'].includes(a.entidad) : a.entidad === 'asignaciones_revisores';
  });
  return <section className="grid gap-5 xl:grid-cols-2">
    <article className="rounded-2xl border-[var(--cafe)] bg-[var(--bg)] p-5 border-r-4 border-b-4 border-2">
      <div className="mb-3">
        <h2 className="font-bold text-[var(--rojo-oscuro)]">Proyectos subidos</h2>
        <p className="text-xs text-gray-500">Cantidad por fecha · últimos 7 días</p>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 700 220" role="img" aria-label="Gráfica de proyectos subidos en los últimos siete días" 
          className="min-w-[540px] w-full"><line x1="65" y1="198" x2="635" y2="198" stroke="#d8dce4" />
          <line x1="65" y1="25" x2="65" y2="198" stroke="#d8dce4" />
          <polyline points={points} fill="none" stroke="#8b1e3f" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          {countByDay.map((n, i) => { const x = 65 + n / max * 545; const y = 35 + i * 23; return <g key={isoDay(dates[i])}>
            <circle cx={x} cy={y} r="5" fill="#8b1e3f" />
            <text x={x + 10} y={y + 4} fontSize="12" fill="#3f2630">{n}</text>
            <text x="58" y={y + 4} textAnchor="end" fontSize="11" fill="#747b89">{dayLabel(dates[i])}</text></g>; })}<text x="350" y="216" textAnchor="middle" fontSize="11" fill="#747b89">Cantidad de proyectos</text></svg></div></article>
    <article className="rounded-2xl border-[var(--cafe)] bg-[var(--bg)] p-5 border-r-4 border-b-4 border-2"><div className="mb-3"><h2 className="font-bold text-[var(--rojo-oscuro)]">Actividad administrativa</h2><p className="text-xs text-gray-500">Acciones detectadas en auditoría · últimos 7 días</p></div><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-center text-sm"><thead><tr><th className="p-2 text-left">Actividad</th>{dates.map(d => <th key={isoDay(d)} className="p-2 text-xs text-gray-500">{dayLabel(d)}</th>)}</tr></thead><tbody>{([['Administrar usuarios y roles', 'users'], ['Asignar revisores', 'reviewers']] as const).map(([label, kind]) => <tr key={kind} className="border-t"><th className="p-3 text-left text-xs font-semibold">{label}</th>{dates.map(d => { const done = auditsFor(d, kind); return <td key={isoDay(d)} className="p-2"><span title={`${label}: ${done ? 'actividad detectada' : 'sin actividad'}`} aria-label={`${label}, ${dayLabel(d)}: ${done ? 'actividad detectada' : 'sin actividad'}`} className={`mx-auto block h-7 w-7 rounded-md border ${done ? 'border-red-700 bg-red-600' : 'border-gray-200 bg-white'}`} /></td>; })}</tr>)}</tbody></table></div><p className="mt-3 text-xs text-gray-500">Los cuadros rojos indican acciones registradas.</p></article>
  </section>;
};
export default AdminAnalytics;
