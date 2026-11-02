import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ScrollToHash from './components/ScrollTohash';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardIndex from './pages/DashboardIndex';
import UsuariosRoles from './components/dashboard/Usarios_Roles';
import ProyectosTotales from './components/dashboard/ProyectosTotales';
import ProtectedRoute from './components/ProtectedRoute';
import AsignacionRevisores from './components/dashboard/AsignacionRevisores';
import Supervicion from './components/dashboard/Supervision';
import Notificaciones from './components/dashboard/Notificaciones';
import RevisionesAsignadas from './components/dashboard/RevisionesAsignadas';
import MisProyectos from './components/dashboard/MisProyectos';
import MisDocumentos from './components/dashboard/MisDocumentos';
import Seguimiento from './components/dashboard/Seguimiento';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardIndex />} />
              <Route path="usuarios_roles" element={<UsuariosRoles />} />
              <Route path="proyectos_totales" element={<ProyectosTotales />} />
              <Route path="asignacion_revisores" element={<AsignacionRevisores />} />
              <Route path="supervicion" element={<Supervicion />} />
              <Route path="notificaciones" element={<Notificaciones />} />
              <Route path="revisiones_asignadas" element={<RevisionesAsignadas />} />
              <Route path="proyectos" element={<MisProyectos />} />
              <Route path="documentos" element={<MisDocumentos />} />
              <Route path="seguimiento" element={<Seguimiento />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
