# Historial

## 0.3.0 · 2026-10-06
Importación EPUB privada directamente en el navegador y disponible en Vercel. Texto por orden de lectura, título e idioma del libro; sin subir archivos ni ejecutar HTML. Límites ZIP, CRC, descompresión acotada y rechazo de cifrado textual. Mantiene vocabulario, posición y respaldos. EPUB2 con entidades tipográficas habituales y fuentes ofuscadas compatible. El libro conserva su idioma original; no se traduce automáticamente.

## 0.2.0 · 2026-10-06
Demo estática para Vercel con publicación limitada a tres archivos, aviso de alcance e importación TXT local UTF-8. EPUB y Azure se conservan en versión local. CSP bloquea conexiones API en la demo. Pruebas de importación inválida y ausencia de API añadidas; compilación incluida en CI.
Publicación HTTPS verificada en readlingo.arcdata.app y readlingo-eight.vercel.app con Chrome/Edge: 15 flujos aprobados y ningún error de página ni solicitud API. CI aprobada. T020 completada.

## 0.1.1 · 2026-10-06
Restauración de respaldos JSON con validación y protección ante cuota, origen de significado persistente y traducción visible conservada al guardar. Corregidos foco y controles móviles. Ocho pruebas frontend aprobadas y recorrido Chrome/Edge aprobado con micrófono simulado; 17 backend aprobadas y una omitida por permisos de Windows. Revisión independiente completada. Azure real y hardware siguen pendientes.

## Revisión de estado · 2026-10-06
Verificación en Windows con Python 3.14.5 y Node 24.16.0: 17 pruebas backend aprobadas y una omitida por permisos de enlaces simbólicos; 5 pruebas frontend y sintaxis aprobadas. Evidencia actualizada y dos incidencias de vocabulario registradas como T018/T019. Sin cambios de código funcional. Git no inicializado en esta carpeta; navegador real y proveedores siguen pendientes.

## 0.1.0 · 2026-10-06
Primera versión local de ReadLingo: lector, importación, vocabulario, práctica oral y adaptadores opcionales Azure. Perfiles de desarrollo multiagente, pruebas, CI y documentación. Estado de pruebas detallado en docs/VERIFICACION.md. No desplegado ni certificado para uso público.
