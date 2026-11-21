# InvestigaTec 2.0 — edición corregida

Aplicación de gestión académica con **React + TypeScript + Vite**, **FastAPI**, **PostgreSQL**, JWT, perfiles, proyectos, documentos PDF/DOCX, versiones, revisiones, seguimiento, notificaciones y administración de roles.

## Requisitos locales

- Docker Desktop con Docker Compose y contenedores Linux.
- Git (opcional). Para desarrollo manual del frontend, Node.js 22 o superior.
- Para desarrollo manual del backend, Python 3.13 (Docker ya contiene Python).

## Iniciar todo con un solo comando

1. Copia `.env.example` a `.env` desde PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. En `.env` reemplaza las dos apariciones de `CAMBIAR_ANTES_DE_USAR` por **la misma contraseña de PostgreSQL**. Genera una clave JWT única:

   ```powershell
   $bytes = New-Object byte[] 32
   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   $rng.Dispose()
   -join ($bytes | ForEach-Object { $_.ToString("x2") })
   ```

   Pega el valor en `SECRET_KEY`. **No publiques `.env` ni reutilices contraseñas reales en repositorios.**

3. Arranca Docker Desktop y, desde la raíz del proyecto, ejecuta:

   ```powershell
   docker compose up -d --build
   ```

   El backend espera a PostgreSQL, ejecuta `alembic upgrade head` y asegura los roles MIEMBRO, REVISOR y ADMIN. El frontend también se compila y sirve desde Docker.

4. Abre:

   - Sitio: http://localhost:5173
   - API/Swagger: http://localhost:8001/docs
   - Estado de la BD: http://localhost:8001/health

5. Crea el primer administrador desde la raíz:

   ```powershell
   docker compose exec api python -m app.db.seeds.crear_admin
   ```

   El script solicita los datos interactivamente y no imprime la contraseña.

## Documentos y resúmenes

- Se admiten PDF y DOCX, con historial de versiones y revisión.
- El resumen **se extrae** de un encabezado real «RESUMEN» / «ABSTRACT»; no se genera con IA. Si la detección es dudosa, devuelve «No se detectó un resumen» en lugar de contenido incorrecto.
- En **Detalle del proyecto** el propietario o administrador puede seleccionar **Actualizar resumen** para reprocesar una versión previamente cargada.
- Para reprocesar muchos documentos, **respaldar PostgreSQL antes** y ejecutar:

   ```powershell
   docker compose exec api python -m app.db.seeds.reprocesar_resumenes --dry-run
   docker compose exec api python -m app.db.seeds.reprocesar_resumenes --apply
   ```

   `--apply` sustituye el texto anterior, incluso por `NULL` si ya no se encuentra un resumen confiable. El archivo original y su historial no cambian.

## Consulta DOI

En **Mis documentos** hay una búsqueda por DOI. React envía el identificador al backend, FastAPI valida el DOI y consume la API pública de Crossref. Requiere Internet al consultar; no tiene claves y no modifica la BD.

## Actualizar una instalación anterior

- **Conserva tus archivos originales** `.env`, `storage/`, el respaldo de PostgreSQL y cualquier configuración local. El ZIP corregido **no los incluye** por privacidad.
- Si reemplazas el código en el mismo directorio, no borres la carpeta `storage/` ni el volumen de PostgreSQL.
- Si ya tienes un volumen PostgreSQL inicializado, **no cambies unilateralmente la contraseña del usuario de esa BD**: modificar `.env` no cambia automáticamente la contraseña dentro del volumen.
- Vuelve a ejecutar `docker compose up -d --build` y revisa `docker compose logs --tail=100 api`.
- **No uses `docker compose down -v`** salvo que quieras eliminar permanentemente la base de datos local.

## Pruebas

```powershell
# Dentro de Docker (si pytest no está en la imagen, instalar deps-dev en un entorno de desarrollo)
docker compose exec api python -m compileall -q app

# Alternativa local con venv y dependencias (backend/ como directorio actual)
python -m pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests -q

# Frontend, desde frontend/
npm ci
npm run lint
npm run build
```

Las pruebas del backend utilizan SQLite temporal aislado de los datos reales. En GitHub Actions se ejecutan pruebas y compilación en Linux. **Una prueba completa con PostgreSQL, navegador y Docker sigue siendo necesaria antes del despliegue real**.

## Publicación en Internet

Se debe configurar un proveedor externo para PostgreSQL y backend, y un hosting de frontend. En el despliegue público establece `VITE_API_URL` con la URL HTTPS real de la API **durante la compilación del frontend**, y configura `CORS_ORIGINS` con el origen público del frontend. La URL `localhost` solo funciona en la propia máquina.

## Seguridad

`.env`, los volcados de PostgreSQL, los archivos subidos y `.git` privado no forman parte del ZIP de distribución. Si compartiste el archivo ZIP original con credenciales reales, cambia esas credenciales. No muestres tokens o contraseñas en capturas de clase.

## Documentación académica

- `docs/AUDITORIA_Y_CORRECCIONES.md`: alcance, cambios, comprobaciones y limitaciones.
- `docs/HISTORIAS_USUARIO.md`: historias sugeridas para crear como Issues de GitHub.
- `AI_USAGE.md`: plantilla de declaración de IA que debe revisarse y completarse.
