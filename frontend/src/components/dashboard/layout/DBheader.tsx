import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { notificacionesService } from '../../../services/notificacionesService';
import type { NotificacionApi } from '../../../types';

interface DBHeaderProps { title?: string; }
const DBheader = ({ title = 'Panel de control' }: DBHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificacionApi[]>([]);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => { try { const items = await notificacionesService.listar(); if (mounted) { setNotifications(items); setError(''); } } catch { if (mounted) setError('No se pudieron cargar las notificaciones.'); } };
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [user?.id_usuario]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  if (!user) return null;
  const iniciales = `${user.nombre.charAt(0)}${user.apellido_paterno.charAt(0)}`.toUpperCase();
  const noLeidas = notifications.filter(n => !n.leida).length;
  const handleMarcarLeidas = async () => {
    const pendientes = notifications.filter(n => !n.leida);
    const results = await Promise.allSettled(pendientes.map(n => notificacionesService.marcarLeida(n.id_notificacion)));
    const leidas = new Set(pendientes.filter((_, i) => results[i].status === 'fulfilled').map(n => n.id_notificacion));
    setNotifications(prev => prev.map(n => leidas.has(n.id_notificacion) ? { ...n, leida: true } : n));
  };
  const tiempo = (iso: string) => {
    const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutos < 60) return minutos ? `Hace ${minutos} min` : 'Ahora';
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    return `Hace ${Math.floor(horas / 24)} días`;
  };
  return <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-[var(--negro)] bg-[var(--bg2)] px-8">
    <div className="text-left"><p className="text-sm font-bold uppercase tracking-widest text-[var(--rojo)]">InvestigaTec / {user.tipo_usuario}</p><p className="text-3xl font-semibold font-pixel text-[var(--cafe)]">{title}</p></div>
    <div className="flex items-center gap-4"><div className="relative" ref={dropdownRef}><button aria-label="Notificaciones" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--cafe)] bg-[var(--bg)] text-[var(--rojo-oscuro)]"><Bell className="h-5 w-5" />{noLeidas > 0 && <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-[var(--bg2)] bg-[var(--rojo)]" />}</button>
      {isOpen && <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-[var(--cafe)] bg-[var(--bg)] shadow-xl"><div className="flex items-center justify-between border-b p-4"><h3 className="font-bold text-[var(--cafe)]">Notificaciones</h3>{noLeidas > 0 && <button onClick={() => void handleMarcarLeidas()} className="flex items-center gap-1 text-xs text-[var(--rojo)]"><CheckCheck className="h-3 w-3" /> Marcar leídas</button>}</div><div className="max-h-80 overflow-y-auto">{error ? <p className="p-4 text-sm text-red-700">{error}</p> : !notifications.length ? <p className="p-4 text-center text-sm text-gray-500">No hay notificaciones</p> : notifications.slice(0, 4).map(n => <div key={n.id_notificacion} className={`border-b p-4 ${!n.leida ? 'bg-[var(--rojo)]/5' : ''}`}><div className="flex items-start justify-between gap-2"><p className={`text-sm ${n.leida ? 'font-semibold' : 'font-bold text-[var(--rojo-oscuro)]'}`}>{n.titulo}</p><span className="whitespace-nowrap text-[10px] text-gray-500">{tiempo(n.fecha_creacion)}</span></div><p className="mt-1 line-clamp-2 text-xs">{n.mensaje}</p></div>)}</div><div className="border-t p-3"><button onClick={() => { setIsOpen(false); navigate('/dashboard/notificaciones'); }} className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-[var(--rojo)]">Ver todas las notificaciones <ExternalLink className="h-4 w-4" /></button></div></div>}</div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--cafe)] bg-[var(--bg)] text-sm font-bold text-[var(--rojo-oscuro)]">{iniciales}</div><div className="hidden text-right md:block"><p className="font-semibold font-pixel text-xl leading-tight text-[var(--rojo-oscuro)]">{user.nombre} {user.apellido_paterno}</p><p className="text-xs font-sub-pixel text-[var(--cafe)]/90">{user.correo}</p></div></div>
  </header>;
};
export default DBheader;
