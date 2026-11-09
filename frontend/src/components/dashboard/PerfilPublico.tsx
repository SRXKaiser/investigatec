import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { UserRound } from "lucide-react";
import { perfilService } from "../../services/perfilService";
import type { PerfilPublicoApi } from "../../services/perfilService";
import { useAuth } from "../../context/AuthContext";

export default function PerfilPublico() {
  const { idUsuario } = useParams();
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<PerfilPublicoApi | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const id = Number(idUsuario);
  useEffect(() => {
    let activo = true;
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError("Identificador de usuario inválido.");
      setCargando(false);
      return;
    }
    setCargando(true);
    setPerfil(null);
    setError("");
    perfilService
      .consultar(id)
      .then((p) => {
        if (activo) setPerfil(p);
      })
      .catch((e) => {
        if (activo)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo consultar este perfil.",
          );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);
  useEffect(() => {
    let activo = true;
    let url: string | null = null;
    setFoto(null);
    if (perfil?.foto_perfil) {
      perfilService
        .foto(perfil.foto_perfil)
        .then((resultado) => {
          url = resultado;
          if (activo) setFoto(resultado);
          else URL.revokeObjectURL(resultado);
        })
        .catch(() => {
          if (activo) setFoto(null);
        });
    }
    return () => {
      activo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [perfil?.foto_perfil]);
  const caja =
    "rounded-2xl border-2 border-[var(--cafe)]/70 bg-[var(--bg)] p-5 sm:p-7";
  return (
    <section className="mx-auto max-w-5xl space-y-5 text-[var(--cafe)]">
      <div>
        <h1 className="font-pixel text-2xl text-[var(--rojo-oscuro)]">
          Perfil académico
        </h1>
        <p className="mt-2 text-sm">
          Consulta de información pública. La edición solo corresponde al
          propietario.
        </p>
      </div>
      {cargando && <p role="status">Cargando perfil…</p>}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800"
        >
          {error}
          <p className="mt-2 text-sm">
            El perfil puede no existir, ser privado o pertenecer a una cuenta
            inactiva.
          </p>
        </div>
      )}
      {perfil && (
        <div className="grid gap-5 md:grid-cols-[minmax(220px,1fr)_2fr]">
          <section
            className={`${caja} flex flex-col items-center gap-3 text-center`}
          >
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--cafe)] bg-white">
              {foto ? (
                <img
                  src={foto}
                  alt="Fotografía del perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={50} />
              )}
            </div>
            <h2 className="break-words text-xl font-bold">
              {perfil.nombre_publico || perfil.username}
            </h2>
            <p className="break-all text-sm opacity-70">@{perfil.username}</p>
            {user?.id_usuario === perfil.id_usuario && (
              <Link
                className="rounded-xl bg-[var(--rojo-oscuro)] px-4 py-2 text-white"
                to="/dashboard/perfil"
              >
                Editar mi perfil
              </Link>
            )}
          </section>
          <section className={caja}>
            <h2 className="mb-5 text-lg font-bold">Información académica</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold">Institución</dt>
                <dd className="mt-1 break-words">
                  {perfil.institucion || "Sin especificar"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Especialidad</dt>
                <dd className="mt-1 break-words">
                  {perfil.especialidad || "Sin especificar"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Biografía</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words">
                  {perfil.biografia || "Sin biografía pública"}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </section>
  );
}
