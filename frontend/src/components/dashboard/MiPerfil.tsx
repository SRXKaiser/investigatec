import { useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  Link2,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ApiRequestError } from "../../services/api";
import { perfilService } from "../../services/perfilService";
import type {
  AreaApi,
  EnlaceApi,
  PerfilApi,
  PerfilCambio,
} from "../../services/perfilService";

const campo =
  "w-full min-w-0 rounded-xl border border-[var(--cafe)]/30 bg-white px-3 py-2 text-sm text-[var(--cafe)] outline-offset-2 focus:outline-[var(--rojo)]";
const boton =
  "rounded-xl border border-[var(--rojo-oscuro)] bg-[var(--rojo-oscuro)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50";
const panel =
  "rounded-2xl border-2 border-[var(--cafe)]/70 bg-[var(--bg)] p-4 shadow-[3px_4px_0_var(--cafe)] sm:p-6";

const mensajeError = (error: unknown) =>
  error instanceof Error ? error.message : "Ocurrió un error inesperado.";
const valores = (perfil: PerfilApi): PerfilCambio => ({
  username: perfil.username,
  nombre_publico: perfil.nombre_publico,
  biografia: perfil.biografia,
  institucion: perfil.institucion,
  especialidad: perfil.especialidad,
  perfil_visible: perfil.perfil_visible,
});

