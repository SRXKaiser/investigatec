interface ResumenDocumentoProps {
  resumen?: string | null;
  etiqueta?: string;
}

/** Muestra el texto extraído del documento, sin generarlo ni modificarlo. */
export default function ResumenDocumento({
  resumen,
  etiqueta = "Ver resumen",
}: ResumenDocumentoProps) {
  const contenido = resumen?.trim();

  return (
    <details className="mt-3 rounded-lg border border-[var(--cafe)]/30 bg-[var(--bg2)]/60 p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-[var(--rojo-oscuro)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rojo)]">
        {etiqueta}
      </summary>
      {contenido ? (
        <div className="mt-3 space-y-2 border-t border-[var(--cafe)]/20 pt-3">
          <p className="text-xs text-[var(--cafe)]/70">
            Resumen extraído automáticamente del documento original.
          </p>
          <p className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed text-[var(--cafe)]">
            {contenido}
          </p>
        </div>
      ) : (
        <p className="mt-3 border-t border-[var(--cafe)]/20 pt-3 text-[var(--cafe)]/80">
          No se detectó una sección de resumen en esta versión del documento.
        </p>
      )}
    </details>
  );
}
