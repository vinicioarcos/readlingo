# Producto y aceptación

ReadLingo es un MVP local para aprender inglés mediante lectura. Usuario inicial: adulto hispanohablante, con interés en vocabulario general y académico. Las etiquetas A2/B1/B2 de los textos son orientativas, no niveles certificados del usuario.

## Referencia observada
El video aportado appleelibros.mp4 dura aproximadamente 35,5 segundos. Muestra un texto con palabras seleccionables, una tarjeta con traducción y audio, opciones de aprendido/aprender y un indicador de vocabulario. No demuestra una evaluación fonética del usuario ni permite verificar el algoritmo pedagógico de EWA. La página de Facebook no pudo recuperarse; se consultó también el sitio oficial de EWA.

## Flujos
| Historia | Criterio de aceptación |
| --- | --- |
| Abrir lectura | Seleccionar texto, navegar y recuperar posición tras recargar. |
| Consultar palabra | Mostrar glosa/IPA disponible y estado desconocido honesto; escuchar la palabra. |
| Comprender contexto | Leer la oración original y solicitar traducción de la oración si el proveedor está configurado. |
| Escuchar | Elegir voz inglesa y velocidad; detener reproducción; resaltar la frase actual. |
| Practicar | Seleccionar frase, grabar hasta 20 s, detener y escuchar; micrófono liberado al terminar. |
| Evaluar | Envío explícito a Azure; resultados del proveedor o error visible, nunca calificación sintética. |
| Recordar | Guardar vocabulario, revelar respuesta y programar repaso con dificultad declarada. |
| Importar | TXT UTF-8 o EPUB sin DRM; se conserva texto, no maquetación original. |
| Controlar datos | Progreso en navegador, exportación y borrado; sin cuenta ni sincronización en esta entrega. |

## Política pedagógica
Sesión sugerida de 10 minutos: leer 4, escuchar 2, repetir 2, repasar 2. Es una propuesta de uso, no una promesa de eficacia. Medir recuerdo diferido, comprensión y desempeño oral por separado. Marcar 'aprendida' es una autodeclaración; no equivale a dominio demostrado. Evitar premiar clics como si fueran aprendizaje.

La pronunciación automática es retroalimentación orientativa. En piloto real contrastar con dos evaluadores humanos, ruido, dispositivos y variedades del español; valorar inteligibilidad, no eliminación del acento. No derivar nivel CEFR a partir de una nota de pronunciación.

## Fuera de la versión local
Cuentas, sincronización, catálogo comercial, pagos, OCR/PDF, EPUB con DRM, conversación abierta con tutor LLM, PWA offline completa y despliegue público. Ver backlog para evolución. El motor de tutor autónomo no está implementado; los agentes incluidos construyen y revisan el software.
