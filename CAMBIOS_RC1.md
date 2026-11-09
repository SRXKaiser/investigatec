# InvestigaTec 2.0 — RC1 (Directorio académico)

Base: frontend v2.2. Sin cambios en FastAPI, PostgreSQL o las migraciones.

## Cambios

- `frontend/src/components/dashboard/DirectorioAcademico.tsx`: nueva interfaz del directorio con búsqueda, paginación, estados vacíos, manejo de errores y enlaces al perfil público.
- `frontend/src/services/perfilService.ts`: contrato tipado y cliente para `GET /perfiles/publicos`. Las fotos se descargan mediante Axios autenticado.
- `frontend/src/types/index.ts`: acceso al directorio para ADMIN, MIEMBRO y REVISOR.
- `frontend/src/App.tsx`: ruta protegida `/dashboard/directorio`.
- `frontend/src/layouts/DashboardLayout.tsx`: título de navegación.

## Requisitos

API en `http://localhost:8001` con el parche del directorio instalado y comprobado (GET /perfiles/publicos). El endpoint requiere JWT.

## Instalación en Windows

1. Descomprimir y abrir `frontend` en VS Code.
2. `Copy-Item .env.example .env` (si todavía no existe).
3. En `.env`: `VITE_API_URL=http://localhost:8001`.
4. `npm.cmd ci`
5. `npm.cmd run build`
6. `npm.cmd run dev`
7. Ingresar y seleccionar **Directorio académico** desde el menú lateral.

**No reemplazar ni mover el backend Docker actual.** Mantener las versiones anteriores como respaldo hasta validar los flujos.

## Pendiente de validación

- Inicio de sesión y navegación con roles MIEMBRO y REVISOR.
- Búsqueda real y acceso a perfiles públicos y privados (el segundo debe quedar protegido).
- Fotografías autenticadas y comportamiento en móviles.
- Auditoría de vulnerabilidades reportadas por npm.
