# Evidencia de verificación · 2026-10-06

Estado actual: MVP local y demo estática HTTPS publicados. Importación TXT/EPUB privada en navegador. Sin validación real de Azure ni micrófono físico; backend público completo pendiente.

## Importación EPUB cliente · 2026-10-06

T021 completada y verificada en el despliegue. Pruebas ejecutadas antes de publicar:
- `node --check web/app.js`, `node --check web/epub.js`, sintaxis de browser_smoke.cjs y compilación de cuatro archivos: PASS.
- `node --test tests/test_frontend.cjs`: 10 PASS. EPUB cliente sin API, texto original y aviso de idioma; error no altera datos.
- `node --test tests/test_epub.cjs`: 9 PASS. ZIP stored/deflate, CRC, tamaños, duplicados, rutas, solapamientos, descriptores, ZIP64 y expansión real acotada. XML completo se prueba en navegador.
- Backend local: 17 PASS y 1 SKIP por permisos de enlaces simbólicos en Windows.
- Revisión independiente E02 y smoke contra demo estática: Chrome 154.0.8037.95 y Edge 154.0.4258.62, ambos PASS, 17 flujos, cero errores de página y cero solicitudes API.
- EPUB original de prueba generado en memoria: orden spine independiente del orden ZIP, título/idioma, lectura, vocabulario y posición tras recargar; texto importado incluido en exportación/restauración completa.
- EPUB2 con DOCTYPE XHTML externo eliminado, entidades tipográficas habituales y ofuscación IDPF de fuente: PASS. Scripts/estilos/recursos remotos no se ejecutan ni se cargan. Rechazos de corrupción, cifrado, DRM, XXE, traversal, profundidad 300 y expansión DEFLATE real de 6 MiB con tamaño declarado 1 preservan datos.

El libro no se traduce automáticamente: se conserva el idioma original. Sin imágenes ni maquetación; límite de texto 500.000 caracteres. Entidades XML internas, capítulos no XHTML, ZIP64 y cifrado textual no compatibles. Se exige descompresión nativa deflate-raw en navegador moderno. No se usaron libros privados ni se añadieron bibliotecas de ejecución. Hardware y Azure real siguen pendientes históricos.

Verificación pública ejecutada sobre código `7e7f9fa`, despliegue READY `dpl_Hk3P52XsXo2vhSBs2NjZKE6Lq4KQ`: Chrome 154.0.8037.95 en https://readlingo.arcdata.app y Edge 154.0.4258.62 en https://readlingo-eight.vercel.app, ambos 17 flujos PASS, cero errores JavaScript/cero solicitudes API. Los cuatro recursos públicos responden 200 y su contenido coincide con la compilación verificada (normalizando finales de línea). CSP mantiene connect-src none; servidor, .env, README y API de importación responden 404. CI de código aprobada: https://github.com/vinicioarcos/readlingo/actions/runs/37536529956, Python 3.11/3.12, Node 22, 18 backend/10 frontend/9 ZIP, sintaxis y compilación. No hay monitoreo continuo configurado; la evidencia corresponde a los recorridos y comprobaciones HTTP ejecutados.

## Demo estática Vercel · 2026-10-06

Validación antes de despliegue: 9 pruebas frontend PASS y sintaxis PASS. Backend local: 17 PASS y 1 SKIP por privilegio Windows de enlace simbólico. Compilación Node sin dependencias: sólo index.html/app.js/styles.css en dist; modo demo explícito.

Revisión independiente DQ01 y smoke real en Chrome/Edge contra http://127.0.0.1:8766: PASS, 15 flujos, cero errores de página y cero solicitudes API. TXT UTF-8 con HTML se presenta como texto sin ejecución; EPUB rechazado sin cambiar progreso. Exportación/borrado/restauración y rechazo de respaldo inválido aprobados. Grabación simulada y WAV PCM16 mono 16 kHz; escritorio y ancho móvil sin desbordamiento. Smoke contra servidor local original también PASS, 12 flujos. Hardware y Azure real siguen pendientes.

Despliegue de código `6626e88` READY en Vercel (producción, proyecto readlingo, equipo edwins-projects-f0f5d6e3). CI https://github.com/vinicioarcos/readlingo/actions/runs/37535036747 aprobada en Python 3.11/3.12, Node 22 y compilación estática.

Verificación remota ejecutada: Chrome contra https://readlingo-eight.vercel.app y Edge contra https://readlingo.arcdata.app: ambos PASS, 15 flujos, cero errores de página y cero solicitudes API. HTTPS y headers CSP/Permissions-Policy aplicados. En ambos dominios `/`, `/app.js` y `/styles.css` devuelven 200; `/server.py`, `/.env`, `/README.md` y `/api/config` devuelven 404. Captura móvil inspeccionada: lectura y controles sin superposición. T020 completada; no equivale a completar el backend público T013 ni hardware/Azure reales. La observabilidad de esta demo se limita a comprobaciones HTTP y errores de página del recorrido; no se declara monitoreo continuo ni drenajes configurados.

## Entrega local completada · 2026-10-06

