import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { AsignacionRevisorApi, UsuarioAdmin } from '../../types';

const fullName = (u?: UsuarioAdmin) => u ? `${u.nombre} ${u.apellido_paterno}` : 'Sin asignar';
const AsignacionRevisores = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionRevisorApi[]>([]);
  const [seleccion, setSeleccion] = useState<UsuarioAdmin | null>(null);
  const [revisorId, setRevisorId] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const revisores = usuarios.filter(u => u.activo && u.roles.includes('REVISOR'));
  const usuariosActivos = usuarios.filter(u => u.activo);
  const cargar = async () => { const [us, ars] = await Promise.all([adminService.usuarios(), adminService.asignaciones()]); setUsuarios(us); setAsignaciones(ars); };
  useEffect(() => { void cargar().catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar la asignación.')); }, []);
  const abrirModal = (u: UsuarioAdmin) => { setSeleccion(u); setRevisorId(String(asignaciones.find(a => a.id_investigador === u.id_usuario)?.id_revisor ?? '')); };
  const guardar = async () => {
    if (!seleccion || !revisorId) return;
    if (Number(revisorId) === seleccion.id_usuario) { setError('El propietario no puede ser su propio revisor.'); return; }
    setGuardando(true); setError('');
    try { await adminService.asignarRevisor(seleccion.id_usuario, Number(revisorId)); await cargar(); setSeleccion(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar la asignación.'); }
    finally { setGuardando(false); }
  };
  const byId = Object.fromEntries(usuarios.map(u => [u.id_usuario, u]));
  return <section className="space-y-5">
    <div>
        <h1 className="text-2xl font-pixel font-bold text-[var(--rojo-oscuro)]">Asignacion de revisores</h1>
        <p className="text-sm text-[var(--cafe)]">Asigna un evaluador diferente al propietario, incluso si este tiene rol REVISOR.</p>
    </div>
    <p className="rounded-full border-[var(--cafe)]/80 border-r-4 border-b-4 border-2 p-2 text-sm text-[var(--cafe)]/80">
    La asignación actual contempla un revisor por investigador. La revisión simultánea por múltiples revisores se evaluará posteriormente.
    </p>


    {error && <p role="alert" className="rounded-xl bg-[var(--rojo)]-50 p-3 text-sm text-red-800">{error}</p>}

    <div className="overflow-x-auto rounded-2xl border-[var(--cafe)] bg-[var(--bg)] p-5 border-r-6 border-b-6 border-2">
        <table className="w-full min-w-[720px] text-left text-sm"><thead>
            <tr className="border-b text-sm uppercase text-[var(--cafe)] font-pixel">
            <th className="p-3">Usuario</th>
            <th className="p-3">Rol</th>
            <th className="p-3">Revisor asignado</th>
            <th className="p-3">Estado</th>
            <th className="p-3">Acción</th>
            </tr>
            </thead>
            <tbody>
                {usuariosActivos.map(u => { const assignment = asignaciones.find(a => 
                    a.id_investigador === u.id_usuario); 
                return <tr key={u.id_usuario} 
                className="border-b last:border-0">
                    <td className="p-3 font-semibold">
                    {fullName(u)}</td><td className="p-3">{u.roles.join(', ')}</td><td className="p-3">
                        {fullName(assignment ? byId[assignment.id_revisor] : undefined)}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignment ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{assignment ? 'Asignado' : 'Pendiente'}</span></td><td className="p-3"><button className="rounded-lg bg-[var(--rojo)] px-3 py-1.5 font-semibold text-white" onClick={() => abrirModal(u)}>{assignment ? 'Cambiar revisor' : 'Asignar revisor'}</button></td></tr>; })}{!usuariosActivos.length && <tr><td colSpan={5} className="p-8 text-center">No hay usuarios activos.</td></tr>}</tbody></table></div>
    {seleccion && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSeleccion(null); }}><div role="dialog" aria-modal="true" aria-labelledby="assign-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 id="assign-title" className="text-xl font-bold">Asignar revisor</h2><p className="mt-1 text-sm text-gray-600">Propietario: {fullName(seleccion)} · {seleccion.roles.join(', ')}</p><label className="mt-5 block text-sm font-semibold" htmlFor="reviewer-select">Selecciona un revisor activo</label><select id="reviewer-select" className="mt-2 w-full rounded-lg border p-3" value={revisorId} onChange={e => setRevisorId(e.target.value)}><option value="">Seleccionar…</option>{revisores.filter(r => r.id_usuario !== seleccion.id_usuario).map(r => <option key={r.id_usuario} value={r.id_usuario}>{fullName(r)} · {r.correo}</option>)}</select>{!revisores.some(r => r.id_usuario !== seleccion.id_usuario) && <p className="mt-2 text-sm text-amber-800">No hay revisores activos disponibles distintos al propietario.</p>}<div className="mt-6 flex justify-end gap-2"><button className="rounded-lg border px-4 py-2" onClick={() => setSeleccion(null)}>Cancelar</button><button disabled={!revisorId || guardando} className="rounded-lg bg-[var(--rojo)] px-4 py-2 font-semibold text-white disabled:opacity-50" onClick={() => void guardar()}>{guardando ? 'Guardando…' : 'Guardar asignación'}</button></div></div></div>}
  </section>;
};
export default AsignacionRevisores;
