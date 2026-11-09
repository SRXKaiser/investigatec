import { useEffect, useState } from "react";
import { Bell, CheckCheck, CircleCheck, Clock3, MailOpen } from "lucide-react";
import { notificacionesService } from "../../services/notificacionesService";
import type { NotificacionApi } from "../../types";

type Filtro = "todas" | "pendientes" | "leidas";
const mensajeError = (e: unknown) =>
  e instanceof Error ? e.message : "No se pudo completar la operación.";

export default function Notificaciones() {
  const [items, setItems] = useState<NotificacionApi[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  useEffect(() => {
    let activa = true;
    notificacionesService
      .listar()
      .then((datos) => {
        if (activa) setItems(datos);
      })
      .catch((e) => {
        if (activa) setError(mensajeError(e));
      })
      .finally(() => {
        if (activa) setLoading(false);
      });
    return () => {
      activa = false;
    };
  }, []);
  const marcarLeida = async (n: NotificacionApi) => {
    setProcesando(true);
    setError("");
    try {
      await notificacionesService.marcarLeida(n.id_notificacion);
      setItems((prev) =>
        prev.map((x) =>
          x.id_notificacion === n.id_notificacion ? { ...x, leida: true } : x,
        ),
      );
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };
  const marcarTodas = async () => {
    setProcesando(true);
    setError("");
    try {
      const pendientes = items.filter((n) => !n.leida);
      const respuestas = await Promise.allSettled(
        pendientes.map((n) =>
          notificacionesService.marcarLeida(n.id_notificacion),
        ),
      );
      const exitosas = new Set(
        pendientes
          .filter((_, i) => respuestas[i].status === "fulfilled")
          .map((n) => n.id_notificacion),
      );
      setItems((prev) =>
        prev.map((n) =>
          exitosas.has(n.id_notificacion) ? { ...n, leida: true } : n,
        ),
      );
      if (respuestas.some((r) => r.status === "rejected"))
        setError("Algunas notificaciones no pudieron marcarse como leídas.");
    } finally {
      setProcesando(false);
    }
  };
  const pendientes = items.filter((n) => !n.leida).length;
  const visibles = items.filter(
    (n) => filtro === "todas" || (filtro === "pendientes" ? !n.leida : n.leida),
  );
  return (
    <section className="mx-auto max-w-6xl space-y-5 text-left text-[var(--cafe)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-pixel text-2xl font-bold text-[var(--rojo-oscuro)] sm:text-3xl">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm opacity-70">
            Avisos asociados únicamente a tu cuenta.
          </p>
        </div>
        {pendientes > 0 && (
          <button
            disabled={procesando}
            onClick={() => void marcarTodas()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--rojo-oscuro)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--rojo-oscuro)] disabled:opacity-50"
          >
            <CheckCheck size={17} /> Marcar todas como leídas
          </button>
        )}
      </div>
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filtrar notificaciones"
      >
        {(
          [
            ["todas", "Todas"],
            ["pendientes", `Sin leer (${pendientes})`],
            ["leidas", "Leídas"],
          ] as const
        ).map(([valor, etiqueta]) => (
          <button
            key={valor}
            aria-pressed={filtro === valor}
            onClick={() => setFiltro(valor)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${filtro === valor ? "border-[var(--rojo-oscuro)] bg-[var(--rojo-oscuro)] text-white" : "border-[var(--cafe)]/40 bg-white text-[var(--cafe)]"}`}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <div className="space-y-3">
        {loading && (
          <p role="status" className="rounded-xl bg-white p-8 text-center">
            Cargando notificaciones…
          </p>
        )}
        {!loading &&
          visibles.map((n) => (
            <article
              key={n.id_notificacion}
              className={`flex items-start gap-3 rounded-2xl border-2 border-[var(--cafe)]/75 bg-[var(--bg)] p-4 shadow-[3px_4px_0_var(--cafe)] sm:gap-4 sm:p-5 ${!n.leida ? "border-l-[6px] border-l-[var(--rojo)]" : ""}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--rojo-oscuro)]/10 text-[var(--rojo-oscuro)]">
                {n.leida ? <CircleCheck size={20} /> : <Bell size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words font-bold text-[var(--cafe)]">
                    {n.titulo}
                  </h2>
                  {!n.leida && (
                    <span className="rounded-full bg-[var(--rojo)] px-2 py-0.5 text-xs font-semibold text-white">
                      Nueva
                    </span>
                  )}
                </div>
                <p className="mt-1 break-words text-sm leading-relaxed text-[var(--cafe)]/80">
                  {n.mensaje}
                </p>
                <time className="mt-2 inline-flex items-center gap-1 text-xs opacity-65">
                  <Clock3 size={13} />
                  {new Date(n.fecha_creacion).toLocaleString("es-MX")}
                </time>
              </div>
              {!n.leida && (
                <button
                  disabled={procesando}
                  title="Marcar como leída"
                  aria-label={`Marcar como leída: ${n.titulo}`}
                  onClick={() => void marcarLeida(n)}
                  className="shrink-0 rounded-xl border border-[var(--cafe)]/40 bg-white p-2 text-[var(--rojo-oscuro)] disabled:opacity-50"
                >
                  <MailOpen size={18} />
                </button>
              )}
            </article>
          ))}
        {!loading && !visibles.length && (
          <div className="rounded-2xl border-2 border-dashed border-[var(--cafe)]/30 bg-[var(--bg)] px-4 py-12 text-center">
            <Bell size={28} className="mx-auto mb-3 opacity-60" />
            <p className="text-sm">No hay notificaciones en esta sección.</p>
          </div>
        )}
      </div>
    </section>
  );
}
