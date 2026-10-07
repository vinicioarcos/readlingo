# ReadLingo

Lee en inglés, consulta vocabulario, escucha y practica tu voz. Proyecto editable en VS Code con agentes de desarrollo y subagentes. Primera entrega local: 2026-10-06.

## Demo web en Vercel

La demo permite leer, pegar texto, importar TXT UTF-8 y EPUB sin DRM, guardar palabras, repasar, escuchar, grabarse localmente y exportar/restaurar respaldos. La consulta de palabras a Azure en Vercel requiere configurar un recurso F0 y un codigo personal; permanece desactivada hasta entonces. La evaluacion de voz solo esta en el servidor local. No hay cuentas ni sincronización: el progreso se conserva por navegador y dirección del sitio. Los TXT y EPUB se leen en tu navegador; la demo no envía libros ni audio a un backend. Algunas voces del sistema pueden usar servicios de voz externos.

Abrir: https://readlingo.arcdata.app (también https://readlingo-eight.vercel.app). Usa siempre el mismo dominio para conservar tu progreso; exporta/restaura el respaldo si cambias de dirección.

Vercel ejecuta `node scripts/build_web.cjs` y publica sólo `dist/`, con seis archivos de interfaz. No instala dependencias ni inicia `server.py`. La compilación activa explícitamente el modo demo y la politica del sitio permite API del mismo origen; Azure se consulta solo desde el backend autenticado. Para una vista local de la demo, ejecuta la compilación y `python -m http.server 8766 --bind 127.0.0.1 --directory dist`.

## Inicio en Windows
1. Descomprime ReadLingo_VSCode.zip en una carpeta propia, por ejemplo `C:\1.-CODIGO\ReadLingo`.
2. Abre la carpeta que contiene este README y server.py en VS Code.
3. Con Python 3.11 o superior instalado, ejecuta en la terminal:

```powershell
py -3 server.py
```

4. Abre http://127.0.0.1:8765 en Chrome o Edge. Usa siempre la misma dirección: `localhost` y `127.0.0.1` tienen almacenamientos del navegador diferentes.
5. Ctrl+C detiene el servidor. No abras index.html con doble clic: importación y APIs requieren el servidor.

En macOS/Linux: `python3 server.py`. No necesita pip ni npm para ejecutarse. Node sólo es opcional para revisar sintaxis JavaScript. También hay tareas en VS Code: Terminal → Ejecutar tarea.

## Qué incluye
- Textos originales de demostración, uno de economía; etiquetas de dificultad orientativas.
- Lector con palabras seleccionables y glosario local de cobertura limitada.
- Escucha mediante voces del navegador, control de velocidad y lectura por frases.
- Vocabulario, posición de lectura y repaso guardados en el navegador.
- Importación TXT UTF-8 y EPUB sin DRM; conserva contenido textual, no diseño/ilustraciones.
- Grabación breve, reproducción de tu voz y envío opcional para evaluación real.
- Adaptadores de traducción EN→ES y evaluación de pronunciación de Azure.
- Ocho perfiles para desarrollo asistido, backlog, proceso, CI y pruebas.

La app no cobra ni usa una API LLM en el modo básico. Algunas voces del sistema pueden necesitar conexión. No se incluye catálogo de EWA, material comercial, cuentas ni sincronización. Los agentes del IDE pueden requerir su propia suscripción.

## Habilitar traducción y evaluación
Ambas integraciones son opcionales e independientes. Crea tus recursos de Azure Translator y Azure Speech en tu cuenta y consulta sus tarifas antes de activarlos. Copia `.env.example` a `.env`:

```powershell
Copy-Item .env.example .env
```

Completa únicamente las claves y regiones del recurso correspondiente y reinicia el servidor. Nunca pegues claves en el chat, HTML o Git. La región debe coincidir con el recurso. Las claves permanecen en Python; el navegador recibe sólo indicadores de configuración.

- Sin Azure: glosario incluido, lectura, síntesis, grabación, escucha y repaso.
- Con Translator: traducción del texto elegido enviada al servicio al solicitarla. Una traducción de palabra aislada no equivale a análisis de sentido contextual.
- Con Speech: la frase y grabación se envían tras consentimiento y pulsación del usuario. La evaluación usa en-US y devuelve las métricas disponibles. No acredita un nivel CEFR.

Los adaptadores se verificaron con respuestas simuladas de contrato. La integración real, facturación, calidad lingüística y desempeño con tu micrófono requieren prueba con tus recursos; no se presentan como validados. La función de práctica no inventa puntuaciones cuando falta proveedor.

## Desarrollo agéntico
Lee AGENTS.md. Selecciona el perfil Orquestador si tu asistente del IDE detecta .github/agents, y envía el contenido de prompts/INICIAR.md. Para otro asistente, dale AGENTS.md y el mismo prompt; la delegación efectiva depende de las herramientas disponibles.

| Rol | Responsabilidad |
| --- | --- |
| Orquestador | Backlog, coordinación, integración y evidencia |
| Producto | Alcance y aceptación |
| Desarrollo | Contratos e implementación; encarga Lector y Voz |
| Lector | Lectura, vocabulario e importación |
| Voz | Síntesis, grabación y evaluación |
| Calidad | Verificación; encarga Seguridad y Pedagogia |
| Seguridad | Secretos, entradas y privacidad |
| Pedagogia | Contenido y validez de indicadores |

