# InvestigaTec 2.0 — Frontend RC2

Frontend React + TypeScript + Vite conservado a partir de la rama original de la colaboradora. Compatible por contrato con el código de `backend(9).zip` entregado el 2 de noviembre de 2026.

**El paquete RC2 incluye este frontend y una copia sin modificaciones del backend que enviaste. Las nuevas funcionalidades y correcciones están solamente en `frontend/src`. Consulta `../INSTALACION_RC2.md` para integrarlas en tu proyecto real.**

## Requisitos

- Windows con Node.js 22.12 o posterior, npm y PowerShell.
- Backend original ejecutándose y accesible desde el navegador (en la configuración de referencia: `http://localhost:8001`).
- El origen de Vite (`http://localhost:5173`) debe estar permitido en `CORS_ORIGINS` del backend.

## Instalación local (PowerShell)

Abrir PowerShell en esta misma carpeta `frontend`:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Abrir la dirección que muestre Vite (por defecto `http://localhost:5173`). La variable en `.env` debe ser la URL pública de FastAPI, sin barra final:

```dotenv
VITE_API_URL=http://localhost:8001
```

Para verificar tipos y generar un paquete de producción:

```powershell
npm run build
npm run lint
```

Las variables `VITE_*` se incorporan al bundle del navegador. **Nunca usar aquí contraseñas, `SECRET_KEY`, tokens JWT ni credenciales de PostgreSQL.**

## Flujo rápido de validación manual

1. Abrir `http://localhost:8001/docs` y `http://localhost:8001/health`. El JSON de `/health` debe indicar `database: connected`.
2. Registrar una cuenta y entrar. Revisar que `GET /auth/me` y `GET /roles/me` respondan correctamente en DevTools → Network.
3. Probar la cuenta con `MIEMBRO` y `ADMIN` simultáneamente: ver selector de vista, enlaces combinados y acceso administrativo según sus roles, no según la vista.
4. Crear y editar un proyecto `BORRADOR`, subir un PDF/DOCX, asignar revisor con `ADMIN`, enviar a revisión con propietario, aprobar o solicitar correcciones con `REVISOR`.
5. Subir una segunda versión con el mismo formato después de `CORRECCIONES`, verificar el historial y descargar versiones con el JWT.
6. Cerrar sesión o dejar expirar el token. Comprobar redirección a login al entrar a `/dashboard`. Probar también con dos pestañas.
7. Abrir `/dashboard/tablero`; comprobar los cuatro estados, búsqueda, orden, filtro y enlace a cada proyecto.
8. Probar rechazo `403` entrando a `/dashboard/usuarios_roles` con una cuenta sin `ADMIN` y `/dashboard/revisiones_asignadas` sin `REVISOR`.

**No se debe recrear la base de datos ni eliminar volúmenes.** Para integrar con tu backend actual no necesitas ejecutar ninguna migración de este frontend.

## Notas importantes

- El login consulta el usuario y los roles actuales mediante los endpoints reales, sin confiar en un usuario persistido anteriormente.
- Se conserva el token JWT en `localStorage` por compatibilidad con la rama original. Para un despliegue público conviene evaluar cookies HttpOnly, CSRF y medidas de seguridad con cambios coordinados en el backend; esta versión no modifica ese mecanismo unilateralmente.
- El backend limita archivos a PDF/DOCX y 500 MB; las validaciones del navegador son preventivas, no sustituyen las del servidor.
- El envío a revisión requiere un revisor permanente previamente asignado; esto lo exige el backend.
- No se agregó `APROBADOR`: no existe en las seeds ni en las verificaciones de permisos presentes en `backend(9)`.
- Los servicios heredados `carreraService.ts`, `departamentoService.ts` y `usuariosService.ts` se conservaron sin uso; apuntan a endpoints ausentes en `backend(9)` y requieren una decisión futura antes de reutilizarse.
- Las áreas de perfil público, enlaces académicos, y pruebas E2E automatizadas no quedaron implementadas como pantallas nuevas. El backend sí ofrece endpoints de perfil y áreas académicas.
- El botón «Preparar correo» de Seguimiento abre la aplicación de correo mediante `mailto:`. **No** envía ni almacena la consulta en FastAPI; el backend actual no incluye ese endpoint.
- Los indicadores, notificaciones y auditoría siguen basándose en respuestas del backend; no se añadieron datos de demostración.

## Alcance de verificación en este entorno

Se analizaron las rutas Python, esquemas, políticas de acceso y respuestas por inspección de código. Se verificó la sintaxis TS/TSX con el compilador TypeScript disponible en el entorno, sin errores de parseo. No fue posible ejecutar `npm ci` ni el build real porque el entorno no tiene acceso a `registry.npmjs.org`. Tampoco fue posible levantar la instancia de Docker/PostgreSQL del usuario. **La funcionalidad de extremo a extremo permanece pendiente de prueba en Windows.**
