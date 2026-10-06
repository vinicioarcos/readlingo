# Proceso de trabajo en VS Code

## Preparar
Abrir la carpeta ReadLingo. Instalar Python compatible y usar un asistente de programación ya autorizado por el usuario. Los archivos de .github/agents describen perfiles del IDE. Seleccionar Orquestador cuando la integración los detecte. Herramientas y disponibilidad dependen del asistente y versión instalada. Si no aparecen, usar AGENTS.md con el prompt de prompts/INICIAR.md; no inventar comandos de extensión.

Los perfiles usan nombres sin modelo fijado: se utiliza el disponible en la sesión. En el entorno Local de VS Code, la delegación requiere la herramienta de agentes; el anidamiento usa chat.subagents.allowInvocationsFromSubagents. Está habilitado en .vscode/settings.json para este proyecto. Otros motores administran subagentes de forma propia; verificar en su configuración. No se configura aprobación automática ni acceso irrestricto.

## Planificar y ejecutar
1. Seleccionar historia del backlog, asignar propietario y aceptación; pasar a in_progress.
2. Producto aclara conducta observable; Desarrollo define contrato antes de distribuir archivos.
3. Lector y Voz pueden trabajar en paralelo únicamente con fronteras de archivos acordadas. Si ambos necesitan app.js, trabajan secuencialmente o en ramas con integración deliberada.
4. Calidad encarga revisión a Seguridad y Pedagogia. Informes señalan evidencia, severidad y corrección, no sólo opiniones.
5. Orquestador integra, ejecuta verificaciones, resuelve hallazgos y registra pendiente real. Una prueba omitida queda como pendiente, no como aprobación.
6. Actualizar docs/VERIFICACION.md, management/backlog.csv y CHANGELOG.md con la misma entrega.

## Plantilla de delegación
ID: __. Objetivo: __. Contexto/contrato: __. Entradas: __.
Archivos permitidos: __. No tocar: __. Resultado observable: __.
Pruebas requeridas: __. Tiempo o presupuesto: __. Detener si: __.
Entrega: resumen + archivos + evidencia + limitaciones.

## Actualización y reproducibilidad
Antes de integrar una API, comprobar documentación oficial y fecha. Antes de añadir librerías, registrar versión exacta y archivo lock. La versión base no tiene dependencias externas de ejecución. No afirmar 'todos los procesos actualizados para siempre': la revisión aquí tiene fecha 2026-10-06 y la siguiente actualización debe dejar evidencia.

## Git y CI
Inicializar git sólo en una carpeta propia: git init; revisar git status antes de añadir archivos. .gitignore excluye credenciales, audio y datos locales. La CI incluida ejecuta pruebas en Python 3.11 y 3.12 y comprueba JavaScript con Node 22. Cada PR incluye problema, cambio, evidencia y limitaciones. Preparar rollback con etiqueta de versión, respaldo/exportación de datos y migraciones reversibles antes del despliegue público.

## Presupuesto
Esta app local no necesita una API LLM. El asistente del IDE y los servicios Azure tienen sus propias condiciones y posibles costes. Antes del piloto público medir minutos evaluados, caracteres traducidos y coste por alumno; fijar cuota por usuario y alerta de gasto. Los archivos de agentes no crean cuentas, créditos ni trabajadores automáticos por sí solos.
