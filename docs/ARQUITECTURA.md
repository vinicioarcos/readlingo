# Arquitectura · decisiones 2026-10-06

## ADR-004: demostración estática en Vercel · 2026-10-06

La demo pública publica únicamente los seis archivos de interfaz permitidos mediante `scripts/build_web.cjs` y `vercel.json`, con Node 24.x como herramienta de compilación. HTML generado activa `data-runtime="demo"`; el HTML local conserva sus APIs. TXT se decodifica en el navegador con UTF-8 estricto y se trata como texto no confiable. Azure no está disponible en la demo; EPUB se procesa localmente en el navegador mediante web/epub.js. No hay backend, claves, audio enviado, datos por usuario en servidor ni funciones pagadas; por eso esta entrega no habilita las APIs públicas que requieren autenticación y cuotas. T010/T012/T013 permanecen pendientes para el producto completo.

CSP bloquea conexiones (`connect-src 'none'`), scripts externos y objetos; permite audio blob local y micrófono del mismo origen. Progreso e importaciones permanecen en IndexedDB y el audio en memoria. La síntesis depende de las voces del sistema, que pueden usar red. HTTPS lo aporta Vercel. No se expone el servidor loopback como servidor de producción.

Documentación oficial consultada el 2026-10-06: https://vercel.com/docs/project-configuration/vercel-json y https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/decode. CLI disponible: Vercel 59.5.0; sin instalación ni cambio de dependencia.

## ADR-001: ejecución local portable
Python 3.11+ y biblioteca estándar sirven API y HTML/CSS/JavaScript. Sin instalación npm, framework o base externa. Motivo: entregar un lector ejecutable en VS Code con mínima fricción y permitir auditar manejo de libros y audio. Esta decisión no supone que un servidor de desarrollo sea adecuado para producción.

## ADR-002: agentes de desarrollo
Los agentes viven en AGENTS.md y .github/agents. El IDE aporta la ejecución y sus permisos. No se añade un runtime de agentes al lector: no hace falta para reproducir audio, importar libros o programar tarjetas. Si se añade tutor autónomo, tomar una decisión separada de runtime, herramientas, evaluaciones y presupuesto; considerar eve y leer su documentación versionada antes de implementarlo.

## Componentes
| Componente | Responsabilidad | Datos |
| --- | --- | --- |
| web/ | Lector, voces, tarjetas, grabación | IndexedDB; audio temporal en memoria |
| server.py | Recursos locales y proxy de proveedores | .env y solicitudes temporales |
| Importador | Extraer texto TXT/EPUB por orden de lectura | Sin ejecutar scripts ni extraer ZIP a disco |
| Azure Translator opcional | Traducción EN→ES | Sólo texto enviado al pulsar traducir |
| Azure Speech opcional | Evaluación de lectura oral | Frase de referencia y WAV autorizado |

El servidor sólo escucha 127.0.0.1. Host y Origin se verifican para reducir llamadas desde otras páginas. No hay autenticación de usuarios porque es un MVP personal local; esto debe cambiar antes de publicarlo. El almacenamiento del navegador no está cifrado y puede perderse al borrar los datos del sitio.

## API
| Método y ruta | Entrada JSON | Salida principal |
| --- | --- | --- |
| GET /api/config | — | translation, pronunciation |
| POST /api/import | filename, data (base64) | title, text |
| POST /api/translate | text | translation, source |
| POST /api/pronunciation | reference, audio (base64 WAV) | text, scores, words |

Claves de scores: accuracy, fluency, completeness, pronunciation. words conserva palabra, error y puntuación disponibles. Nunca rellenar una métrica ausente con cero: ausencia y mal desempeño son cosas distintas.

## ADR-003: práctica y evaluación separadas
Voz modelo: síntesis del navegador y voces instaladas. Grabación: MediaRecorder. Conversión: WAV PCM 16 bits mono 16 kHz antes de enviar. Evaluación: Azure short-audio, con límite local de grabación. Disponibilidad y calidad de voces dependen del navegador/sistema; algunas voces pueden usar servicios externos del sistema.

## Evolución pública
Mantener dominio y lógica de lectura; migrar servidor a backend de producción con autenticación, autorización por usuario, límites diarios, presupuesto, auditoría sin texto privado, política de borrado y almacenamiento privado. Usar base de datos para progreso y objetos privados para libros. Probar exportación/migración desde localStorage. Elegir alojamiento tras medir límites del audio y concurrencia: no presentar este servidor como directamente desplegable en Vercel.

## ADR-005: EPUB privado en el navegador
Importador cliente sin dependencias externas de ejecución, con ZIP limitado, descompresión nativa y XML inerte. Sigue container/manifest/spine, entrega título/texto/idioma, valida integridad y limita entradas/expansión. El lector usa nodos de texto; nunca inserta HTML de un libro. La demo mantiene connect-src none y no envía libros ni audio. EPUB y TXT importados permanecen en el almacenamiento del navegador con los mismos límites y respaldos. El texto original no se traduce; metadatos no ingleses generan un aviso.

## Diccionario local - 2026-10-06
web/dictionary.js aporta entradas originales EN-ES como [glosa, IPA opcional], congeladas y sin prototipo. Se combina con el glosario anterior conservando su IPA; búsqueda exacta en minúsculas y normalización de apóstrofo tipográfico, sin inferir traducciones por sufijos. Fuente visible y almacenada. Sin nuevas dependencias, claves o peticiones externas; connect-src none se conserva. APIs oficiales consultadas: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn y https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll. Versión probada se registra en VERIFICACION.
