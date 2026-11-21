# Historias de usuario de InvestigaTec 2.0 — backlog listo para GitHub Issues

> Estas historias pueden copiarse a **GitHub Issues** y deben cerrarse solo cuando se haya
> verificado su criterio de aceptación. Este archivo **no crea Issues automáticamente**.
> Prioridad I = indispensable; D = deseable.

| ID | Épica | Prioridad | Historia de usuario | Criterio observable (Dado–Cuando–Entonces) |
|---|---|---|---|---|
| HU-01 | Acceso | I | Como visitante, quiero registrarme para utilizar InvestigaTec. | Dado un correo nuevo y datos válidos, cuando envío el registro, entonces se crea una cuenta con rol MIEMBRO y perfil privado. |
| HU-02 | Acceso | I | Como usuario, quiero iniciar sesión para acceder a mis funciones. | Dadas credenciales válidas, cuando ingreso, entonces recibo una sesión y veo mi panel. |
| HU-03 | Acceso | I | Como usuario, quiero cerrar sesión para proteger mi información. | Dada una sesión, cuando cierro sesión, entonces las rutas privadas requieren nueva autenticación. |
| HU-04 | Acceso | I | Como administrador, quiero limitar las funciones por rol. | Dado un usuario sin ADMIN, cuando solicita un endpoint administrativo, entonces recibe HTTP 403. |
| HU-05 | Perfil | I | Como usuario, quiero editar mi perfil académico. | Dado mi perfil, cuando guardo cambios válidos, entonces los datos se recuperan en una consulta posterior. |
| HU-06 | Perfil | I | Como usuario, quiero controlar la visibilidad de mi perfil. | Dado un perfil privado, cuando otra cuenta sin privilegios intenta consultarlo, entonces no obtiene sus datos. |
| HU-07 | Perfil | D | Como investigador, quiero agregar enlaces académicos a mi perfil. | Dado un enlace HTTPS válido, cuando lo registro, entonces aparece en mi lista de enlaces. |
| HU-08 | Perfil | D | Como investigador, quiero editar y borrar mis enlaces académicos. | Dado un enlace propio, cuando lo edito o elimino, entonces se actualiza el listado; otro usuario no puede alterarlo. |
| HU-09 | Proyectos | I | Como investigador, quiero crear un proyecto para organizar mi trabajo. | Dado un título válido, cuando creo el proyecto, entonces aparece en Mis proyectos con estado BORRADOR. |
| HU-10 | Proyectos | I | Como investigador, quiero modificar un borrador. | Dado un proyecto propio en BORRADOR, cuando actualizo el título, entonces se conserva el nuevo valor. |
| HU-11 | Proyectos | I | Como investigador, quiero eliminar borradores sin documentos. | Dado un borrador propio vacío, cuando lo elimino, entonces deja de estar disponible. |
| HU-12 | Proyectos | I | Como usuario autorizado, quiero buscar proyectos. | Dado un título, estado, página y límite, cuando filtro proyectos, entonces solo recibo los visibles y el total paginado. |
| HU-13 | Documentos | I | Como investigador, quiero subir PDF o DOCX a mis proyectos. | Dado un archivo permitido, cuando lo subo, entonces queda asociado a un documento y se guarda su versión. |
| HU-14 | Documentos | I | Como investigador, quiero consultar y descargar versiones. | Dado un documento propio, cuando veo su historial, entonces puedo descargar cada versión permitida. |
| HU-15 | Documentos | I | Como investigador, quiero enviar una nueva versión tras correcciones. | Dada una versión en CORRECCIONES, cuando cargo una nueva del mismo formato, entonces se incrementa su número de versión. |
| HU-16 | Documentos | D | Como lector autorizado, quiero consultar el resumen del documento. | Dado un encabezado real RESUMEN/ABSTRACT, cuando se procesa, entonces se muestra solo esa sección, o un aviso si no se detecta. |
| HU-17 | Documentos | D | Como propietario, quiero actualizar resúmenes de archivos anteriores. | Dado un documento existente, cuando ejecuto reprocesamiento, entonces se actualiza el resumen sin cambiar el archivo o historial. |
| HU-18 | Revisiones | I | Como administrador, quiero asignar revisores a investigadores. | Dado un revisor activo distinto del investigador, cuando lo asigno, entonces sus siguientes envíos se dirigen al revisor. |
| HU-19 | Revisiones | I | Como investigador, quiero enviar un documento a revisión. | Dada la última versión sin revisión pendiente y con revisor asignado, cuando la envío, entonces el estado cambia a PENDIENTE. |
| HU-20 | Revisiones | I | Como revisor, quiero registrar observaciones y decisiones. | Dado un documento asignado, cuando solicito correcciones con comentario, entonces queda registrada la decisión y se notifica al autor. |
| HU-21 | Revisiones | I | Como revisor, quiero aprobar una versión corregida. | Dada una nueva versión pendiente, cuando apruebo, entonces el documento aparece APROBADO en su seguimiento. |
| HU-22 | Seguimiento | I | Como investigador, quiero ver los estados de mis documentos. | Dado un proyecto con revisiones, cuando abro seguimiento, entonces observo el estado por documento y las versiones. |
| HU-23 | Seguimiento | D | Como usuario, quiero consultar notificaciones. | Dada una asignación o revisión, cuando se genera el aviso, entonces aparece en mi lista. |
| HU-24 | Administración | I | Como administrador, quiero activar, desactivar y asignar roles. | Dado un usuario y un rol válido, cuando actualizo sus permisos, entonces el backend verifica los cambios inmediatamente. |
| HU-25 | Publicaciones | D | Como investigador, quiero buscar una publicación por DOI. | Dado un DOI válido disponible en Crossref, cuando consulto, entonces obtengo título, autores y año sin consultar directamente Crossref desde el navegador. |

## Procedimiento para registrar las historias

1. Crear el primer Issue con la propuesta general del proyecto y sus actores.
2. Crear como Issues las historias indispensables (hay más de 15 en la lista).
3. Usar los IDs HU-01, HU-02, etc., en el título, y el criterio en la descripción.
4. Asociar evidencia de prueba, capturas o endpoint real antes de marcar el Issue como cerrado.
5. Incorporar los Issues al tablero de GitHub Projects y registrar responsable, prioridad y estado real.

No se afirma que el tablero o los Issues ya existan en GitHub.
