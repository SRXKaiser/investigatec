import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import type { ProyectoApi } from '../../types';

const estadoStyle = (estado: string) => ({
  APROBADO: 'bg-green-100 text-green-800',
  PENDIENTE: 'bg-amber-100 text-amber-800',
  CORRECCIONES: 'bg-red-100 text-red-800',
}[estado] ?? 'bg-gray-100 text-gray-700');

const MisProyectos = () => {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    const data = await dashboardService.proyectos();
    setProyectos(data.filter(project => project.id_usuario === user?.id_usuario));
  }, [user?.id_usuario]);
  useEffect(() => { void cargar().catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar tus proyectos.')).finally(() => setCargando(false)); }, [cargar]);

  const crear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (titulo.trim().length < 3) { setError('El título debe tener al menos tres caracteres.'); return; }
    setCreando(true); setError('');
    try {
      await dashboardService.crearProyecto(titulo.trim(), descripcion.trim());
      setTitulo(''); setDescripcion(''); setMostrarFormulario(false); await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo crear el proyecto.'); }
    finally { setCreando(false); }
  };

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">Mis proyectos</h1><p className="mt-1 text-sm text-[var(--cafe)]/70">Proyectos creados por ti y su estado actual.</p></div><button className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white" onClick={() => setMostrarFormulario(true)}>+ Nuevo proyecto</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="overflow-x-auto rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-5"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-gray-500"><th className="p-3">Proyecto</th><th className="p-3">Estado</th><th className="p-3">Fecha de creación</th><th className="p-3">Detalles</th></tr></thead><tbody>{proyectos.map(project => <tr key={project.id_proyecto} className="border-b last:border-0"><td className="p-3 font-semibold">{project.titulo}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoStyle(project.estado)}`}>{project.estado}</span></td><td className="p-3">{new Date(project.fecha_creacion).toLocaleDateString('es-MX')}</td><td className="p-3"><details><summary className="cursor-pointer text-[var(--rojo)]">Ver detalles</summary><p className="mt-2 max-w-md whitespace-pre-wrap text-sm text-gray-600">{project.descripcion || 'Sin descripción.'}</p><p className="mt-1 text-xs text-gray-500">Última actualización: {new Date(project.fecha_actualizacion).toLocaleString('es-MX')}</p></details></td></tr>)}{!cargando && !proyectos.length && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Aún no has creado proyectos.</td></tr>}{cargando && <tr><td colSpan={4} className="p-8 text-center">Cargando proyectos…</td></tr>}</tbody></table></div>
    {mostrarFormulario && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setMostrarFormulario(false); }}><form role="dialog" aria-modal="true" aria-labelledby="project-create-title" onSubmit={crear} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 id="project-create-title" className="text-xl font-bold">Nuevo proyecto</h2><label className="mt-5 block text-sm font-semibold" htmlFor="project-title">Título</label><input id="project-title" className="mt-2 w-full rounded-lg border p-3" minLength={3} maxLength={255} required value={titulo} onChange={event => setTitulo(event.target.value)} /><label className="mt-4 block text-sm font-semibold" htmlFor="project-description">Descripción</label><textarea id="project-description" rows={4} className="mt-2 w-full rounded-lg border p-3" value={descripcion} onChange={event => setDescripcion(event.target.value)} /><div className="mt-6 flex justify-end gap-2"><button type="button" className="rounded-lg border px-4 py-2" onClick={() => setMostrarFormulario(false)}>Cancelar</button><button disabled={creando} className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white disabled:opacity-50">{creando ? 'Creando…' : 'Crear proyecto'}</button></div></form></div>}
  </section>;
};
export default MisProyectos;
