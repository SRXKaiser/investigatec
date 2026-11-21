# Auditoría y correcciones — InvestigaTec 2.0

**Base:** ZIP `investigatec(1).zip` suministrado el 20/11/2026.
**Alcance:** código fuente React/TypeScript, FastAPI/SQLAlchemy/Alembic, seguridad, documentos, revisiones, arranque Docker e indicadores, contrastados con la guía de Proyecto Final de Programación Web.

## 1. Cambios aplicados

| Componente | Situación original | Corrección aplicada |
|---|---|---|
| Detector PDF/DOCX | Aceptaba encabezados como «Resumen de actividades» y entradas de índice. | Solo acepta títulos de sección claros (RESUMEN, ABSTRACT, SUMMARY) y descarta listados de índice. |
| Detector PDF/DOCX | Recortaba siempre la extracción en 6,000 caracteres, incluso entre oraciones. | Eliminado el truncado silencioso. Si el bloque es excesivo o ambiguo, devuelve `null`, no texto arbitrario. |
| Resúmenes ya guardados | Un cambio de código no los actualizaba. | Endpoint `POST /archivos/{id_archivo}/reprocesar-resumen`, botón para propietario/admin y CLI para migración por lotes (`--dry-run`, `--apply`). |
| Interfaz de resúmenes | Un cuadro de altura fija escondía contenido tras desplazamiento interno. | El texto ahora ocupa la altura necesaria sin corte visual. |
| Segundo CRUD | Enlaces académicos solo permitían crear, listar y eliminar. | `PATCH /academico/enlaces/{id_enlace}` y botón **Editar** en Mi perfil, con protección de propiedad. |
| API externa | No había consumo de servicio público externo. | `GET /publicaciones/doi`, validación del identificador, consulta HTTPS de Crossref desde FastAPI y formulario de consulta en Mis documentos. |
| Instalación | Docker Compose solo levantaba API + PostgreSQL, sin frontend. | Servicio `frontend` (Node/Nginx), rutas SPA, Dockerfile, `.dockerignore`; backend migra y carga roles automáticamente. |
| Estado de la API | `/health` podía devolver 200 con BD desconectada. | Ahora devuelve 503 cuando la consulta a BD falla. |
| Analítica del administrador | Algunos errores se omitían sin mostrar aviso. | Error visible al usuario si fallan las consultas. |
| Seguimiento | Consulta de revisiones y decisiones por cada versión (N+1). | Precarga por lote y agrupación en memoria de revisiones/decisiones por proyecto. |
| Registro | Duplicado concurrente podía provocar error interno de unicidad. | Colisiones de correo convertidas en HTTP 409 al `flush` o `commit`. |
| Roles | La descripción de REVISOR sugería rechazar documentos. | Actualizada conforme al flujo real: aprobar o solicitar correcciones. |
| Calidad | No había suite de pruebas ni pipeline en este ZIP. | Pruebas pytest de API/resúmenes, `requirements-dev.txt` y GitHub Actions de backend/frontend. |
| Gestión académica | README vacío, sin documentación de cambios. | README de despliegue, backlog de historias y plantilla `AI_USAGE.md`. |

## 2. Resultados verificados

- **25 pruebas automatizadas** aprobadas mediante `pytest` en SQLite temporal aislado. Abarcan autenticación, registro, rutas protegidas, roles, proyectos CRUD, búsqueda paginada, enlaces académicos CRUD, aislamiento entre usuarios, documentos PDF/DOCX (prueba de DOCX), reextracción, descarga, revisión/correcciones/versiones/aprobación, consulta DOI simulada y casos falsos de resumen.
- **Compilación de tipos TypeScript (`tsc -b`)** completada sin errores de tipo.
- **Compilación de Python (`compileall`)** completada sin errores sintácticos.
- **Prueba puntual de extracción** sobre archivos PDF/DOCX suministrados: identificó los resúmenes presentes; evitó el texto general en el documento usado como regresión.

## 3. Validaciones pendientes antes de declarar listo para producción