Resultados actuales (sustituyen los pendientes históricos de navegador y Git):
- Backend Python 3.14.5: 17 PASS, 1 SKIP por privilegio de enlaces simbólicos en Windows; sin fallos.
- Frontend Node 24.16.0: 8 PASS; sintaxis de app.js y browser_smoke.cjs aprobada.
- Navegador real: `READLINGO_BROWSER_CHANNEL=chrome` y `msedge`, ambos PASS con `node tests/browser_smoke.cjs`. Micrófono simulado; no hardware real.
- Flujos: glosario, vocabulario, repaso, posición persistente, origen del significado, TXT, descarga de respaldo, borrado, restauración completa, rechazo sin pérdida, grabación simulada y WAV mono PCM16 a 16 kHz. Sin errores de página; ancho móvil 390 px sin desbordamiento. Capturas locales en artifacts/.
- T008/T018/T019 completadas: restauración validada antes de reemplazar datos y sin pérdida ante cuota; traducción visible prioritaria y fuente persistente en tarjeta/vocabulario/repaso.
- Revisión independiente Q02/Q03: corrección del límite de respaldo a 64 MiB, validación de IDs/entradas peligrosas y persistencia transaccional. Correcciones visuales: foco sólo para elemento activo y controles de respaldo móvil sin superposición.
- Git ahora está inicializado, en main, con origin apuntando a https://github.com/vinicioarcos/readlingo.git. Se conserva el commit inicial existente.

Herramienta de prueba local: Playwright 1.62.1, mantenido por Microsoft, Apache-2.0, instalado sin dependencia de ejecución de la app. Documentación oficial consultada el 2026-10-06: https://playwright.dev/docs/library. `npm audit` no se completó: instalación temporal sin lockfile; no se afirma auditoría de vulnerabilidades aprobada. La app sigue sin dependencias externas de ejecución.

Pendiente: micrófono físico/voces, Azure real, docente y validación de producción. Los estados y limitaciones siguientes documentan revisiones anteriores.

## Revisión del estado · 2026-10-06 (entorno Windows actual)

- `python -m unittest discover -s tests -v`: 18 pruebas descubiertas, 17 aprobadas y 1 omitida; sin fallos. La prueba de escape mediante enlace simbólico no pudo ejecutarse por falta de privilegio de Windows (WinError 1314). No se cuenta como aprobada.
- `node --check web/app.js`: aprobado.
- `node --test tests/test_frontend.cjs`: 5 aprobadas, sin fallos; DOM simulado.
- Versiones ejecutadas: Python 3.14.5 y Node v24.16.0. Esto no valida la matriz de CI de Python 3.11/3.12 y Node 22.
- `git status --short`: la carpeta actual no es un repositorio Git; no se puede comprobar historial ni cambios respecto a una revisión anterior.
- Playwright no está instalado en este entorno (`require.resolve('playwright')` falla). No se ejecutó `tests/browser_smoke.cjs`; navegador real, micrófono, voces y proveedores reales siguen pendientes.
- Backlog: 3 tareas `implemented`, 1 `implemented_not_live_validated` y 13 `pending`. Esta revisión no completa tareas de piloto o producción ni cambia sus estados.

Revisión estática independiente Q01: dos hallazgos de severidad media, pendientes de corrección y prueba de comportamiento. La fuente Azure aparece en un aviso temporal, pero no se conserva en vocabulario/repaso y la tarjeta mantiene la etiqueta de glosario local (`web/app.js`, funciones de traducción, guardado y repaso; `web/index.html`). Además, `saveWord` prioriza la glosa local o guardada sobre una traducción nueva visible; volver a seleccionar la palabra también prioriza el glosario. La reproducción en navegador no se ejecutó. Se registran como T018 y T019; con estas nuevas incidencias el backlog queda en 15 tareas pendientes. No se detectó un bloqueo crítico en esta revisión focalizada, que no equivale a validación funcional completa.

La tabla siguiente conserva la evidencia de la entrega anterior; no sustituye los resultados de esta revisión.

## Ejecutado
| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| unittest backend Python 3.12 | 18 PASS | Importación, WAV, contratos simulados y fronteras HTTP |
| node --check web/app.js | PASS | Sintaxis de JavaScript |
| node --test tests/test_frontend.cjs | 5 PASS | Lógica UI con doble DOM; no navegador real |
| Revisión independiente | Correcciones integradas | Párrafos grandes, cuota, solicitudes duplicadas, portabilidad de pruebas |

Pruebas backend: TXT UTF-8, orden spine EPUB, eliminación de scripts, entradas ZIP inseguras, expansión excesiva, XML con entidades, referencias externas, formatos WAV y truncamiento, falta de claves, respuestas Azure planas/anidadas, métricas ausentes, traducción, .env literal, Host/Origin, límites de solicitudes y rutas fuera de web/.

Pruebas frontend: inicio y glosario, guardar/repasar y fecha de próximo repaso; texto de aproximadamente 465.000 caracteres fragmentado sin pérdida de contenido no blanco; persistencia fallida con aviso visible; recuperación de posición y rechazo de claves peligrosas; bloqueo de duplicación durante evaluación en curso.

