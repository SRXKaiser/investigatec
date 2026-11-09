import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { dashboardService } from "../../services/dashboardService";
import type { SeguimientoProyectoApi } from "../../services/dashboardService";
import type { ProyectoApi } from "../../types";
import ResumenDocumento from "./ResumenDocumento";

type Cambio = {
  id_historial: number;
  estado_anterior: string | null;
  estado_nuevo: string;
  id_usuario: number;
  fecha_cambio: string;
};
const fecha = (value?: string | null) =>
  value ? new Date(value).toLocaleString("es-MX") : "—";
const panel =
  "rounded-2xl border-2 border-[var(--cafe)]/70 bg-[var(--bg)] p-4 sm:p-6";
export default function DetalleProyecto() {
  const { idProyecto } = useParams();
  const id = Number(idProyecto);
  const [proyecto, setProyecto] = useState<ProyectoApi | null>(null);
  const [seguimiento, setSeguimiento] = useState<SeguimientoProyectoApi | null>(
    null,
  );
  const [historial, setHistorial] = useState<Cambio[]>([]);
  const [error, setError] = useState("");
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState<number | null>(null);
  const [descargaError, setDescargaError] = useState("");
  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError("");
    setProyecto(null);
    setSeguimiento(null);
    setHistorial([]);
    setAdvertencias([]);
    if (!Number.isSafeInteger(id) || id < 1) {
      setError("Identificador de proyecto inválido.");
      setCargando(false);
      return;
    }
    dashboardService
      .obtenerProyecto(id)
      .then(async (p) => {
        if (!activo) return;
        setProyecto(p);
        const [seg, hist] = await Promise.allSettled([
          dashboardService.seguimientoProyecto(id),
          dashboardService.historialProyecto(id),
        ]);
        if (!activo) return;
        if (seg.status === "fulfilled") setSeguimiento(seg.value);
        if (hist.status === "fulfilled") setHistorial(hist.value);
        const avisos: string[] = [];
        if (seg.status === "rejected")
          avisos.push(
            "No fue posible consultar los documentos o sus revisiones para este usuario.",
          );
        if (hist.status === "rejected")
          avisos.push("No fue posible consultar los cambios de estado.");
        setAdvertencias(avisos);
      })
      .catch((e) => {
        if (activo)
          setError(
            e instanceof Error
              ? e.message
              : "No se puede consultar el proyecto.",
          );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);
  const descargar = async (archivo: number, nombre: string) => {
    setDescargaError("");
    setDescargando(archivo);
    try {
      await dashboardService.descargarArchivo(archivo, nombre);
    } catch (e) {
      setDescargaError(
        e instanceof Error ? e.message : "No se pudo descargar el archivo.",
      );
    } finally {
      setDescargando(null);
    }
  };
  return (
    <section className="mx-auto max-w-6xl space-y-5 text-[var(--cafe)]">
      <div>
        <h1 className="font-pixel text-2xl text-[var(--rojo-oscuro)]">
          Detalle del proyecto
        </h1>
        <p className="mt-2 text-sm">
          Documentos, versiones y resultados de revisión del proyecto.
        </p>
      </div>
      {cargando && <p role="status">Cargando proyecto…</p>}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {proyecto && (
        <>
          <section className={panel}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-xl font-bold break-words">
                {proyecto.titulo}
              </h2>
              <span className="rounded-full border px-3 py-1 text-sm">
                {proyecto.estado}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm">
              {proyecto.descripcion || "Sin descripción."}
            </p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <strong>Propietario:</strong>{" "}
                <Link
                  to={`/dashboard/perfiles/${proyecto.id_usuario}`}
                  className="underline"
                >
                  Usuario #{proyecto.id_usuario}
                </Link>
              </p>
              <p>
                <strong>ID de proyecto:</strong> {proyecto.id_proyecto}
              </p>
              <p>
                <strong>Creado:</strong> {fecha(proyecto.fecha_creacion)}
              </p>
              <p>
                <strong>Actualizado:</strong>{" "}
                {fecha(proyecto.fecha_actualizacion)}
              </p>
            </div>
          </section>
          {advertencias.map((aviso) => (
            <p
              role="status"
              key={aviso}
              className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
            >
              {aviso}
            </p>
          ))}
          {descargaError && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
            >
              {descargaError}
            </p>
          )}
          <section className={panel}>
            <h2 className="mb-3 text-lg font-bold">Documentos y versiones</h2>
            {seguimiento ? (
              seguimiento.documentos.length ? (
                <div className="space-y-4">
                  {seguimiento.documentos.map((doc) => (
                    <article
                      key={doc.id_documento}
                      className="rounded-xl border bg-white/70 p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <h3 className="font-semibold break-words">
                          {doc.nombre_documento}
                        </h3>
                        <span className="text-sm">Estado: {doc.estado}</span>
                      </div>
                      <div className="mt-3 space-y-3">
                        {doc.versiones.map((version) => (
                          <div
                            key={version.id_archivo}
                            className="rounded-lg border p-3 text-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <strong>Versión {version.version}</strong> ·{" "}
                                {version.nombre_original} ·{" "}
                                {fecha(version.fecha_subida)}
                                <p className="mt-1">{version.estado}</p>
                              </div>
                              <button
                                disabled={descargando !== null}
                                onClick={() =>
                                  void descargar(
                                    version.id_archivo,
                                    version.nombre_original,
                                  )
                                }
                                className="rounded-lg border border-[var(--rojo)] px-3 py-1.5 text-[var(--rojo-oscuro)] disabled:opacity-50"
                              >
                                {descargando === version.id_archivo
                                  ? "Descargando…"
                                  : "Descargar"}
                              </button>
                            </div>
                            <ResumenDocumento resumen={version.resumen_detectado} />
                            {version.revisiones?.length ? (
                              <ul className="mt-3 space-y-2 border-t pt-3">
                                {version.revisiones.map((rev) => (
                                  <li
                                    key={rev.id_revision}
                                    className="rounded-lg bg-[var(--bg2)] p-3"
                                  >
                                    <strong>
                                      Revisión #{rev.id_revision}:
                                    </strong>{" "}
                                    {rev.estado}
                                    {rev.fecha_revision &&
                                      ` · ${fecha(rev.fecha_revision)}`}
                                    {rev.observaciones && (
                                      <p className="mt-1 whitespace-pre-wrap">
                                        Observaciones: {rev.observaciones}
                                      </p>
                                    )}
                                    {rev.decision && (
                                      <p className="mt-1 whitespace-pre-wrap">
                                        Decisión: {rev.decision.resultado} ·{" "}
                                        {rev.decision.comentario ||
                                          "Sin comentario"}{" "}
                                        · {fecha(rev.decision.fecha_decision)}
                                      </p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-xs opacity-70">
                                Sin revisiones asociadas a esta versión.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm opacity-70">
                  Este proyecto todavía no tiene documentos.
                </p>
              )
            ) : (
              <p className="text-sm opacity-70">
                No hay datos de seguimiento disponibles.
              </p>
            )}
          </section>
          <section className={panel}>
            <h2 className="mb-3 text-lg font-bold">
              Historial de estados del proyecto
            </h2>
            <p className="mb-3 text-xs opacity-70">
              Consulta los cambios de estado y las observaciones asociadas a las
              versiones de los documentos.
            </p>
            {historial.length ? (
              <ol className="space-y-3">
                {historial.map((cambio) => (
                  <li
                    key={cambio.id_historial}
                    className="rounded-lg border bg-white/60 p-3 text-sm"
                  >
                    <strong>
                      {cambio.estado_anterior || "Inicio"} →{" "}
                      {cambio.estado_nuevo}
                    </strong>
                    <p className="mt-1">
                      {fecha(cambio.fecha_cambio)} · Usuario #
                      {cambio.id_usuario}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm opacity-70">
                Sin cambios de estado disponibles.
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
