//import { CalendarDays, ClipboardCheck, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import Hero from './inicio/Hero';
import AccesosDirectos from './inicio/AccesosDirectos';
import { useAuth } from '../../context/AuthContext';
import QuickStat from './inicio/Stat';
import AdminAnalytics from './inicio/AdminAnalytics';
import ReviewerAnalytics from './inicio/ReviewerAnalytics';
import { HERO_ROL } from '../../types';
import type { TipoUsuario } from '../../types';

interface DashboardHomeProps {
  role: TipoUsuario;
}

const DashboardHome = ({ role }: DashboardHomeProps) => {
  const { user } = useAuth();
  if (!user) return null;
  const roleContent = HERO_ROL[role];

  return (
    <div className='flex flex-col gap-6 xl:flex-row'>
      <div className="min-w-0 flex-1 space-y-6">
        <div className='flex flex-row'>
          <div className='basis-3/4'>
            <Hero
              titulo={roleContent.titulo}
              descripcion={roleContent.descripcion}
              rol={roleContent.rol}
            />
          </div>


          <div className='basis-1/4'>
            <AccesosDirectos />
          </div>
        </div>


        <QuickStat />

        {role === 'ADMIN' ? <AdminAnalytics /> : role === 'REVISOR' ? <ReviewerAnalytics userId={user.id_usuario} /> : <section className="rounded-2xl border border-[var(--cafe)]/10 bg-white p-6 text-left shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            {/* <UserRound aria-hidden="true" className="h-6 w-6 text-[var(--rojo)]" /> */}
            <h2 className="text-xl font-bold text-[var(--rojo-oscuro)]">Datos de tu cuenta</h2>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-[var(--cafe)]/70">Nombre</dt>
              <dd className="font-semibold text-[var(--cafe)]">{user.nombre} {user.apellido_paterno} {user.apellido_materno || ''}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--cafe)]/70">Correo</dt>
              <dd className="font-semibold text-[var(--cafe)]">{user.correo}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--cafe)]/70">ID de usuario</dt>
              <dd className="font-semibold text-[var(--cafe)]">{user.id_usuario}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--cafe)]/70">Miembro desde</dt>
              <dd className="font-semibold text-[var(--cafe)]">{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(user.fecha_registro))}</dd>
            </div>
          </dl>
        </section>}
      </div>
    </div>
  );
};

export default DashboardHome;
