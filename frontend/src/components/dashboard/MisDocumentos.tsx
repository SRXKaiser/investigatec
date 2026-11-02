import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService, type DocumentoSeguimientoApi } from '../../services/dashboardService';
import type { ProyectoApi } from '../../types';

interface DocumentoFila extends DocumentoSeguimientoApi { proyectoId: number; proyecto: string; }
const badgeColor = (status: string) => ({ APROBADO: 'bg-green-100 text-green-800', PENDIENTE: 'bg-amber-100 text-amber-800', CORRECCIONES: 'bg-red-100 text-red-800' }[status] ?? 'bg-gray-100 text-gray-700');

const MisDocumentos = () => {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoApi[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoFila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [modo, setModo] = useState<'nuevo' | 'version'>('nuevo');
  const [idProyecto, setIdProyecto] = useState('');
  const [idDocumento, setIdDocumento] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [accion, setAccion] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!user) return;
    const allProjects = (await dashboardService.proyectos()).filter(project => project.id_usuario === user.id_usuario);
    const seguimiento = await Promise.all(allProjects.map(project => dashboardService.seguimientoProyecto(project.id_proyecto)));
    setProyectos(allProjects);
    setDocumentos(seguimiento.flatMap(result => result.documentos.map(document => ({ ...document, proyectoId: result.id_proyecto, proyecto: result.titulo }))));
  }, [user]);
  useEffect(() => { void cargar().catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar tus documentos.')).finally(() => setCargando(false)); }, [cargar]);
  const seleccionada = useMemo(() => documentos.find(document => document.id_documento === Number(idDocumento)), [documentos, idDocumento]);

  const guardarArchivo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!archivo) { setError('Selecciona un archivo PDF o DOCX.'); return; }
    const projectId = modo === 'nuevo' ? Number(idProyecto) : seleccionada?.proyectoId;
    if (!projectId) { setError('Selecciona un proyecto o documento.'); return; }
    setOcupado(true); setError('');
    try {
      if (modo === 'version') {
        if (!seleccionada?.id_archivo_actual) throw new Error('No se encontró la versión actual del documento.');
        await dashboardService.subirVersion(seleccionada.id_archivo_actual, archivo);
      } else await dashboardService.subirArchivo(projectId, archivo);
      setArchivo(null); setUploadOpen(false); setIdDocumento(''); await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar el documento.'); }
    finally { setOcupado(false); }
  };

  const abrirVersion = (document: DocumentoFila) => {
    setModo('version'); setIdDocumento(String(document.id_documento)); setArchivo(null); setUploadOpen(true);
  };
  const abrirNuevo = () => { setModo('nuevo'); setIdProyecto(proyectos[0] ? String(proyectos[0].id_proyecto) : ''); setArchivo(null); setUploadOpen(true); };
  const enviar = async (document: DocumentoFila) => {
    if (!document.id_archivo_actual) return;
    setAccion(document.id_documento); setError('');
    try { await dashboardService.enviarRevision(document.id_archivo_actual); await cargar(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo enviar a revisión.'); }
    finally { setAccion(null); }
  };

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">Mis documentos</h1>
        <p className="mt-1 text-sm text-[var(--cafe)]/70">
          Carga documentos a tus proyectos, consulta sus versiones y envialos a revisión.
        </p></div><button disabled={!proyectos.length}
          className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white disabled:opacity-50"
          onClick={abrirNuevo}>+ Subir documento</button
      ></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="overflow-x-auto rounded-2xl border-2 border-r-4 border-b-4 border-[var(--cafe)] bg-[var(--bg)] p-5">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-gray-500">
            <th className="p-3">Documento</th>
            <th className="p-3">Proyecto</th>
            <th className="p-3">Versión actual</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>{documentos.map(document =>
          <tr key={`${document.proyectoId}-${document.id_documento}`}
            className="border-b last:border-0"><td className="p-3 font-semibold">
              {document.nombre_documento}</td><td className="p-3">{document.proyecto}</td>
            <td className="p-3">v{document.version_actual}</td>
            <td className="p-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold 
                  ${badgeColor(document.estado)}`}>{document.estado}</span></td><td className="p-3">
              <div className="flex flex-wrap gap-2">{document.id_archivo_actual
                && <button className="rounded-lg border px-3 py-1.5 text-[var(--rojo)]"
                  onClick={() =>
                    void dashboardService.descargarArchivo(document.id_archivo_actual!, document.nombre_documento)}>Descargar</button>}
                {document.id_archivo_actual && document.estado === 'BORRADOR' &&
                  <button disabled={accion === document.id_documento}
                    className="rounded-lg border px-3 py-1.5" onClick={
                      () => void enviar(document)}>{accion === document.id_documento
                        ? 'Enviandoâ€¦' : 'Enviar a revisión'}</button>
                }{document.estado !== 'PENDIENTE' && document.estado !== 'APROBADO' &&
                  <button className="rounded-lg border px-3 py-1.5" onClick={
                    () => abrirVersion(document)}>Subir nueva versión</button>}<details className="rounded-lg border px-3 py-1.5"><summary className="cursor-pointer font-semibold text-[var(--rojo)]">Consultar decisión</summary><div className="mt-2 min-w-56 space-y-2 text-xs text-gray-600">{document.versiones.flatMap(version => version.revisiones ?? []).map((revision, index) => <div key={index} className="border-t pt-2"><strong>{revision.estado}</strong>{revision.observaciones && <p className="mt-1">{revision.observaciones}</p>}{revision.fecha_revision && <time className="mt-1 block">{new Date(revision.fecha_revision).toLocaleDateString("es-MX")}</time>}</div>)}{!document.versiones.some(version => version.revisiones?.length) && <p>No hay decisiones registradas.</p>}</div></details>
              </div>
            </td>
          </tr>)
        }

          {!cargando && !documentos.length &&
            <tr>
              <td colSpan={5}
                className="p-8 text-center text-gray-500">
                No hay documentos cargados en tus proyectos.
              </td>
            </tr>}{cargando && <tr><td colSpan={5} className="p-8 text-center">
              Cargando documentos
            </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    {uploadOpen &&
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
        role="presentation"
        onMouseDown={event => {
          if (event.target === event.currentTarget)
            setUploadOpen(false);
        }}><form role="dialog" aria-modal="true" aria-labelledby="upload-title"
          onSubmit={guardarArchivo}
          className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <h2 id="upload-title"
            className="text-xl font-bold">{modo === 'nuevo' ? 'Subir documento' : 'Cargar nueva versión'}
          </h2>

          {modo === 'nuevo' ? <>
            <label
              htmlFor="upload-project"
              className="mt-5 block text-sm font-semibold">Proyecto</label>

            <select id="upload-project" required
              className="mt-2 w-full rounded-lg border p-3"
              value={idProyecto}
              onChange={event => setIdProyecto(event.target.value)}>
              <option value="">Selecciona un proyecto</option>
              {proyectos.map(project =>
                <option key={project.id_proyecto}
                  value={project.id_proyecto}>
                  {project.titulo}</option>)}
            </select></> :

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
              <strong>Documento:</strong> {seleccionada?.nombre_documento}
              <p><strong>Proyecto:</strong> {seleccionada?.proyecto}</p>

            </div>}
          <label htmlFor="upload-file" className="mt-5 block text-sm font-semibold">Archivo PDF o DOCX</label>
          <input
            id="upload-file"
            required type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="mt-2 w-full rounded-lg border p-3"
            onChange={event => setArchivo(event.target.files?.[0] ?? null)} />
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border px-4 py-2"
              onClick={() => setUploadOpen(false)}>Cancelar</button>
            <button disabled={ocupado || (modo === 'version' && !seleccionada)}
              className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white disabled:opacity-50">
              {ocupado ? 'Cargandoâ€¦' : 'Cargar'}
            </button>
          </div>
        </form>
      </div>}
  </section>;
};
export default MisDocumentos;
