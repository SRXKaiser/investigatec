import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import InvestigadorDashboard from './InvestigadorDashboard';
import RevisorDashboard from './RevisorDashboard';

const DashboardIndex = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.tipo_usuario) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MIEMBRO':
      return <InvestigadorDashboard />;
    case 'REVISOR':
      return <RevisorDashboard />;
  }
};

export default DashboardIndex;
