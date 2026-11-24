# AI_USAGE.md — Declaración de uso de inteligencia artificial

**Proyecto:** InvestigaTec 2.0  
**Asignatura:** Programación Web (AEB-1055)  
**Equipo:** Víctor Manuel Landeros Ramírez y Karely Perez Vargas
**Fecha de actualización:** 24 de noviembre de 2026

## 1. Herramientas, modelos y responsables

Durante el desarrollo de InvestigaTec 2.0 se utilizó **ChatGPT, de OpenAI**, principalmente como apoyo para redactar y revisar documentación técnica, organizar requerimientos, explicar conceptos y elaborar propuestas de diagramas. También se consultó para diagnosticar errores y proponer ajustes puntuales de implementación.

| Herramienta      | Modelo o versión                                                                              | Integrante                     | Uso principal                                                                              |
|------------------|-----------------------------------------------------------------------------------------------|--------------------------------|--------------------------------------------------------------------------------------------|
| ChatGPT (OpenAI) | GPT-6 en las sesiones recientes; la versión exacta de sesiones anteriores no quedó registrada | Víctor Manuel Landeros Ramírez | Documentación, análisis técnico, diagramas, explicación de código, depuración y despliegue |

**Alcance de esta declaración:** se documentan los usos de IA identificados en las conversaciones de trabajo. Antes de entregar, el equipo debe añadir cualquier otra herramienta utilizada por alguno de sus integrantes; no se atribuye a Karely un uso de IA que no haya sido confirmado.

La IA no figura como autora del proyecto. La selección de soluciones, integración del código, ejecución de pruebas y responsabilidad por los resultados corresponden a los integrantes.

## 2. Harness, modalidad de uso y entorno

Se utilizó **ChatGPT en modo conversacional mediante navegador web**. El flujo habitual consistió en proporcionar preguntas, requisitos, fragmentos de código, documentos y capturas de pantalla; recibir explicaciones, propuestas de redacción, diagramas o correcciones; y después revisar e incorporar manualmente las propuestas pertinentes.

El desarrollo y las verificaciones se realizaron en **Visual Studio Code**, terminal **PowerShell**, **Docker Compose**, navegador y servicios de despliegue. La asistencia de IA se utilizó para orientar comandos y procedimientos, pero las operaciones de Git, GitHub Classroom, Neon, Render y Vercel fueron realizadas y comprobadas por el equipo.

En las sesiones aquí documentadas, el uso principal fue **chat y generación de propuestas**; no se documenta que un agente autónomo haya administrado directamente la infraestructura de producción. Las recomendaciones se sometieron a revisión humana antes de aceptarse.

## 3. Archivos de contexto, instrucciones y recursos

Para contextualizar las consultas se proporcionaron, según la tarea:

- El documento de requisitos de **Proyecto Final Integrador: Programación Web (AEB-1055)**.
- Documentación funcional y técnica del proyecto, capturas de interfaz, errores y registros de ejecución.
- Diagramas de arquitectura y entidad-relación, así como resultados de pruebas y despliegue.

**Instrucciones para asistentes:** no se identificaron, en las sesiones documentadas, archivos de reglas específicos como `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` o reglas de Cursor. Si el repositorio contiene alguno de estos archivos y se utilizó realmente, debe incorporarse aquí y conservarse en Git. No se documentó el uso de servidores MCP o *skills* personalizados por parte del equipo para programar InvestigaTec.

Los archivos originales y las instrucciones de la asignatura prevalecieron sobre cualquier sugerencia generada por IA.

## 4. Bitácora de prompts significativos

Los textos de la columna «Solicitud» son resúmenes fieles de las consultas realizadas. Las fechas que no pudieron confirmarse se identifican expresamente para evitar presentar un registro inventado.

