import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";
import type { AuditoriaApi } from "../../services/adminService";

const formatoFecha = (fecha: string) => {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? fecha : valor.toLocaleString("es-MX");
};
export default function Auditoria() {
  const [registros, setRegistros] = useState<AuditoriaApi[]>([]);
  const [buscar, setBuscar] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const cargar = () => {
    setCargando(true);
    setError("");
    adminService
      .auditoria()
      .then(setRegistros)
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "No se pudo consultar la auditoría.",
        ),
      )
      .finally(() => setCargando(false));
  };
  useEffect(() => {
    cargar();
  }, []);
  const filtrados = useMemo(
    () =>
      registros.filter((item) =>
        [item.accion, item.entidad, item.id_usuario, item.id_registro]
          .join(" ")
          .toLowerCase()
          .includes(buscar.trim().toLowerCase()),
      ),
    [registros, buscar],
  );
  return (
    <section className="space-y-5 text-[var(--cafe)]">
      <div>
        <h1 className="font-pixel text-2xl text-[var(--rojo-oscuro)]">
          Auditoría administrativa
        </h1>
        <p className="mt-2 text-sm">
          Registro de actividades administrativas. Solo disponible para
          administradores.
        </p>
      </div>
      <div className="rounded-2xl border-2 border-[var(--cafe)] bg-[var(--bg)] p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <input
            aria-label="Filtrar eventos"
            className="min-w-0 flex-1 rounded-xl border p-2 sm:max-w-sm"
            placeholder="Filtrar por acción, entidad o ID"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
          <button onClick={cargar} className="rounded-xl border px-4 py-2">
            Actualizar
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-red-800"
          >
            {error}
          </p>
        )}
        {cargando ? (
          <p role="status">Cargando eventos…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Acción</th>
                  <th className="p-3">Entidad</th>
                  <th className="p-3">Registro</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item) => (
                  <tr
                    className="border-b last:border-0"
                    key={item.id_auditoria}
                  >
                    <td className="p-3">{formatoFecha(item.fecha_evento)}</td>
                    <td className="p-3">
                      <Link
                        className="text-[var(--rojo-oscuro)] underline"
                        to={`/dashboard/perfiles/${item.id_usuario}`}
                      >
                        #{item.id_usuario}
                      </Link>
                    </td>
                    <td className="p-3 break-all">{item.accion}</td>
                    <td className="p-3 break-all">{item.entidad}</td>
                    <td className="p-3">{item.id_registro ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtrados.length && (
              <p className="p-5 text-center text-sm opacity-70">
                No hay eventos que coincidan con el filtro.
              </p>
            )}
          </div>
        )}
        <p className="mt-4 text-xs opacity-70">
          Este historial muestra los eventos disponibles en el sistema.
        </p>
      </div>
    </section>
  );
}