Los perfiles guían a los asistentes de programación; no lanzan agentes por sí solos ni constituyen un tutor LLM dentro de la app. docs/PROCESO.md explica cómo continuar.

## Verificar
```powershell
py -3 -m unittest discover -s tests -v
node --check web/app.js
node --test tests/test_frontend.cjs
```

Consulta docs/VERIFICACION.md para resultados reales y comprobaciones pendientes. Flujo manual: abrir texto → consultar palabra → guardar → repasar → importar TXT/EPUB → recargar → comprobar progreso → grabar/reproducir → probar proveedores si se configuran.

## Datos y límites
Los libros y el progreso se guardan en IndexedDB de ese navegador (localStorage limitado si no est? disponible). No se sincronizan. Exporta una copia y conserva tus archivos originales; borrar datos del navegador elimina el progreso. El audio no se persiste en el servidor. Las solicitudes a Azure quedan sujetas a las condiciones del proveedor.

La interfaz admite hasta 30 libros importados de 500.000 caracteres cada uno. Máximos del backend: 10 MiB por archivo, 24 MiB EPUB descomprimido y 1,5 millones de caracteres; la interfaz aplica el límite menor y la cuota del navegador puede agotarse antes. Un EPUB muy grande o con maquetación compleja puede necesitar conversión previa. No admite PDF/OCR ni DRM.

Este servidor escucha sólo en tu equipo y no debe exponerse directamente a Internet. Para una app pública faltan autenticación, cuotas, almacenamiento por usuario y operación de producción: tareas explícitas en management/backlog.csv.

## Estructura
| Ubicación | Contenido |
| --- | --- |
| web/ | Aplicación navegador |
| server.py | Servidor e integraciones |
| tests/ | Pruebas automáticas |
| .github/agents/ | Perfiles de asistentes |
| .github/workflows/ | CI |
| .vscode/ | Tareas y configuración |
| docs/ | Producto, arquitectura, proceso, evidencia y fuentes |
| management/ | Backlog y control de ejecución |
| prompts/ | Instrucción de inicio para el IDE |

Si el puerto 8765 está ocupado, detén la instancia anterior. Si el micrófono no funciona, revisa permisos del navegador y de Windows. Si no hay voz inglesa, instala una en el sistema o selecciona otra voz disponible. Si Azure rechaza una solicitud, revisa región, clave y cuota sin exponer credenciales.

## Respaldo y restauracion
Usa Exportar mi progreso para descargar tus lecturas y palabras. Restaurar respaldo acepta el JSON exportado y pide confirmar el reemplazo del progreso actual. Un archivo invalido o un fallo de cuota conserva los datos actuales. Guarda una copia antes de reemplazarlos.

## Leer un EPUB en inglés
En la aplicación pulsa **Importar libro** y elige un archivo `.epub` sin DRM de una edición en inglés. La importación extrae texto siguiendo el orden de lectura del EPUB; no traduce el libro ni conserva ilustraciones o diseño. Luego puedes seleccionar palabras, escuchar con una voz inglesa y guardar el progreso. El archivo no se sube a Vercel ni a otro proveedor.

Límites del importador del navegador: 10 MiB de archivo, 24 MiB de contenido declarado descomprimido, 1.500 entradas ZIP, 5 MiB por recurso y 500.000 caracteres de texto. Se requiere un navegador moderno con descompresión DEFLATE nativa; textos cifrados, ZIP64 y EPUB con DRM no son compatibles. Se tolera la ofuscación estándar de fuentes, porque no se extraen tipografías. Los EPUB pueden declarar el idioma incorrectamente: importa una edición que sepas que está en inglés.

## Consultar palabras de tu libro
Haz clic o toca una palabra: Tu diccionario muestra la glosa EN-ES disponible y su origen. Incluye vocabulario cotidiano y de ficcion, ademas del glosario anterior. Aprender guarda la palabra para repasar. Las glosas son orientativas de palabra aislada; varias acepciones requieren elegir el sentido de la oracion. No se envia texto a terceros. Si falta una entrada, se indica sin inventar traduccion. El diccionario tiene cobertura limitada y no traduce automaticamente libros completos.

## Voz preferida
Al elegir una voz inglesa se guarda automaticamente para este navegador y dominio. Se recupera al recargar; si no esta disponible se usa la voz del dispositivo sin borrar la preferencia. Elegir Voz inglesa del dispositivo vuelve al valor predeterminado. Preferencia separada de libros y respaldos; restablecer progreso no la borra.

## Traduccion de palabras con Azure F0 en Vercel
Disponible con botón explícito, código personal y resultados reutilizables del navegador. Se envía solo la palabra seleccionada, no el libro ni audio. El usuario confirmó la creación del recurso Translator F0 y el funcionamiento de la traducción real en producción. Se verificó el indicador de disponibilidad y el rechazo 401 de solicitudes sin código. La calidad lingüística y la reutilización de caché con Azure real siguen pendientes de comprobación. Lee docs/AZURE_F0.md para configurar o desactivar el servicio. No compartir claves en el chat.
