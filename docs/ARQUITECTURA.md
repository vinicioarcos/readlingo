# Arquitectura · decisiones 2026-10-06

## ADR-001: ejecución local portable
Python 3.11+ y biblioteca estándar sirven API y HTML/CSS/JavaScript. Sin instalación npm, framework o base externa. Motivo: entregar un lector ejecutable en VS Code con mínima fricción y permitir auditar manejo de libros y audio. Esta decisión no supone que un servidor de desarrollo sea adecuado para producción.

## ADR-002: agentes de desarrollo
Los agentes viven en AGENTS.md y .github/agents. El IDE aporta la ejecución y sus permisos. No se añade un runtime de agentes al lector: no hace falta para reproducir audio, importar libros o programar tarjetas. Si se añade tutor autónomo, tomar una decisión separada de runtime, herramientas, evaluaciones y presupuesto; considerar eve y leer su documentación versionada antes de implementarlo.

## Componentes
| Componente | Responsabilidad | Datos |
| --- | --- | --- |
| web/ | Lector, voces, tarjetas, grabación | localStorage; audio temporal en memoria |
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
