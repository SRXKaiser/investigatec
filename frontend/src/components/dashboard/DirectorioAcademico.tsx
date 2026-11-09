import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Search, UserRound, Users } from "lucide-react";
import { perfilService } from "../../services/perfilService";
import type {
  PerfilDirectorioApi,
  DirectorioRespuestaApi,
} from "../../services/perfilService";

const POR_PAGINA = 12;

/** La fotografía está protegida por JWT; nunca usar su ruta directamente en <img>. */
function FotoPerfil({ perfil }: { perfil: PerfilDirectorioApi }) {
  const [urlFoto, setUrlFoto] = useState<string | null>(null);
  useEffect(() => {
    let vigente = true;
    let creada: string | null = null;
    setUrlFoto(null);
    if (perfil.foto_perfil) {
      perfilService
        .foto(perfil.foto_perfil)
        .then((url) => {
          creada = url;
          if (vigente) setUrlFoto(url);
          else URL.revokeObjectURL(url);
        })
        .catch(() => {
          if (vigente) setUrlFoto(null);
        });
    }
    return () => {
      vigente = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [perfil.foto_perfil]);
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--cafe)]/60 bg-white text-[var(--cafe)]">
      {urlFoto ? (
        <img
          src={urlFoto}
          alt={`Fotografía de ${perfil.nombre_publico || perfil.username}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound aria-hidden="true" size={30} />
      )}
    </div>
  );
}

export default function DirectorioAcademico() {
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [respuesta, setRespuesta] = useState<DirectorioRespuestaApi | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    perfilService
      .directorio(busqueda, POR_PAGINA, pagina * POR_PAGINA)
      .then((datos) => {
        if (vigente) setRespuesta(datos);
      })
      .catch((e) => {
        if (vigente) {
          setRespuesta(null);
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo cargar el directorio académico.",
          );
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [busqueda, pagina, intento]);

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPagina(0);
    setBusqueda(texto.trim());
  }

  const total = respuesta?.total ?? 0;
  const inicio = pagina * POR_PAGINA + 1;
  const fin = Math.min((pagina + 1) * POR_PAGINA, total);
  const ultimaPagina = Math.max(0, Math.ceil(total / POR_PAGINA) - 1);
  return (
    <section className="mx-auto max-w-6xl space-y-6 text-[var(--cafe)]">
      <div className="space-y-2">
        <h1 className="font-pixel text-2xl sm:text-3xl text-[var(--rojo-oscuro)]">
          Directorio académico
        </h1>
        <p className="text-sm sm:text-base opacity-80">
          Encuentra investigadores y revisores con perfil público en
          InvestigaTec.
        </p>
      </div>

      <form
        onSubmit={buscar}
        role="search"
        className="flex flex-col gap-3 rounded-2xl border-2 border-[var(--cafe)]/70 bg-[var(--bg)] p-4 sm:flex-row sm:items-end"
      >
        <label
          className="flex-1 space-y-1 text-sm font-semibold"
          htmlFor="buscar-perfil"
        >
          Buscar por nombre, usuario, institución o especialidad
          <div className="flex items-center gap-2 rounded-xl border border-[var(--cafe)]/40 bg-white px-3 py-2">
            <Search
              className="h-5 w-5 shrink-0 opacity-60"
              aria-hidden="true"
            />
            <input
              id="buscar-perfil"
              maxLength={100}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej. Revisor2"
              className="w-full min-w-0 bg-transparent py-1 font-normal text-[var(--cafe)] outline-none"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={cargando}
          className="rounded-xl bg-[var(--rojo-oscuro)] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p role="status" aria-live="polite">
          {cargando
            ? "Consultando perfiles públicos…"
            : error
              ? "No se pudo consultar el directorio."
              : `${total} perfil${total === 1 ? "" : "es"} público${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`}
        </p>
        {busqueda && (
          <button
            type="button"
            onClick={() => {
              setTexto("");
              setBusqueda("");
              setPagina(0);
            }}
            className="underline underline-offset-2"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800"
        >
          <p>{error}</p>
          <button
            type="button"
            className="mt-2 underline"
            onClick={() => setIntento((valor) => valor + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && total === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--cafe)]/30 bg-[var(--bg)] px-5 py-10 text-center">
          <Users size={38} aria-hidden="true" />
          <p className="font-semibold">
            No encontramos perfiles públicos para esta búsqueda.
          </p>
          <p className="text-sm opacity-70">
            Solo aparecen los perfiles visibles de cuentas activas.
          </p>
        </div>
      )}

      {!error && respuesta && respuesta.resultados.length > 0 && (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy={cargando}
        >
          {respuesta.resultados.map((perfil) => (
            <article
              key={perfil.id_usuario}
              className="flex min-w-0 flex-col rounded-2xl border-2 border-[var(--cafe)]/70 bg-[var(--bg)] p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <FotoPerfil perfil={perfil} />
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-lg font-bold">
                    {perfil.nombre_publico || perfil.username}
                  </h2>
                  <p className="break-all text-sm opacity-70">
                    @{perfil.username}
                  </p>
                </div>
              </div>
              <dl className="mt-4 flex-1 space-y-2 text-sm">
                <div>
                  <dt className="font-semibold">Institución</dt>
                  <dd className="break-words opacity-80">
                    {perfil.institucion || "No especificada"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Especialidad</dt>
                  <dd className="break-words opacity-80">
                    {perfil.especialidad || "No especificada"}
                  </dd>
                </div>
              </dl>
              <Link
                to={`/dashboard/perfiles/${perfil.id_usuario}`}
                className="mt-5 block rounded-xl bg-[var(--rojo-oscuro)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
                aria-label={`Ver perfil de ${perfil.nombre_publico || perfil.username}`}
              >
                Ver perfil
              </Link>
            </article>
          ))}
        </div>
      )}

      {!error && total > POR_PAGINA && (
        <nav
          aria-label="Páginas del directorio"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--bg)] p-3 text-sm"
        >
          <span>
            Mostrando {inicio}–{fin} de {total}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={cargando || pagina === 0}
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--cafe)] px-3 py-2 disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Anterior
            </button>
            <span>
              Página {pagina + 1} de {ultimaPagina + 1}
            </span>
            <button
              type="button"
              disabled={cargando || pagina >= ultimaPagina}
              onClick={() => setPagina((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--cafe)] px-3 py-2 disabled:opacity-40"
            >
              Siguiente <ArrowRight size={16} />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
