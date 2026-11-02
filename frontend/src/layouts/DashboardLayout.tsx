import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DBsidebar from '../components/dashboard/layout/DBsidebar';
import DBheader from '../components/dashboard/layout/DBheader';
import DBFooter from '../components/dashboard/layout/DBfooter';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const pageTitle: Record<string, string> = {
    '/dashboard': 'Panel general',
    '/dashboard/proyectos': 'Mis proyectos',
    '/dashboard/documentos': 'Mis documentos',
    '/dashboard/seguimiento': 'Seguimiento',
    '/dashboard/revisiones_asignadas': 'Revisiones asignadas',
    '/dashboard/usuarios_roles': 'Usuarios y roles',
    '/dashboard/proyectos_totales': 'Todos los proyectos',
    '/dashboard/asignacion_revisores': 'Asignación de revisores',
    '/dashboard/supervicion': 'Supervisión',
    '/dashboard/notificaciones': 'Notificaciones',
  };

  return (
    <div className="min-h-screen bg-[var(--bg2)] flex">

      <DBsidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />


      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <DBheader title={pageTitle[pathname] ?? 'Panel de control'} />

        <main className="flex-1 p-8">
          <Outlet />
        </main>

        <DBFooter />
      </div>
    </div>
  );
};

export default DashboardLayout;
