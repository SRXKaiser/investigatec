import { useEffect, useMemo, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { ProyectoApi, UsuarioAdmin } from '../../types';

const estadoClass = (estado: string) => estado === 'APROBADO' ? 'bg-green-100 text-green-800' : estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700';
const ProyectosTotales = () => {
  const [proyectos, setProyectos] = useState<ProyectoApi[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [asignados, setAsignados] = useState<Record<number, number>>({});
  const [estado, setEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    void Promise.all([adminService.proyectos(), adminService.usuarios(), adminService.asignaciones()]).then(([ps, us, ars]) => {
      setProyectos(ps); setUsuarios(us); setAsignados(Object.fromEntries(ars.map(a => [a.id_investigador, a.id_revisor])));
    }).catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar los proyectos.')).finally(() => setCargando(false));
  }, []);
  const porId = useMemo(() => Object.fromEntries(usuarios.map(u => [u.id_usuario, u])), [usuarios]);
  const estados = [...new Set(proyectos.map(p => p.estado))];
  const lista = proyectos.filter(p => (estado === 'TODOS' || p.estado === estado) && p.titulo.toLowerCase().includes(busqueda.toLowerCase()));
  return <section className="space-y-5">
    <div><h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">Todos los proyectos</h1><p className="mt-1 text-sm text-[var(--cafe)]/70">Consulta el estado, propietario y revisor asignado de cada proyecto.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="rounded-2xl  border-[var(--cafe)] bg-[var(--bg)] p-5 border-r-6 border-b-6 border-2 p-5 ">
      <div className="mb-4 flex flex-wrap gap-3"><input className="max-w-sm rounded-lg border p-2" placeholder="Buscar proyecto" aria-label="Buscar proyecto" value={busqueda} onChange={e => setBusqueda(e.target.value)} /><select aria-label="Filtrar por estado" className="max-w-xs rounded-lg border p-2" value={estado} onChange={e => setEstado(e.target.value)}><option value="TODOS">Todos los estados</option>{estados.map(e => <option key={e} value={e}>{e}</option>)}</select><span className="self-center text-sm text-gray-500">{lista.length} proyectos</span></div>
      {cargando ? <p className="p-8 text-center">Cargando proyectos…</p> : <div className="space-y-3">{lista.map(p => <details key={p.id_proyecto} className="rounded-xl border border-gray-200 open:border-[var(--rojo)]/40"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4"><span className="font-semibold">{p.titulo}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoClass(p.estado)}`}>{p.estado}</span><span className="text-sm text-gray-600">Revisor: {porId[asignados[p.id_usuario]] ? `${porId[asignados[p.id_usuario]].nombre} ${porId[asignados[p.id_usuario]].apellido_paterno}` : 'Sin asignar'}</span><span className="rounded-lg border px-3 py-1.5 text-sm text-[var(--rojo)]">Ver detalles</span></summary><div className="grid gap-2 border-t bg-gray-50/70 p-4 text-sm md:grid-cols-2"><p><strong>Propietario:</strong> {porId[p.id_usuario] ? `${porId[p.id_usuario].nombre} ${porId[p.id_usuario].apellido_paterno}` : `Usuario #${p.id_usuario}`}</p><p><strong>ID:</strong> {p.id_proyecto}</p><p><strong>Creado:</strong> {new Date(p.fecha_creacion).toLocaleString('es-MX')}</p><p><strong>Actualizado:</strong> {new Date(p.fecha_actualizacion).toLocaleString('es-MX')}</p><p className="md:col-span-2"><strong>Descripción:</strong> {p.descripcion || 'Sin descripción.'}</p></div></details>)}{!lista.length && <p className="p-8 text-center text-gray-500">No hay proyectos en este estado.</p>}</div>}
    </div>
  </section>;
};
export default ProyectosTotales;
