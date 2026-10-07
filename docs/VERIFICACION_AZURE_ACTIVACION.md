# Activación de Translator en producción · 2026-10-07

El usuario confirmó que creó el recurso Azure Translator F0 y guardó las variables privadas en Vercel. No se inspeccionó el SKU desde Azure ni se recuperaron secretos.

Vercel CLI 59.5.0 mostró cuatro variables Sensitive en Production: AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION, AZURE_TRANSLATOR_TIER y READLINGO_TRANSLATION_ACCESS_KEY. Se añadió READLINGO_TRANSLATION_ENABLED=true, también Sensitive.

Se volvió a desplegar el código existente con `vercel.cmd redeploy readlingo-b2o3lbuh2-edwins-projects-f0f5d6e3.vercel.app --target production --scope edwins-projects-f0f5d6e3`. El despliegue readlingo-p1s0rxwb8-edwins-projects-f0f5d6e3.vercel.app terminó Ready y recibió el alias https://readlingo.arcdata.app.

Comprobaciones ejecutadas:

- GET https://readlingo.arcdata.app/api/config respondió con translation=true, pronunciation=false, requiresAccess=true, wordOnly=true, provider=Azure Translator y plan=F0.
- POST https://readlingo.arcdata.app/api/translate con Origin correcto, JSON {"text":"hello","consent":true} y sin Authorization devolvió HTTP 401.
- POST con código inválido devolvió HTTP 401; una solicitud con origen https://example.org devolvió HTTP 403.
- Las rutas /.env, /server.py y /lib/translation.mjs devolvieron HTTP 404. No se expusieron estos archivos.

Estas comprobaciones validan activación y rechazo de acceso sin código; no prueban la autenticación ante Azure, el SKU real ni la calidad de traducción. Las variables Sensitive no se descargaron ni se imprimieron.

Confirmación del usuario el 2026-10-07: tras solicitar la prueba de hello con su código privado en el dominio principal, respondió «Si traduce». Se registra como confirmación del usuario de funcionamiento de traducción real, no como una prueba ejecutada u observada directamente por el asistente. No se recibió el texto de respuesta ni una captura del origen, y no se compartieron credenciales.

Pendiente: comprobar reutilización de caché tras recargar con el proveedor real y revisar una muestra de calidad lingüística. La caché y los errores ya cuentan con pruebas de contrato simuladas; la confirmación actual no amplía esa evidencia.

Estado T025: live_translation_confirmed_by_user. Las pruebas previas con proveedores simulados siguen siendo evidencia de contratos; la consulta real se confirma por reporte del usuario.
