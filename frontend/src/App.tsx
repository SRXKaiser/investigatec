import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ScrollToHash from "./components/ScrollTohash";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardIndex from "./pages/DashboardIndex";
import UsuariosRoles from "./components/dashboard/Usarios_Roles";
import ProyectosTotales from "./components/dashboard/ProyectosTotales";
import ProtectedRoute from "./components/ProtectedRoute";
import AsignacionRevisores from "./components/dashboard/AsignacionRevisores";
import Supervicion from "./components/dashboard/Supervision";
import Notificaciones from "./components/dashboard/Notificaciones";
import RevisionesAsignadas from "./components/dashboard/RevisionesAsignadas";
import MisProyectos from "./components/dashboard/MisProyectos";
import MisDocumentos from "./components/dashboard/MisDocumentos";
import Seguimiento from "./components/dashboard/Seguimiento";
import MiPerfil from "./components/dashboard/MiPerfil";
import PerfilPublico from "./components/dashboard/PerfilPublico";
import DetalleProyecto from "./components/dashboard/DetalleProyecto";
import Auditoria from "./components/dashboard/Auditoria";
import DirectorioAcademico from "./components/dashboard/DirectorioAcademico";
import TableroSeguimiento from "./components/dashboard/TableroSeguimiento";
import { useAuth } from "./context/AuthContext";
import "./App.css";

function DashboardSessionLayout() {
  const { user, sessionId } = useAuth();
  return <DashboardLayout key={`${user?.id_usuario ?? "anon"}:${sessionId}`} />;
}

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

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardSessionLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardIndex />} />
            <Route
              path="usuarios_roles"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <UsuariosRoles />
                </ProtectedRoute>
              }
            />
            <Route
              path="proyectos_totales"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <ProyectosTotales />
                </ProtectedRoute>
              }
            />
            <Route
              path="asignacion_revisores"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AsignacionRevisores />
                </ProtectedRoute>
              }
            />
            <Route
              path="supervicion"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <Supervicion />
                </ProtectedRoute>
              }
            />
            <Route path="tablero" element={<TableroSeguimiento />} />
            <Route path="perfil" element={<MiPerfil />} />
            <Route path="directorio" element={<DirectorioAcademico />} />
            <Route path="perfiles/:idUsuario" element={<PerfilPublico />} />
            <Route path="proyectos/:idProyecto" element={<DetalleProyecto />} />
            <Route
              path="auditoria"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <Auditoria />
                </ProtectedRoute>
              }
            />
            <Route path="notificaciones" element={<Notificaciones />} />
            <Route
              path="revisiones_asignadas"
              element={
                <ProtectedRoute roles={["REVISOR"]}>
                  <RevisionesAsignadas />
                </ProtectedRoute>
              }
            />
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
