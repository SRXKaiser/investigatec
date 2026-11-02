import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { STAT_ROL } from '../../../types';
import { adminService } from '../../../services/adminService';
import { dashboardService } from '../../../services/dashboardService';

const QuickStat = () => {
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState<number[] | null>(null);
  const [roleStats, setRoleStats] = useState<number[] | null>(null);
  useEffect(() => {
    if (user?.tipo_usuario !== 'ADMIN') return;
    void Promise.all([adminService.usuarios(), adminService.proyectos()]).then(([usuarios, proyectos]) => {
      setAdminStats([usuarios.filter(u => u.activo).length, proyectos.length, proyectos.filter(p => p.estado === 'APROBADO').length, proyectos.filter(p => p.estado === 'PENDIENTE').length]);
    }).catch(() => setAdminStats(null));
  }, [user?.tipo_usuario]);
  useEffect(() => {
    if (!user || user.tipo_usuario === 'ADMIN') return;
    const load = async () => {
      const projects = (await dashboardService.proyectos()).filter(p => p.id_usuario === user.id_usuario);
      if (user.tipo_usuario === 'MIEMBRO') {
        setRoleStats([
          projects.length,
          projects.filter(p => p.estado === 'PENDIENTE').length,
          projects.filter(p => p.estado === 'APROBADO').length,
          projects.filter(p => p.estado === 'CORRECCIONES').length,
        ]);
      } else {
        const revisions = await dashboardService.misRevisiones();
        setRoleStats([
          revisions.filter(r => r.estado === 'PENDIENTE').length,
          revisions.filter(r => r.estado !== 'PENDIENTE').length,
          projects.length,
          projects.filter(p => p.estado === 'PENDIENTE').length,
        ]);
      }
    };
    void load().catch(() => setRoleStats(null));
  }, [user?.id_usuario, user?.tipo_usuario]);
  const stats = user ? STAT_ROL[user.tipo_usuario] || [] : [];
  return <section aria-label="Resumen de cuenta" className="grid grid-cols-1 gap-4 md:grid-cols-4">
    {stats.map(({ label, value, icon: Icon }, index) => (
      <article key={label} className="rounded-2xl border border-r-6 border-b-6 border-[var(--cafe)] bg-[var(--bg)]/60 p-6 text-left">
        <div className="mb-1 flex items-center justify-between"><Icon aria-hidden="true" className="h-9 w-9 rounded-full bg-[var(--cafe)] p-2 text-[var(--bg)]" /></div>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold text-[var(--cafe)]">{label}</h2></div>
        <p className="text-2xl font-bold text-[var(--rojo-oscuro)]">{user?.tipo_usuario === 'ADMIN' ? (adminStats ? adminStats[index] : '—') : (roleStats ? roleStats[index] : value || '—')}</p>
      </article>
    ))}
  </section>;
};
export default QuickStat;