export default function MiPerfil() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<PerfilApi | null>(null);
  const [form, setForm] = useState<PerfilCambio | null>(null);
  const [areas, setAreas] = useState<AreaApi[]>([]);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [enlaces, setEnlaces] = useState<EnlaceApi[]>([]);
  const [imagen, setImagen] = useState<string | null>(null);
  const [tipo, setTipo] = useState("Sitio web");
  const [url, setUrl] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [sinPerfil, setSinPerfil] = useState(false);
  const [exito, setExito] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");
    setSinPerfil(false);
    try {
      // Solo el 404 de /perfiles/me indica que falta el perfil.
      // Un 404 de áreas o enlaces no debe convertirse en "perfil inexistente".
      let p: PerfilApi;
      try {
        p = await perfilService.obtener();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status === 404) {
          setSinPerfil(true);
          setError("No se encontró tu perfil académico. Contacta al administrador para verificar tu registro.");
          setPerfil(null);
          setForm(null);
          return;
        }
        throw e;
      }
      setPerfil(p);
      setForm(valores(p));
      const [catalogo, propias, links] = await Promise.allSettled([
        perfilService.areas(),
        perfilService.misAreas(),
        perfilService.enlaces(),
      ]);
      setAreas(catalogo.status === "fulfilled" ? catalogo.value : []);
      setSeleccion(propias.status === "fulfilled" ? propias.value.map((a) => a.id_area) : []);
      setEnlaces(links.status === "fulfilled" ? links.value : []);
      if ([catalogo, propias, links].some((resultado) => resultado.status === "rejected")) {
        setError("Tu perfil se cargó, pero no se pudo consultar toda la información complementaria. Puedes reintentar más tarde.");
      }
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);
  useEffect(() => {
    let activo = true;
    if (!perfil?.foto_perfil) {
      setImagen(null);
      return;
    }
    perfilService
      .foto(perfil.foto_perfil)
      .then((objectUrl) => {
        if (activo) setImagen(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (activo) setImagen(null);
      });
    return () => {
      activo = false;
    };
  }, [perfil?.foto_perfil]);
  useEffect(
    () => () => {
      if (imagen) URL.revokeObjectURL(imagen);
    },
    [imagen],
  );

  const ejecutar = async (accion: () => Promise<void>, mensaje: string) => {
    setOcupado(true);
    setError("");
    setExito("");
    try {
      await accion();
      setExito(mensaje);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  const actualizarCampo = (
    nombre: keyof PerfilCambio,
    valor: string | boolean,
  ) => setForm((f) => (f ? { ...f, [nombre]: valor } : f));

  const guardar = () => {
    if (!form) return;
    void ejecutar(async () => {
      const actualizado = await perfilService.actualizar(form);
      setPerfil(actualizado);
      setForm(valores(actualizado));
    }, "Datos del perfil actualizados correctamente.");
  };

  const subirFoto = (archivo: File | undefined) => {
    if (!archivo) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(archivo.type) ||
      archivo.size > 5 * 1024 * 1024
    ) {
      setError("La foto debe ser JPG, PNG o WebP y no superar 5 MB.");
      return;
    }
    void ejecutar(async () => {
      setPerfil(await perfilService.subirFoto(archivo));
    }, "Fotografía actualizada.");
  };

  if (cargando)
    return (
      <div role="status" className="p-8 text-[var(--cafe)]">
        Cargando tu perfil académico…
      </div>
    );
  return (
    <section className="mx-auto max-w-6xl space-y-5 text-left text-[var(--cafe)]">
      <div>
        <h1 className="font-pixel text-2xl font-bold text-[var(--rojo-oscuro)] sm:text-3xl">
          Mi perfil académico
        </h1>
        <p className="mt-1 text-sm opacity-75">
          Consulta y actualiza tu información registrada en InvestigaTec.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}{" "}
          {sinPerfil && (
            <p className="mt-2 text-xs">
              No se modificó la información de tu cuenta. Consulta al administrador si el problema continúa.
            </p>
          )}{" "}
          {!perfil && !sinPerfil && (
            <button onClick={() => void cargar()} className="ml-2 underline">
              Reintentar
            </button>
          )}
        </div>
      )}
      {exito && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-900"
        >
          <CheckCircle2 size={18} />
          {exito}
        </div>
      )}
      {perfil && form && (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <section className={panel}>
              <h2 className="mb-4 text-lg font-bold">Cuenta</h2>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--cafe)] bg-white">
                  {imagen ? (
                    <img
                      src={imagen}
                      alt="Fotografía de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={50} aria-hidden="true" />
                  )}
                </div>
                <p className="max-w-full break-words font-bold">
                  {user?.nombre} {user?.apellido_paterno}
                </p>
                <p className="max-w-full break-all text-xs opacity-80">
                  {user?.correo}
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {user?.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full border border-[var(--cafe)]/30 px-2 py-1 text-xs"
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <label
                  className={`${boton} cursor-pointer inline-flex items-center gap-2 ${ocupado ? "pointer-events-none opacity-50" : ""}`}
                >
                  <Camera size={17} /> Cambiar fotografía
                  <input
                    aria-label="Subir fotografía de perfil"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={ocupado}
                    onChange={(e) => {
                      subirFoto(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {perfil.foto_perfil && (
                  <button
                    disabled={ocupado}
                    className="inline-flex items-center gap-1 text-xs text-[var(--rojo-oscuro)] underline"
                    onClick={() => {
                      if (window.confirm("¿Eliminar tu fotografía de perfil?"))
                        void ejecutar(async () => {
                          await perfilService.eliminarFoto();
                          setPerfil((p) =>
                            p ? { ...p, foto_perfil: null } : p,
                          );
                        }, "Fotografía eliminada.");
                    }}
                  >
                    <Trash2 size={14} /> Eliminar fotografía
                  </button>
                )}
              </div>
            </section>
            <section className={panel}>
              <h2 className="mb-4 text-lg font-bold">
                Información pública y académica
              </h2>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  guardar();
                }}
              >
                <label className="text-sm font-semibold">
                  Nombre público
                  <input
                    className={`${campo} mt-1`}
                    maxLength={150}
                    required
                    value={form.nombre_publico ?? ""}
                    onChange={(e) =>
                      actualizarCampo("nombre_publico", e.target.value)
                    }
                  />
                </label>
                <label className="text-sm font-semibold">
                  Nombre de usuario
                  <input
                    className={`${campo} mt-1`}
                    minLength={3}
                    maxLength={50}
                    required
                    pattern="[a-z0-9_]{3,50}"
                    title="3 a 50 caracteres: minúsculas, números o guion bajo"
                    value={form.username ?? ""}
                    onChange={(e) =>
                      actualizarCampo("username", e.target.value.toLowerCase())
                    }
                  />
                </label>
                <label className="text-sm font-semibold">
                  Institución
                  <input
                    className={`${campo} mt-1`}
                    maxLength={150}
                    value={form.institucion ?? ""}
                    onChange={(e) =>
                      actualizarCampo("institucion", e.target.value)
                    }
                  />
                </label>
                <label className="text-sm font-semibold">
                  Especialidad
                  <input
                    className={`${campo} mt-1`}
                    maxLength={150}
                    value={form.especialidad ?? ""}
                    onChange={(e) =>
                      actualizarCampo("especialidad", e.target.value)
                    }
                  />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">
                  Biografía
                  <textarea
                    className={`${campo} mt-1 min-h-28`}
                    maxLength={5000}
                    value={form.biografia ?? ""}
                    onChange={(e) =>
                      actualizarCampo("biografia", e.target.value)
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.perfil_visible}
                    onChange={(e) =>
                      actualizarCampo("perfil_visible", e.target.checked)
                    }
                  />{" "}
                  Permitir que otros usuarios consulten mi perfil público
                </label>
                <div className="sm:col-span-2">
                  <button
                    className={`${boton} inline-flex items-center gap-2`}
                    disabled={ocupado}
                  >
                    <Save size={17} /> Guardar información
                  </button>
                </div>
              </form>
            </section>
          </div>
          <section className={panel}>
            <h2 className="text-lg font-bold">Áreas de investigación</h2>
            <p className="mt-1 text-sm opacity-70">
              Selecciona las áreas relacionadas con tu trabajo (hasta 20).
            </p>
            {areas.length ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {areas.map((a) => (
                  <label
                    key={a.id_area}
                    className="flex items-start gap-2 rounded-lg border border-[var(--cafe)]/20 bg-white p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={seleccion.includes(a.id_area)}
                      onChange={(e) =>
                        setSeleccion((prev) =>
                          e.target.checked
                            ? [...prev, a.id_area]
                            : prev.filter((id) => id !== a.id_area),
                        )
                      }
                    />
                    {a.nombre}
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm opacity-70">
                No hay áreas disponibles en el catálogo.
              </p>
            )}
            <button
              className={`${boton} mt-4`}
              disabled={ocupado || seleccion.length > 20}
              onClick={() =>
                void ejecutar(async () => {
                  setSeleccion(
                    (await perfilService.guardarAreas(seleccion)).map(
                      (a) => a.id_area,
                    ),
                  );
                }, "Áreas de investigación guardadas.")
              }
            >
              Guardar áreas
            </button>
          </section>
          <section className={panel}>
            <h2 className="text-lg font-bold">Enlaces académicos</h2>
            <p className="mt-1 text-sm opacity-70">
              Agrega enlaces a tus publicaciones, portafolio o perfil
              investigador.
            </p>
            <form
              className="mt-4 flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void ejecutar(async () => {
                  const enlace = await perfilService.agregarEnlace(
                    tipo.trim(),
                    url.trim(),
                  );
                  setEnlaces((prev) => [...prev, enlace]);
                  setUrl("");
                }, "Enlace agregado.");
              }}
            >
              <label className="min-w-36 flex-1 text-sm font-semibold">
                Tipo
                <input
                  required
                  maxLength={50}
                  className={`${campo} mt-1`}
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                />
              </label>
              <label className="min-w-52 flex-[3] text-sm font-semibold">
                URL
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  className={`${campo} mt-1`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </label>
              <button className={boton} disabled={ocupado}>
                <Link2 size={16} className="mr-1 inline" /> Agregar
              </button>
            </form>
            <ul className="mt-4 divide-y divide-[var(--cafe)]/20">
              {enlaces.map((enlace) => (
                <li
                  key={enlace.id_enlace}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <strong>{enlace.tipo}: </strong>
                    <a
                      href={enlace.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 break-all text-[var(--rojo-oscuro)] underline"
                    >
                      {enlace.url}
                      <ExternalLink size={14} className="shrink-0" />
                    </a>
                  </div>
                  <button
                    type="button"
                    disabled={ocupado}
                    className="inline-flex items-center gap-1 text-red-800 underline"
                    onClick={() => {
                      if (window.confirm("¿Eliminar este enlace académico?"))
                        void ejecutar(async () => {
                          await perfilService.eliminarEnlace(enlace.id_enlace);
                          setEnlaces((prev) =>
                            prev.filter(
                              (x) => x.id_enlace !== enlace.id_enlace,
                            ),
                          );
                        }, "Enlace eliminado.");
                    }}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </li>
              ))}
            </ul>
            {!enlaces.length && (
              <p className="mt-3 text-sm opacity-70">
                Todavía no has agregado enlaces.
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
