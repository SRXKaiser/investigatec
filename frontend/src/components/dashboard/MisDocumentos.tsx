import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  dashboardService,
  type DocumentoSeguimientoApi,
} from "../../services/dashboardService";
import { validarArchivo } from "../../services/fileValidation";
import type { ProyectoApi } from "../../types";

interface DocumentoFila extends DocumentoSeguimientoApi {
  proyectoId: number;
  proyecto: string;
}
const badgeColor = (status: string) =>
  ({
    APROBADO: "bg-green-100 text-green-800",
    PENDIENTE: "bg-amber-100 text-amber-800",
    CORRECCIONES: "bg-red-100 text-red-800",
    BORRADOR: "bg-gray-100 text-gray-700",
  })[status] ?? "bg-gray-100 text-gray-700";

const MisDocumentos = () => {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoApi[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoFila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [modo, setModo] = useState<"nuevo" | "version">("nuevo");
  const [idProyecto, setIdProyecto] = useState("");
  const [idDocumento, setIdDocumento] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [accion, setAccion] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!user) return;
    const [allProjects, seguimientos] = await Promise.all([
      dashboardService.proyectos(),
      dashboardService.seguimientoMisProyectos(),
    ]);
    setProyectos(
      allProjects.filter((project) => project.id_usuario === user.id_usuario),
    );
    setDocumentos(
      seguimientos.flatMap((result) =>
        result.documentos.map((document) => ({
          ...document,
          proyectoId: result.id_proyecto,
          proyecto: result.titulo,
        })),
      ),
    );
  }, [user?.id_usuario]);

  useEffect(() => {
    let active = true;
    setCargando(true);
    void Promise.all([
      dashboardService.proyectos(),
      dashboardService.seguimientoMisProyectos(),
    ])
      .then(([allProjects, seguimiento]) => {
        if (!active) return;
        setProyectos(
          allProjects.filter(
            (project) => project.id_usuario === user?.id_usuario,
          ),
        );
        setDocumentos(
          seguimiento.flatMap((result) =>
            result.documentos.map((doc) => ({
              ...doc,
              proyectoId: result.id_proyecto,
              proyecto: result.titulo,
            })),
          ),
        );
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudieron cargar tus documentos.",
          );
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id_usuario]);

  const seleccionada = useMemo(
    () => documentos.find((doc) => doc.id_documento === Number(idDocumento)),
    [documentos, idDocumento],
  );
  const abrirNuevo = () => {
    setModo("nuevo");
    setIdProyecto(proyectos[0] ? String(proyectos[0].id_proyecto) : "");
    setArchivo(null);
    setError("");
    setUploadOpen(true);
  };
  const abrirVersion = (doc: DocumentoFila) => {
    setModo("version");
    setIdDocumento(String(doc.id_documento));
    setArchivo(null);
    setError("");
    setUploadOpen(true);
  };

  const guardarArchivo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!archivo) {
      setError("Selecciona un archivo PDF o DOCX.");
      return;
    }
    const projectId =
      modo === "nuevo" ? Number(idProyecto) : seleccionada?.proyectoId;
    if (
      !projectId ||
      !proyectos.some((project) => project.id_proyecto === projectId)
    ) {
      setError("Selecciona un proyecto propio.");
      return;
    }
    const mensajeValidacion = validarArchivo(
      archivo,
      modo === "version" ? seleccionada?.nombre_documento : undefined,
    );
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      if (modo === "version") {
        if (!seleccionada?.id_archivo_actual)
          throw new Error("No se encontró la última versión.");
        await dashboardService.subirVersion(
          seleccionada.id_archivo_actual,
          archivo,
        );
      } else {
        await dashboardService.subirArchivo(projectId, archivo);
      }
      setArchivo(null);
      setUploadOpen(false);
      setIdDocumento("");
      await cargar();
      setMensaje(
        modo === "version"
          ? "Nueva versión cargada."
          : "Documento cargado. Puedes enviarlo a revisión.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cargar el documento.",
      );
    } finally {
      setOcupado(false);
    }
  };

  const descargar = async (idArchivo: number, nombre: string) => {
    setError("");
    try {
      await dashboardService.descargarArchivo(idArchivo, nombre);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo descargar el archivo.",
      );
    }
  };
  const enviar = async (doc: DocumentoFila) => {
    if (!doc.id_archivo_actual) return;
    if (
      !window.confirm(
        `¿Enviar a revisión la versión ${doc.version_actual} de "${doc.nombre_documento}"?`,
      )
    )
      return;
    setAccion(doc.id_documento);
    setError("");
    setMensaje("");
    try {
      await dashboardService.enviarRevision(doc.id_archivo_actual);
      await cargar();
      setMensaje("Documento enviado al revisor asignado.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo enviar a revisión.",
      );
    } finally {
      setAccion(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">
            Mis documentos
          </h1>
          <p className="mt-1 text-sm text-[var(--cafe)]/70">
            Carga PDF/DOCX, consulta todas sus versiones y envíalos a revisión.
          </p>
        </div>
        <button
          disabled={!proyectos.length}
          className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          onClick={abrirNuevo}
        >
          + Subir documento
        </button>
      </div>
      {!cargando && !proyectos.length && (
        <p className="text-sm text-amber-800">
          Primero crea un proyecto desde «Mis proyectos».
        </p>
      )}
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
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-gray-500">
              <th className="p-3">Documento</th>
              <th className="p-3">Proyecto</th>
              <th className="p-3">Versión</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones / historial</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((doc) => (
              <tr
                key={`${doc.proyectoId}-${doc.id_documento}`}
                className="border-b last:border-0"
              >
                <td className="p-3 font-semibold">{doc.nombre_documento}</td>
                <td className="p-3">{doc.proyecto}</td>
                <td className="p-3">v{doc.version_actual}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColor(doc.estado)}`}
                  >
                    {doc.estado}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {doc.id_archivo_actual && (
                      <button
                        className="rounded-lg border px-3 py-1.5 text-[var(--rojo)]"
                        onClick={() =>
                          void descargar(
                            doc.id_archivo_actual!,
                            doc.nombre_documento,
                          )
                        }
                      >
                        Descargar
                      </button>
                    )}
                    {doc.id_archivo_actual && doc.estado === "BORRADOR" && (
                      <button
                        disabled={accion === doc.id_documento}
                        className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
                        onClick={() => void enviar(doc)}
                      >
                        {accion === doc.id_documento
                          ? "Enviando…"
                          : "Enviar a revisión"}
                      </button>
                    )}
                    {(doc.estado === "CORRECCIONES" ||
                      doc.estado === "BORRADOR") && (
                      <button
                        className="rounded-lg border px-3 py-1.5"
                        onClick={() => abrirVersion(doc)}
                      >
                        Subir nueva versión
                      </button>
                    )}
                    <details className="rounded-lg border px-3 py-1.5">
                      <summary className="cursor-pointer font-semibold text-[var(--rojo)]">
                        Versiones e historial
                      </summary>
                      <div className="mt-2 min-w-56 space-y-3 text-xs text-gray-700">
                        {doc.versiones.map((version) => (
                          <div
                            key={version.id_archivo}
                            className="border-t pt-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <strong>
                                v{version.version} · {version.estado}
                              </strong>
                              <button
                                className="text-[var(--rojo)] underline"
                                onClick={() =>
                                  void descargar(
                                    version.id_archivo,
                                    version.nombre_original,
                                  )
                                }
                              >
                                Descargar
                              </button>
                            </div>
                            <p>
                              {new Date(
                                version.fecha_subida,
                              ).toLocaleDateString("es-MX")}
                            </p>
                            {version.revisiones?.map((revision) => (
                              <div
                                key={revision.id_revision}
                                className="mt-2 rounded bg-gray-100 p-2"
                              >
                                <strong>Revisión: {revision.estado}</strong>
                                <p>
                                  {revision.decision?.comentario ||
                                    revision.observaciones ||
                                    "Sin observaciones."}
                                </p>
                                {revision.fecha_revision && (
                                  <time>
                                    {new Date(
                                      revision.fecha_revision,
                                    ).toLocaleDateString("es-MX")}
                                  </time>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </td>
              </tr>
            ))}
            {!cargando && !documentos.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No hay documentos cargados en tus proyectos.
                </td>
              </tr>
            )}
            {cargando && (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  Cargando documentos…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {uploadOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !ocupado) setUploadOpen(false);
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            onSubmit={guardarArchivo}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="upload-title" className="text-xl font-bold">
              {modo === "nuevo" ? "Subir documento" : "Cargar nueva versión"}
            </h2>
            {modo === "nuevo" ? (
              <>
                <label
                  htmlFor="upload-project"
                  className="mt-5 block text-sm font-semibold"
                >
                  Proyecto
                </label>
                <select
                  id="upload-project"
                  required
                  className="mt-2 w-full rounded-lg border p-3"
                  value={idProyecto}
                  onChange={(e) => setIdProyecto(e.target.value)}
                >
                  <option value="">Selecciona un proyecto</option>
                  {proyectos.map((project) => (
                    <option
                      key={project.id_proyecto}
                      value={project.id_proyecto}
                    >
                      {project.titulo}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
                <strong>Documento:</strong> {seleccionada?.nombre_documento}
                <p>
                  <strong>Proyecto:</strong> {seleccionada?.proyecto}
                </p>
              </div>
            )}
            <label
              htmlFor="upload-file"
              className="mt-5 block text-sm font-semibold"
            >
              Archivo PDF o DOCX (máximo 500 MB)
            </label>
            <input
              id="upload-file"
              required
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-2 w-full rounded-lg border p-3"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
            {archivo && (
              <p className="mt-2 text-xs text-gray-600">
                {archivo.name} · {(archivo.size / 1048576).toFixed(2)} MB
              </p>
            )}
            {error && (
              <p role="alert" className="mt-2 text-sm text-red-800">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={ocupado}
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
                onClick={() => setUploadOpen(false)}
              >
                Cancelar
              </button>
              <button
                disabled={
                  ocupado || !archivo || (modo === "version" && !seleccionada)
                }
                className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {ocupado ? "Cargando archivo…" : "Cargar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
export default MisDocumentos;