Recursos HTTP verificados con respuesta 200: /, /app.js, /styles.css y /api/config.

## No ejecutado o pendiente
- No se completó prueba de navegador real. Playwright estaba disponible, pero no su ejecutable Chromium. Se intentó instalar; la descarga resultó vacía/truncada. No hay evidencia visual ni de renderizado móvil.
- Micrófono físico, voces de Windows, conversión desde MediaRecorder real y permisos deben verificarse en el equipo del usuario.
- Azure real no fue llamado. Los mocks prueban forma del contrato y errores; no calidad de pronunciación, idioma, cuota, credenciales ni facturación.
- CI se incluye, pero no se ejecutó en GitHub. Sólo se ejecutó localmente Python 3.12; matriz 3.11/3.12 pendiente en CI.
- La detección y ejecución de perfiles en la instalación de VS Code del usuario no se ha verificado. Depende de su motor de agentes y permisos.
- Textos, glosas e IPA necesitan revisión docente antes de un piloto con estudiantes.

## Prueba opcional de navegador
El archivo tests/browser_smoke.cjs contiene el recorrido automatizado preparado, aún no validado en este entorno. Usa Playwright 1.62.1 como herramienta de desarrollo, no dependencia de la app. Desde la raíz, en una instalación npm separada o temporal:

```powershell
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
```

Con `py -3 server.py` activo en otra terminal:

```powershell
node tests/browser_smoke.cjs
```

Recorrido: glosario → guardar → repaso → persistencia → importar TXT → grabación con micrófono simulado → conversión WAV → proveedor no configurado → comprobación de ancho móvil. Genera capturas en artifacts/. El micrófono simulado no valida hardware real ni pronunciación.

## Aceptación manual antes de uso habitual
1. Abrir en Chrome o Edge sobre http://127.0.0.1:8765; probar escritorio y móvil si se habilita posteriormente un entorno HTTPS adecuado.
2. Escuchar tres frases con una voz inglesa disponible; cambiar velocidad y detener.
3. Conceder permiso, grabar voz real, escuchar, cambiar de fragmento y comprobar que el indicador de micrófono se apaga.
4. Importar un TXT y un EPUB propios; navegar, guardar una palabra y recargar.
5. Exportar progreso. La restauración JSON todavía no tiene interfaz; conservar también archivos originales.
6. Sólo si hay recursos configurados: traducir oración; evaluar una grabación con consentimiento; repetir con silencio y ruido y comprobar errores honestos.

No usar como certificador de nivel, calificador automático de estudiantes ni servicio público sin completar las tareas de piloto y producción.

## Persistencia del dispositivo ? 2026-10-06
Historia T022: un lector recupera libros, vocabulario, posiciones y repaso tras cerrar el navegador en el mismo perfil y dominio. IndexedDB migra localStorage conservando el original; protege datos corruptos, muestra fallos de guardado y confirma restauraci?n/restablecimiento antes de cambiar memoria. Dos pesta?as combinan cambios diferentes dentro de una transacci?n; misma clave usa ?ltimo guardado. Contrato y l?mites: docs/PERSISTENCIA.md.

Ejecutado: `node --check web/app.js`; `node --test tests/test_frontend.cjs tests/test_storage.cjs tests/test_epub.cjs`: 26 aprobadas (10 interfaz simulada, 7 combinaci?n, 9 ZIP). Backend `python -m unittest discover -s tests -v`: 17 aprobadas y 1 omitida por privilegio de symlink en Windows. Build genera cinco archivos permitidos; sin nueva dependencia de ejecuci?n. Pruebas reales de navegador y publicaci?n se registrar?n al terminar.

Revisi?n independiente P03 y navegador real local http://127.0.0.1:8766: Chrome 154.0.8037.95 y Edge 154.0.4258.62, `READLINGO_DEMO=1` y canal correspondiente. `node tests/storage_browser.cjs`: 8 flujos por navegador, incluidos migraci?n, primeras importaciones simult?neas, biblioteca mayor de 5 MiB, mezcla de pesta?as, fallo de transacci?n al restaurar, reemplazo/restablecimiento, corrupci?n preservada y cierre/reapertura de perfil persistente sint?tico. `node tests/browser_smoke.cjs`: 17 flujos por navegador. Sin errores JS ni llamadas API. Audio simulado, no hardware real. No se usaron libros privados.

Revisi?n P04 corrigi? interacci?n durante restauraci?n/restablecimiento: body inert y bloqueo de save evitan encolar estado anterior tras reemplazo. Error al abrir IndexedDB existente bloquea guardado en lugar de usar una copia legacy antigua. Recuperaci?n raw sigue disponible sin abrir la base. Copia legacy retenida queda expl?cita en confirmaci?n de restablecer; no equivale a borrado seguro. Importaci?n ya iniciada antes de restablecer puede terminar despu?s y agregar su lectura; no se valida cancelaci?n de esa operaci?n.

P05 tras correcciones: storage_browser 10 flujos aprobados en Chrome y Edge locales, incluyendo reemplazo demorado (inert activo y save no entra en cola) y SecurityError al abrir IndexedDB (copia raw preservada y escritura bloqueada). Cero errores JavaScript.
