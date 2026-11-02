import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { UsuarioAdmin } from '../../types';

const nombre = (u: Pick<UsuarioAdmin, 'nombre' | 'apellido_paterno'>) => `${u.nombre} ${u.apellido_paterno}`;

const UsuariosRoles = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [roles, setRoles] = useState<Array<{ id_rol: number; nombre: string }>>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const [lista, rolesLista] = await Promise.all([adminService.usuarios(), adminService.roles()]);
      setUsuarios(lista);
      setRoles(rolesLista);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el directorio.');
    } finally { setCargando(false); }
  };
  useEffect(() => { void cargar(); }, []);

  const gestionarRol = async (usuario: UsuarioAdmin) => {
    const asignados = new Set(usuario.roles);
    const opciones = roles.map((r, i) => `${i + 1}. ${r.nombre}${asignados.has(r.nombre) ? ' (asignado)' : ''}`).join('\n');
    const respuesta = window.prompt(`Escribe el número del rol para agregar o quitar:\n${opciones}`);
    if (!respuesta) return;
    const rol = roles[Number(respuesta) - 1];
    if (!rol) return;
    try {
      if (asignados.has(rol.nombre)) await adminService.revocarRol(usuario.id_usuario, rol.id_rol);
      else await adminService.asignarRol(usuario.id_usuario, rol.id_rol);
      await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar el rol.'); }
  };

  const visibles = usuarios.filter(u => `${nombre(u)} ${u.correo}`.toLowerCase().includes(busqueda.toLowerCase()));
  return <section className="space-y-5">
    <div>
        <h1 className="text-2xl font-bold font-pixel text-[var(--rojo-oscuro)]">Usuarios y roles</h1>
        <p className="font-cuerpo text-sm text-[var(--cafe)]">
            Directorio de cuentas registradas y gestión de roles de plataforma.
        </p>
    </div>

    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

    <div className="rounded-2xl border-[var(--cafe)] bg-[var(--bg)] p-5 border-r-6 border-b-6 border-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-pixel">
        <h2 className="font-bold">Directorio de usuarios ({usuarios.filter(u => u.activo).length} activos)</h2>
        <input aria-label="Buscar usuario" className="max-w-sm rounded-lg border p-2" placeholder="Buscar por nombre o correo"
        value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {cargando ? <p className="p-8 text-center">Cargando usuarios…</p>
       : <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm"><thead>
            <tr className="border-b text-sm uppercase text-[var(--cafe)] font-pixel">
                <th className="p-3">Usuario</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Rol(es)</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acción</th>
            </tr>
            </thead>
            <tbody>
                {visibles.map(u => <tr key={u.id_usuario} 
                className="border-b last:border-0">
                    <td className="p-3 font-semibold">
                        {nombre(u)}</td><td className="p-3">{u.correo}</td>
                    <td className="p-3">{u.roles.join(', ') || 'Sin rol'}</td>
                    <td className="p-3">
                        <span 
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold 
                        ${u.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >{u.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="p-3">
                        <div className="flex gap-2">
                        <button className=" rounded-lg border px-3 py-1.5 text-[var(--rojo)]" onClick={() => 
                            void gestionarRol(u)}>Gestionar roles</button><button 
                            className="rounded-lg border px-3 py-1.5" 
                            onClick={async () => { 
                                try { await adminService.cambiarEstadoUsuario(u.id_usuario, !u.activo); 
                                await cargar(); } catch (e) { setError(e instanceof Error ? e.message
                                 : 'No se pudo actualizar el usuario.'); } }}>{u.activo ? 'Desactivar' : 'Activar'}
                                 </button>
                        </div>
                    </td>
                    </tr>)}
                    {!visibles.length && <tr>
                        <td colSpan={5} 
                    className="p-8 text-center text-gray-500">No hay usuarios para mostrar.</td>
                    </tr>}
                    </tbody>
                    </table>
                    </div>}
    </div>
  </section>;
};
export default UsuariosRoles;