- No hay Docker en el entorno de revisión. **No se ejecutó** `docker compose up -d --build` ni las migraciones contra la base de datos real. Probarlas en Windows con Docker Desktop.
- No hay acceso a Internet desde este entorno y las dependencias del ZIP incluyen binarios Windows. **No se pudo ejecutar** Vite build completo ni `oxlint` nativo Linux; sí pasó `tsc -b`. En Docker y GitHub Actions `npm ci` debe instalar las dependencias del sistema operativo adecuado.
- Crossref fue probado con una respuesta simulada, no con una consulta real a `api.crossref.org`. Validar con Internet.
- No se ejecutó un navegador real, una auditoría Lighthouse ni una prueba con varios usuarios concurrentes.
- No se verificó URL pública de producción; **no hay despliegue remoto realizado** en este paquete.
- Los **Issues reales, PR revisados, rama `main` protegida y etiqueta `v1.0.0`** no se pueden crear ni acreditar solo con un ZIP. Usar `docs/HISTORIAS_USUARIO.md` como base para subir al tablero.
- `AI_USAGE.md` es plantilla parcial: los integrantes deben completar los datos reales y la reflexión individual.
- La seguridad de una plataforma en producción requiere, además, revisar dependencias, limitar el acceso a la BD, establecer backups, HTTPS y pruebas de penetración.

## 4. Comparación con el proyecto de Programación Web

| Condición de evaluación | Estado tras las correcciones |
|---|---|
| React/FastAPI/PostgreSQL, usuarios, JWT y roles | Implementado en el código, pendiente prueba integrada con PostgreSQL. |
| 12+ endpoints FastAPI / OpenAPI | Sí, supera el mínimo; comprobar `/docs` al levantar el servidor. |
| Mínimo 3 entidades, relaciones 1:N y N:M | Modelos presentes, esquema SQLite creado en las pruebas; comprobar migración PostgreSQL. |
| CRUD de 2 entidades desde interfaz | Proyectos y enlaces académicos tienen las cuatro operaciones; ejecutar demo completa. |
| Búsqueda y paginación | Backend de proyectos `GET /proyectos/buscar` con filtros y página/límite; verificar la interacción en interfaz. |
| Indicadores o gráficas | Panel administrador presente; ahora indica fallo si la consulta no carga. |
| Formularios validados cliente y servidor | Formulario DOI, archivos, registro, proyectos; validar caso dinámico concreto con el docente. |
| API pública consumida desde backend | Nueva consulta a Crossref por DOI; no probada en Internet real. |
| Docker Compose con los 3 servicios | Configuración añadida, no ejecutada con Docker en este entorno. |
| Pruebas de al menos 8 endpoints, con uno protegido | Sí: 25 tests entre API y extractor (más de 8 tests de API). |
| GitHub Actions | Workflow incluido; debe subirse a GitHub y ejecutarse exitosamente. |
| Accesibilidad ≥80 Lighthouse | **Pendiente**: ejecutar auditoría real y corregir hallazgos. |
| Despliegue público | **Pendiente**, requiere hosting y credenciales del equipo. |
| 15 historias en Issues/Projects | Plantilla con 25 historias; pendiente crearlas en GitHub. |
| `AI_USAGE.md` | Archivo incluido; pendiente completar información verdadera del equipo. |
| Evidencia de contribuciones, PRs y autoevaluación | **Pendiente**: depende del historial y del trabajo real del equipo. |

## 5. Instalación y resguardo de datos

1. Mantener la base de datos y la carpeta `storage/` originales. No están incluidas en el ZIP corregido (por privacidad).
2. Usar `.env.example` para completar `.env` sin subir secretos a GitHub.
3. Revisar `README.md` y ejecutar `docker compose up -d --build`.
4. Abrir `http://localhost:5173` y `http://localhost:8001/docs`.
5. Antes de reprocesar los resúmenes antiguos, **hacer backup** y ejecutar `--dry-run`; solo después `--apply`.
6. Si el ZIP original se compartió con credenciales reales, cambiarlas.

## 6. Límite de la auditoría

La inspección estática y las pruebas disponibles permiten certificar los cambios puntuales anteriores, **no que toda la aplicación esté libre de errores**. La aprobación final requiere una prueba funcional integral con PostgreSQL, Docker, navegador y datos de prueba representativos.
