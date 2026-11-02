import { useEffect, useState } from 'react';
import { notificacionesService } from '../../services/notificacionesService';
import type { NotificacionApi } from '../../types';

const Notificaciones = () => {
  const [items, setItems] = useState<NotificacionApi[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { void notificacionesService.listar().then(setItems).catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar las notificaciones.')); }, []);
  const marcarLeida = async (item: NotificacionApi) => { try { await notificacionesService.marcarLeida(item.id_notificacion); setItems(prev => prev.map(n => n.id_notificacion === item.id_notificacion ? { ...n, leida: true } : n)); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo marcar como leída.'); } };
  return <section className="space-y-5">
    <div><h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">Notificaciones</h1>
    <p className="mt-1 text-sm text-[var(--cafe)]/70">Avisos asociados únicamente a tu cuenta.</p>
    </div>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="divide-y rounded-2xl border-[var(--cafe)] bg-[var(--bg)] p-5 border-r-6 border-b-6 border-2">
      {items.map(n => 
      <article 
      key={n.id_notificacion} 
      className={`p-5 ${n.leida ? '' : 'bg-red-50/40'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div>
          <h2 className="font-bold">{n.titulo}</h2>
          <p className="mt-1 text-sm text-gray-700">{n.mensaje}</p>
          <time className="mt-2 block text-xs text-gray-500">
            {new Date(n.fecha_creacion).toLocaleString('es-MX')}
          </time></div>{!n.leida && 
          <button onClick={() => void marcarLeida(n)} 
          className="rounded-lg border px-3 py-1.5 text-sm text-[var(--rojo)]">Marcar leída</button>}</div>
        </article>)}{!items.length && !error && 
        
        <p className="p-8 text-center text-gray-500">No hay notificaciones.</p>}</div></section>;
};
export default Notificaciones;
