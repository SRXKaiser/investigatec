import { useEffect, useState } from 'react';
import { adminService, type SeguimientoApi } from '../../services/adminService';
import type { ProyectoApi, UsuarioAdmin } from '../../types';

type Fila = { id: number; documento: string; proyecto: string; estado: string; responsable: string; idArchivo: number | null };
const Supervision = () => {
    const [filas, setFilas] = useState<Fila[]>([]);
    const [seleccion, setSeleccion] = useState<Fila | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        void (async () => {
            try {
                const [proyectos, usuarios] = await Promise.all([adminService.proyectos(), adminService.usuarios()]);
                const porId = Object.fromEntries(usuarios.map((u: UsuarioAdmin) => [u.id_usuario, `${u.nombre} ${u.apellido_paterno}`]));
                const seguimientos = await Promise.all(proyectos.map((p: ProyectoApi) => adminService.seguimiento(p.id_proyecto).catch(() => null)));
                setFilas((seguimientos.filter(Boolean) as SeguimientoApi[]).flatMap(s => s.documentos.map(d => ({
                     id: d.id_documento, documento: d.nombre_documento, proyecto: s.titulo, estado: d.estado, responsable: porId[s.id_investigador] 
                     ?? 
                     `Usuario #${s.id_investigador}`, idArchivo: d.id_archivo_actual }))));
            } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar los documentos en seguimiento.'); }
            finally { setCargando(false); }
        })();
    }, []);
    return <section className="space-y-5">
        <div>
            <h1 className="text-2xl font-bold text-[var(--rojo-oscuro)] font-pixel">Supervisión</h1>
            <p className="mt-1 text-sm text-[var(--cafe)]/70">Consulta el estado de los documentos; solo el revisor asignado puede decidir.</p>
            </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="overflow-x-auto rounded-2xl border-[var(--cafe)] bg-[var(--bg)] p-5 border-r-6 border-b-6 border-2">
            <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                    <tr className="border-b text-sm font-pixel uppercase text-[var(--cafe)]">
                        <th className="p-3">Documento / proyecto</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Responsable</th>
                        <th className="p-3">Acción</th>
                    </tr>
                </thead>
                <tbody>{filas.map((f, i) =>
                    <tr key={`${f.id}-${i}`}
                        className="border-b last:border-0">
                        <td className="p-3">
                            <strong>{f.proyecto}</strong>
                            <span className="block text-xs text-gray-500">{f.proyecto}</span>
                        </td>
                        <td className="p-3">{f.estado}</td>
                        <td className="p-3">{f.responsable}</td>
                        <td className="p-3">
                            <button className="rounded-lg border px-3 py-1.5 text-[var(--rojo)]"
                                onClick={() => setSeleccion(f)}>Consultar</button>
                        </td>
                    </tr>
                )}{!cargando && !filas.length && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay documentos en seguimiento.
                </td>
                </tr>
                    }
                    {cargando &&
                        <tr>
                            <td colSpan={4} className="p-8 text-center">Cargando seguimiento…</td>
                        </tr>}
                </tbody>
            </table>
        </div>
        {seleccion && 
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" 
        role="presentation" 
        onMouseDown={e => { 
            if (e.target === e.currentTarget) 
            setSeleccion(null); 
        }}>
            {/* mostrar los detalles del proyecto al presionar el boton */}
            <div role="dialog" aria-modal="true" 
            className="w-full max-w-lg rounded-2x1 border-[var(--cafe)] bg-[var(--bg)] p-5 border-r-6 border-b-6 border-2 p-6">
                <h2 className="text-xl font-bold">Detalle del documento</h2>
                <dl className="mt-4 space-y-3 text-sm"><div><dt className="font-semibold">Documento</dt>
                <dd>{seleccion.documento}</dd>
            </div>
            <div>
                <dt className="font-semibold">Proyecto</dt>
                <dd>{seleccion.proyecto}</dd>
            </div>
            <div>
                <dt className="font-semibold">Estado</dt>
                <dd>{seleccion.estado}</dd>
            </div>
            <div>
                <dt className="font-semibold">Responsable</dt>
                <dd>{seleccion.responsable}</dd>
            </div>
            </dl>{seleccion.idArchivo && <a className="mt-4 inline-block text-[var(--rojo)] underline" href={`http://localhost:8001/archivos/${seleccion.idArchivo}/descargar`} target="_blank" rel="noreferrer">Consultar archivo</a>}
            
            
            <div className="mt-6 flex justify-end"><button className="rounded-lg border px-4 py-2" 
            onClick={() => setSeleccion(null)}>Cerrar</button></div></div></div>}
    </section>;
};
export default Supervision;
