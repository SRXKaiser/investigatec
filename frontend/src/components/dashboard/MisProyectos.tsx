import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardService } from "../../services/dashboardService";
import type { ProyectoApi } from "../../types";

const estadoStyle = (estado: string) =>
  ({
    APROBADO: "bg-green-100 text-green-800",
    PENDIENTE: "bg-amber-100 text-amber-800",
    CORRECCIONES: "bg-red-100 text-red-800",
    BORRADOR: "bg-gray-100 text-gray-700",
  })[estado] ?? "bg-gray-100 text-gray-700";

const MisProyectos = () => {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [edicion, setEdicion] = useState<ProyectoApi | null>(null);
  const [formulario, setFormulario] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    const data = await dashboardService.proyectos();
    setProyectos(
      data.filter((project) => project.id_usuario === user?.id_usuario),
    );
  }, [user?.id_usuario]);

  useEffect(() => {
    let active = true;
    setCargando(true);
    void dashboardService
      .proyectos()
      .then((data) => {
        if (active)
          setProyectos(
            data.filter((project) => project.id_usuario === user?.id_usuario),
          );
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar los proyectos.",
          );
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id_usuario]);

  const nuevo = () => {
    setEdicion(null);
    setTitulo("");
    setDescripcion("");
    setError("");
    setFormulario(true);
  };
  const editar = (project: ProyectoApi) => {
    setEdicion(project);
    setTitulo(project.titulo);
    setDescripcion(project.descripcion || "");
    setError("");
    setFormulario(true);
  };
  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (titulo.trim().length < 3 || titulo.trim().length > 255) {
      setError("El título debe tener entre 3 y 255 caracteres.");
      return;
    }
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      if (edicion) {
        await dashboardService.actualizarProyecto(
          edicion.id_proyecto,
          titulo.trim(),
          descripcion.trim(),
        );
        setMensaje("Proyecto actualizado.");
      } else {
        await dashboardService.crearProyecto(titulo.trim(), descripcion.trim());
        setMensaje("Proyecto creado correctamente.");
      }
      await cargar();
      setFormulario(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar el proyecto.",
      );
    } finally {
      setGuardando(false);
    }
  };
  const eliminar = async (project: ProyectoApi) => {
    if (
      !window.confirm(
        `¿Eliminar el proyecto "${project.titulo}"? Solo se permiten borradores sin documentos. Esta acción no puede deshacerse.`,
      )
    )
      return;
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      await dashboardService.eliminarProyecto(project.id_proyecto);
      await cargar();
      setMensaje("Proyecto eliminado.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo eliminar el proyecto.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">
            Mis proyectos
          </h1>
          <p className="mt-1 text-sm text-[var(--cafe)]/70">
            Proyectos creados por ti y su estado actual.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white"
          onClick={nuevo}
        >
          + Nuevo proyecto
        </button>
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
      <div className="overflow-x-auto rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-3 sm:p-5">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-gray-500">
              <th className="p-3">Proyecto</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Creación</th>
              <th className="p-3">Detalles y acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map((project) => (
              <tr key={project.id_proyecto} className="border-b last:border-0">
                <td className="p-3 font-semibold">
                  <Link
                    className="text-[var(--rojo)] underline"
                    to={`/dashboard/proyectos/${project.id_proyecto}`}
                  >
                    {project.titulo}
                  </Link>
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoStyle(project.estado)}`}
                  >
                    {project.estado}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(project.fecha_creacion).toLocaleDateString("es-MX")}
                </td>
                <td className="p-3">
                  <details>
                    <summary className="cursor-pointer font-semibold text-[var(--rojo)]">
                      Ver detalles
                    </summary>
                    <p className="mt-2 max-w-md whitespace-pre-wrap text-sm text-gray-600">
                      {project.descripcion || "Sin descripción."}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Última actualización:{" "}
                      {new Date(project.fecha_actualizacion).toLocaleString(
                        "es-MX",
                      )}
                    </p>
                  </details>
                  {project.estado === "BORRADOR" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={guardando}
                        className="rounded-lg border px-3 py-1 text-[var(--rojo)]"
                        onClick={() => editar(project)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={guardando}
                        className="rounded-lg border px-3 py-1 text-red-700"
                        onClick={() => void eliminar(project)}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!cargando && !proyectos.length && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Aún no has creado proyectos.
                </td>
              </tr>
            )}
            {cargando && (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  Cargando proyectos…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {formulario && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !guardando)
              setFormulario(false);
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-title"
            onSubmit={guardar}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="project-title" className="text-xl font-bold">
              {edicion ? "Editar borrador" : "Nuevo proyecto"}
            </h2>
            <label
              htmlFor="project-name"
              className="mt-5 block text-sm font-semibold"
            >
              Título
            </label>
            <input
              id="project-name"
              className="mt-2 w-full rounded-lg border p-3"
              minLength={3}
              maxLength={255}
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <label
              htmlFor="project-description"
              className="mt-4 block text-sm font-semibold"
            >
              Descripción
            </label>
            <textarea
              id="project-description"
              rows={4}
              className="mt-2 w-full rounded-lg border p-3"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={guardando}
                className="rounded-lg border px-4 py-2"
                onClick={() => setFormulario(false)}
              >
                Cancelar
              </button>
              <button
                disabled={guardando}
                className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {guardando ? "Guardando…" : "Guardar proyecto"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
export default MisProyectos;
