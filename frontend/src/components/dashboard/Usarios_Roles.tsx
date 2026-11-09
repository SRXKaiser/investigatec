import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";
import type { UsuarioAdmin } from "../../types";

const nombre = (u: Pick<UsuarioAdmin, "nombre" | "apellido_paterno">) =>
  `${u.nombre} ${u.apellido_paterno}`;
type RolItem = { id_rol: number; nombre: string; descripcion: string | null };

const UsuariosRoles = () => {
  const { user, refreshUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<UsuarioAdmin | null>(null);

  const cargar = useCallback(async () => {
    const [lista, disponibles] = await Promise.all([
      adminService.usuarios(),
      adminService.roles(),
    ]);
    setUsuarios(lista);
    setRoles(disponibles);
    setSeleccionado((current) =>
      current
        ? (lista.find((u) => u.id_usuario === current.id_usuario) ?? null)
        : null,
    );
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.all([adminService.usuarios(), adminService.roles()])
      .then(([lista, disponibles]) => {
        if (active) {
          setUsuarios(lista);
          setRoles(disponibles);
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el directorio.",
          );
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const gestionarRol = async (rol: RolItem) => {
    if (!seleccionado) return;
    const tiene = seleccionado.roles.includes(rol.nombre);
    if (tiene && rol.nombre === "MIEMBRO") return; // Regla del backend.
    if (
      tiene &&
      rol.nombre === "ADMIN" &&
      seleccionado.id_usuario === user?.id_usuario
    )
      return;
    if (
      tiene &&
      !window.confirm(
        `¿Revocar el rol ${rol.nombre} a ${nombre(seleccionado)}?`,
      )
    )
      return;
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      if (tiene)
        await adminService.revocarRol(seleccionado.id_usuario, rol.id_rol);
      else await adminService.asignarRol(seleccionado.id_usuario, rol.id_rol);
      await cargar();
      if (seleccionado.id_usuario === user?.id_usuario) await refreshUser();
      setMensaje(
        `Rol ${rol.nombre} ${tiene ? "revocado" : "asignado"} correctamente.`,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo actualizar el rol.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (u: UsuarioAdmin) => {
    if (!u.activo || window.confirm(`¿Desactivar la cuenta de ${nombre(u)}?`)) {
      setGuardando(true);
      setError("");
      setMensaje("");
      try {
        await adminService.cambiarEstadoUsuario(u.id_usuario, !u.activo);
        await cargar();
        setMensaje(
          `Cuenta ${u.activo ? "desactivada" : "activada"} correctamente.`,
        );
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo actualizar el usuario.",
        );
      } finally {
        setGuardando(false);
      }
    }
  };
  const visibles = usuarios.filter((u) =>
    `${nombre(u)} ${u.correo}`.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-pixel text-[var(--rojo-oscuro)]">
          Usuarios y roles
        </h1>
        <p className="font-cuerpo text-sm text-[var(--cafe)]">
          Directorio de cuentas registradas y gestión de roles de plataforma.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {mensaje && (
        <p
          role="status"
          className="rounded-xl bg-green-50 p-3 text-sm text-green-800"
        >
          {mensaje}
        </p>
      )}
      <div className="rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-pixel">
          <h2 className="font-bold">
            Directorio ({usuarios.filter((u) => u.activo).length} activos)
          </h2>
          <input
            aria-label="Buscar usuario"
            className="max-w-sm rounded-lg border p-2"
            placeholder="Buscar por nombre o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        {cargando ? (
          <p className="p-8 text-center">Cargando usuarios…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-[var(--cafe)]">
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Roles</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((u) => (
                  <tr key={u.id_usuario} className="border-b last:border-0">
                    <td className="p-3 font-semibold">
                      <Link
                        className="text-[var(--rojo)] underline"
                        to={`/dashboard/perfiles/${u.id_usuario}`}
                      >
                        {nombre(u)}
                      </Link>
                    </td>
                    <td className="p-3">{u.correo}</td>
                    <td className="p-3">{u.roles.join(", ") || "Sin rol"}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={guardando}
                          className="rounded-lg border px-3 py-1.5 text-[var(--rojo)]"
                          onClick={() => {
                            setError("");
                            setSeleccionado(u);
                          }}
                        >
                          Gestionar roles
                        </button>
                        <button
                          disabled={
                            guardando ||
                            (u.id_usuario === user?.id_usuario && u.activo)
                          }
                          className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
                          onClick={() => void cambiarEstado(u)}
                        >
                          {u.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visibles.length && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No hay usuarios para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {seleccionado && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !guardando)
              setSeleccionado(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="roles-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="roles-title" className="text-xl font-bold">
              Roles de {nombre(seleccionado)}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Una cuenta puede tener varios roles. Cambia cada permiso por
              separado.
            </p>
            <div className="mt-5 space-y-3">
              {roles.map((rol) => {
                const asignado = seleccionado.roles.includes(rol.nombre);
                const protegido =
                  asignado &&
                  (rol.nombre === "MIEMBRO" ||
                    (rol.nombre === "ADMIN" &&
                      user?.id_usuario === seleccionado.id_usuario));
                return (
                  <div
                    key={rol.id_rol}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {rol.nombre}{" "}
                        {asignado && (
                          <span className="text-xs text-green-700">
                            · asignado
                          </span>
                        )}
                      </p>
                      {protegido && (
                        <p className="text-xs text-gray-500">
                          No se puede revocar este rol desde tu cuenta.
                        </p>
                      )}
                    </div>
                    <button
                      disabled={guardando || protegido}
                      onClick={() => void gestionarRol(rol)}
                      className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 ${asignado ? "text-red-700" : "text-green-800"}`}
                    >
                      {asignado ? "Revocar" : "Asignar"}
                    </button>
                  </div>
                );
              })}
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={guardando}
              className="mt-6 w-full rounded-lg border px-4 py-2"
              onClick={() => setSeleccionado(null)}
            >
              Cerrar
            </button>
          </section>
        </div>
      )}
    </section>
  );
};
export default UsuariosRoles;
