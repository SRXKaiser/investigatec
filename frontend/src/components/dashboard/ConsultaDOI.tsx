import { useState } from "react";
import type { FormEvent } from "react";
import api from "../../services/api";

interface PublicacionDOI {
  doi: string;
  titulo: string;
  revista: string | null;
  anio: number | null;
  autores: string[];
  url: string;
  fuente: string;
}

/** Consulta opcional de publicaciones: API pública Crossref vía FastAPI. */
export default function ConsultaDOI() {
  const [doi, setDoi] = useState("");
  const [resultado, setResultado] = useState<PublicacionDOI | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const consultar = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setResultado(null);
    const valor = doi.trim();
    if (!/^10\.\d{4,9}\/\S+$/i.test(valor) || valor.length > 200) {
      setError("Escribe un DOI válido, por ejemplo 10.1038/nphys1170.");
      return;
    }
    setCargando(true);
    try {
      const { data } = await api.get<PublicacionDOI>("/publicaciones/doi", {
        params: { doi: valor },
      });
      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar Crossref.");
    } finally {
      setCargando(false);
    }
  };
  return (
    <section className="rounded-2xl border-2 border-[var(--cafe)]/50 bg-[var(--bg)] p-4 sm:p-5">
      <h2 className="text-lg font-bold text-[var(--rojo-oscuro)]">Consultar publicación por DOI</h2>
      <p className="mt-1 text-sm text-[var(--cafe)]/75">
        Recupera datos bibliográficos desde Crossref, un servicio externo. No modifica tus documentos.
      </p>
      <form onSubmit={(event) => void consultar(event)} className="mt-3 flex flex-wrap gap-2">
        <label htmlFor="investigatec-doi" className="sr-only">DOI de publicación</label>
        <input
          id="investigatec-doi"
          type="text"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
          maxLength={200}
          placeholder="10.1038/nphys1170"
          className="min-w-[220px] flex-1 rounded-lg border bg-white px-3 py-2 text-sm"
        />
        <button type="submit" disabled={cargando} className="rounded-lg bg-[var(--rojo)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {cargando ? "Buscando…" : "Consultar DOI"}
        </button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
      {resultado && (
        <div role="status" className="mt-3 rounded-lg border bg-white p-3 text-sm">
          <p className="font-bold">{resultado.titulo}</p>
          <p className="mt-1">{resultado.autores.join(", ") || "Autor no disponible"}</p>
          <p className="mt-1">{resultado.revista || "Publicación no disponible"}{resultado.anio ? ` · ${resultado.anio}` : ""}</p>
          <a href={resultado.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block break-all text-[var(--rojo)] underline">
            {resultado.doi}
          </a>
          <p className="mt-1 text-xs text-gray-500">Fuente: {resultado.fuente}</p>
        </div>
      )}
    </section>
  );
}