| Fecha                                 | Integrante | Herramienta | Solicitud o prompt significativo                                                                                                                            | Archivos o módulos relacionados                                                             | Revisión y ajustes humanos                                                                                                                                          |
|---------------------------------------|------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Noviembre de 2026 (día por confirmar) | Víctor     | ChatGPT     | Revisar y redactar la documentación de InvestigaTec, incluyendo requerimientos y descripción del sistema, centrándose en el proyecto.                       | Documentos de requisitos y reporte técnico (`docs/` y archivos Word de trabajo)             | Se adaptaron las redacciones al alcance real del sistema y se descartaron afirmaciones no verificadas.                                                              |
| Noviembre de 2026 (día por confirmar) | Víctor     | ChatGPT     | Analizar errores del módulo de resúmenes: texto recortado, contenido irrelevante o información demasiado general; revisar otros módulos.                    | Módulo de resúmenes; componentes y servicios de frontend/backend relacionados               | Se revisó el comportamiento en ejecución y se solicitaron correcciones específicas en lugar de aceptar el diagnóstico sin pruebas.                                  |
| Noviembre de 2026 (día por confirmar) | Víctor     | ChatGPT     | Revisar una versión actualizada del proyecto y proponer correcciones completas sin eliminar funciones existentes.                                           | Archivos de `backend/app/` y `frontend/src/` que correspondieran a los problemas detectados | Se compararon propuestas con el código original y se verificó el funcionamiento mediante Docker y pruebas manuales.                                                 |
| 21/11/2026                            | Víctor     | ChatGPT     | Investigar por qué la consulta de DOI desde InvestigaTec devolvía HTTP 503, aunque una solicitud directa a Crossref desde el contenedor respondía HTTP 200. | `backend/app/api/publicaciones.py` y vista de documentos                                    | Se inspeccionaron logs, se ejecutó la consulta directa con `httpx`, se revisó la implementación y se comprobó finalmente la respuesta bibliográfica en la interfaz. |
| 24/11/2026                            | Víctor     | ChatGPT     | Explicar el despliegue público de React, FastAPI y PostgreSQL utilizando Vercel, Render y Neon.                                                             | Configuración de despliegue, variables de entorno y, cuando aplica, `frontend/vercel.json`  | Se crearon y configuraron los servicios manualmente, se corrigió CORS y se comprobó el acceso público.                                                              |

## 5. Estimación de código generado por IA por carpeta

El **uso predominante de la IA fue documental**. Por ello, la cantidad de texto redactado con apoyo de IA no debe confundirse con el porcentaje de código fuente generado por IA. La siguiente tabla debe completarse mediante una revisión de los cambios realmente incorporados; los porcentajes no pueden deducirse de las conversaciones ni del número de sugerencias recibidas.


| Carpeta | Porcentaje aproximado de código generado por IA | Criterio para estimarlo |
|---|---:|---|
| `frontend/` | **10 %** | Apoyo en correcciones de componentes y módulo de resúmenes. |
| `backend/` | **20 %** | Asistencia en servicios, endpoints, validaciones e integración con Crossref. |
| `db/` | **0 %** | Sin código generado por IA incorporado, sujeto a verificación. |
| `infra/` | **5 %** | Apoyo puntual en configuraciones de Docker y despliegue. |

**Método:** estimación razonada del equipo a partir de `git diff`, historial de commits y archivos finales; no representa una medición automática. Si una carpeta no existe o no recibió código generado por IA, registrar **0 %** y explicarlo. El contenido de `docs/` se describe por separado porque el profesor solicita porcentajes de **código** en las carpetas anteriores.

## 6. Reflexión crítica

El principal beneficio de utilizar IA en InvestigaTec 2.0 fue acelerar la organización de información técnica compleja y facilitar la comprensión de tecnologías utilizadas en conjunto: React, FastAPI, PostgreSQL, Docker y servicios externos. La IA ayudó a estructurar documentos, comparar requisitos con funcionalidades, preparar diagramas y plantear posibles causas de errores. Sin embargo, su respuesta no se consideró evidencia de que una función estuviera implementada o de que una corrección fuera válida.

Un caso concreto ocurrió durante la integración de **Crossref**. La consulta por DOI desde la aplicación devolvía un error HTTP 503, mientras que una petición directa con `httpx` desde el contenedor del backend obtenía una respuesta HTTP 200. Esto mostró que una propuesta de solución asistida por IA no era suficiente para asegurar el funcionamiento del módulo: era necesario distinguir entre la disponibilidad del servicio externo y los problemas en la lógica propia de la aplicación. El equipo revisó los registros del servidor, contrastó las respuestas y probó nuevamente la interfaz hasta obtener los datos bibliográficos. La experiencia también recordó que las sugerencias de IA pueden ser incompletas o no coincidir con la versión actual del código.

La principal lección fue **verificar cada recomendación mediante el código real, pruebas reproducibles y evidencia observable**. En particular, aprendimos a localizar el origen de un error comparando la solicitud de la interfaz, la respuesta de FastAPI y el resultado de una llamada directa al servicio externo. También aprendimos a evitar modificaciones extensas que puedan eliminar funcionalidades existentes. La IA funcionó como apoyo para razonar y documentar, no como sustituto de la comprensión técnica ni de la responsabilidad del equipo.

------------------------------------------------------------------------
