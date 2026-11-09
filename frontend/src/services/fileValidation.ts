/** Reglas verificadas en backend/app/services/archivos.py. */
export const MAX_ARCHIVO_BYTES = 500 * 1024 * 1024;
export const EXTENSIONES_PERMITIDAS = [".pdf", ".docx"] as const;

export function extensionDe(nombre: string): string {
  const lastDot = nombre.lastIndexOf(".");
  return lastDot >= 0 ? nombre.slice(lastDot).toLowerCase() : "";
}

export function validarArchivo(
  file: File,
  nombreAnterior?: string,
): string | null {
  if (!file.name || file.name.length > 255)
    return "El nombre del archivo debe tener máximo 255 caracteres.";
  if (!EXTENSIONES_PERMITIDAS.some((ext) => ext === extensionDe(file.name))) {
    return "Solo se permiten documentos PDF o DOCX.";
  }
  if (file.size === 0) return "No se permiten archivos vacíos.";
  if (file.size > MAX_ARCHIVO_BYTES)
    return "El archivo supera el límite de 500 MB.";
  if (
    nombreAnterior &&
    extensionDe(file.name) !== extensionDe(nombreAnterior)
  ) {
    return `La nueva versión debe conservar el formato ${extensionDe(nombreAnterior).toUpperCase()}.`;
  }
  return null;
}
