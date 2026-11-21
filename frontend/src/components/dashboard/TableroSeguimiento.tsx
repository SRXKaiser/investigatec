import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Columns3,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { dashboardService } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import type { ProyectoApi } from "../../types";

const COLUMNAS = [
  {
    estado: "BORRADOR",
    titulo: "Borradores",
    acento: "border-slate-400",
    etiqueta: "bg-slate-100 text-slate-700",
  },
  {
    estado: "PENDIENTE",
    titulo: "En revisión",
    acento: "border-amber-500",
    etiqueta: "bg-amber-100 text-amber-900",
  },
  {
    estado: "CORRECCIONES",
    titulo: "Con correcciones",
    acento: "border-red-500",
    etiqueta: "bg-red-100 text-red-800",
  },
  {
    estado: "APROBADO",
    titulo: "Aprobados",
    acento: "border-green-600",
    etiqueta: "bg-green-100 text-green-800",
  },
] as const;

type Orden = "actualizados" | "antiguos" | "nombre";

const fecha = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Sin fecha"
    : parsed.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export default function TableroSeguimiento() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoApi[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [soloMios, setSoloMios] = useState(false);
  const [orden, setOrden] = useState<Orden>("actualizados");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [refresco, setRefresco] = useState(0);

  const cargar = useCallback(async (isActive: () => boolean) => {
    setCargando(true);
    setError("");
    try {
      // Este endpoint ya aplica permisos: no consultar proyectos ocultos de otras cuentas.
      const resultado = await dashboardService.proyectos();
      if (isActive()) setProyectos(resultado);
    } catch (e) {
      if (isActive())
        setError(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar los proyectos.",
        );
    } finally {
      if (isActive()) setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    void cargar(() => activo);
    return () => {
      activo = false;
    };
  }, [cargar, refresco]);

  const filtrados = useMemo(() => {
    const query = busqueda.trim().toLocaleLowerCase("es-MX");
    return proyectos
      .filter(
        (proyecto) =>
          (!soloMios || proyecto.id_usuario === user?.id_usuario) &&
          (!query ||
            `${proyecto.titulo} ${proyecto.descripcion || ""} ${proyecto.id_proyecto}`
              .toLocaleLowerCase("es-MX")
              .includes(query)),
      )
      .sort((a, b) => {
        if (orden === "nombre") return a.titulo.localeCompare(b.titulo, "es");
        const diff =
          new Date(b.fecha_actualizacion).getTime() -
          new Date(a.fecha_actualizacion).getTime();
        return orden === "antiguos" ? -diff : diff;
      });
  }, [busqueda, proyectos, soloMios, orden, user?.id_usuario]);

  const columnas = COLUMNAS.map((columna) => ({
    ...columna,
    proyectos: filtrados.filter((p) => p.estado === columna.estado),
  }));
  const otros = filtrados.filter(
    (p) => !COLUMNAS.some((c) => c.estado === p.estado),
  );

  const tarjeta = (proyecto: ProyectoApi) => (
    <Link
      key={proyecto.id_proyecto}
      to={`/dashboard/proyectos/${proyecto.id_proyecto}`}
      className="group block rounded-xl border border-[var(--cafe)]/20 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--rojo)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rojo)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 break-words text-sm font-bold leading-snug text-[var(--rojo-oscuro)]">
          {proyecto.titulo}
        </h3>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-[var(--cafe)]/60 group-hover:text-[var(--rojo)]"
          aria-hidden="true"
        />
      </div>
      {proyecto.descripcion && (
        <p className="mt-2 line-clamp-3 break-words text-xs leading-relaxed text-[var(--cafe)]/75">
          {proyecto.descripcion}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-1 border-t border-[var(--cafe)]/10 pt-2 text-[11px] text-[var(--cafe)]/70">
        <span>#{proyecto.id_proyecto}</span>
        <span title="Última actualización">
          {fecha(proyecto.fecha_actualizacion)}
        </span>
      </div>
    </Link>
  );

  return (
    <section
      className="space-y-5 text-[var(--cafe)]"
      aria-labelledby="titulo-tablero"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Columns3
              className="text-[var(--rojo)]"
              size={24}
              aria-hidden="true"
            />
            <h1
              id="titulo-tablero"
              className="font-pixel text-2xl font-bold text-[var(--rojo-oscuro)]"
            >
              Tablero de seguimiento
            </h1>
          </div>
          <p className="mt-2 text-sm opacity-75">
            Consulta el avance de los proyectos según su estado de revisión.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefresco((n) => n + 1)}
          disabled={cargando}
          className="flex items-center gap-2 rounded-xl border-2 border-[var(--cafe)]/50 bg-[var(--bg)] px-4 py-2 text-sm font-semibold hover:border-[var(--rojo)] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={cargando ? "animate-spin" : ""}
            aria-hidden="true"
          />{" "}
          Actualizar
        </button>
      </header>

      <div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumen de estados"
      >
        {COLUMNAS.map((c) => (
          <div
            key={c.estado}
            className={`rounded-xl border-l-4 ${c.acento} bg-[var(--bg)] p-4 shadow-sm`}
          >
            <p className="text-xs font-medium opacity-70">{c.titulo}</p>
            <p
              className="mt-1 text-2xl font-bold text-[var(--rojo-oscuro)]"
              aria-label={`${c.titulo}: ${proyectos.filter((p) => p.estado === c.estado).length}`}
            >
              {proyectos.filter((p) => p.estado === c.estado).length}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-[var(--cafe)]/50 bg-[var(--bg)] p-3 sm:p-4">
        <label className="relative min-w-[180px] flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
            aria-hidden="true"
          />
          <span className="sr-only">Buscar proyectos</span>
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre, descripción o número"
            className="w-full rounded-lg border border-[var(--cafe)]/30 bg-white py-2 pl-10 pr-3 text-sm outline-offset-2 focus:outline-[var(--rojo)]"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <SlidersHorizontal size={16} aria-hidden="true" /> Orden:
          <select
            value={orden}
            onChange={(event) => setOrden(event.target.value as Orden)}
            className="rounded-lg border border-[var(--cafe)]/30 bg-white px-2 py-2"
          >
            <option value="actualizados">Recientes</option>
            <option value="antiguos">Antiguos</option>
            <option value="nombre">Nombre A–Z</option>
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloMios}
            onChange={(event) => setSoloMios(event.target.checked)}
            className="accent-[var(--rojo)]"
          />
          Solo mis proyectos
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}{" "}
          <button
            className="ml-2 font-bold underline"
            type="button"
            onClick={() => setRefresco((n) => n + 1)}
          >
            Reintentar
          </button>
        </div>
      )}
      {cargando && (
        <p role="status" className="rounded-xl bg-[var(--bg)] p-4 text-sm">
          Cargando proyectos…
        </p>
      )}
      {!cargando && !error && filtrados.length === 0 && (
        <p
          role="status"
          className="rounded-xl border border-[var(--cafe)]/30 bg-[var(--bg)] p-6 text-center text-sm"
        >
          No hay proyectos que coincidan con estos filtros.
        </p>
      )}
      {!cargando && !error && (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columnas.map((columna) => (
            <section
              key={columna.estado}
              aria-label={columna.titulo}
              className={`min-w-0 rounded-2xl border-2 border-b-4 border-[var(--cafe)]/60 ${columna.acento} bg-[var(--bg)] p-3`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[var(--rojo-oscuro)]">
                  {columna.titulo}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${columna.etiqueta}`}
                >
                  {columna.proyectos.length}
                </span>
              </div>
              <div className="space-y-3">
                {columna.proyectos.map(tarjeta)}
                {columna.proyectos.length === 0 && (
                  <p className="rounded-lg border border-dashed border-[var(--cafe)]/25 p-3 text-center text-xs opacity-60">
                    Sin proyectos
                  </p>
                )}
              </div>
            </section>
          ))}
          {otros.length > 0 && (
            <section
              aria-label="Otros estados"
              className="min-w-0 rounded-2xl border-2 border-b-4 border-[var(--cafe)]/60 bg-[var(--bg)] p-3"
            >
              <h2 className="mb-3 text-sm font-bold">
                Otros estados ({otros.length})
              </h2>
              <div className="space-y-3">{otros.map(tarjeta)}</div>
            </section>
          )}
        </div>
      )}
      <p className="text-xs opacity-60">
        Se muestran únicamente proyectos a los que tu cuenta tiene acceso. Los
        estados se actualizan mediante el proceso de revisión documental.
      </p>
    </section>
  );
}
