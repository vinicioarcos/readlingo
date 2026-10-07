# Historial

## 0.5.1 - 2026-10-07
La voz inglesa elegida se recuerda al volver a abrir el mismo navegador y dominio. Conserva preferencia durante carga tardia o ausencia, recupera por URI o nombre/idioma y muestra fallos de guardado. Configuracion independiente de libros y respaldos.7escenarios por navegador Chrome/Edge aprobados en produccion con sintesis simulada;33tests Node existentes aprobados. T024 completada.

## 0.5.0 - 2026-10-06
Diccionario local ampliado: 751 entradas originales y 796 claves combinadas con el glosario previo. Glosas EN-ES al seleccionar palabras importadas, fuente visible, contracciones y sentidos alternativos, sin enviar texto a terceros. Conserva significados guardados y completa marcadores pendientes al guardar. Node33pass, Chrome/Edge produccion12casos de diccionario y17del lector por navegador. T023 completada; cobertura limitada y revision docente pendiente.

## 0.4.0 ? 2026-10-06
Persistencia local con IndexedDB y migraci?n no destructiva. Transacciones, combinaci?n entre pesta?as, avisos de escritura fallida, recuperaci?n de datos da?ados y protecci?n opcional del navegador. Restauraci?n bloquea interacci?n hasta confirmar el guardado. Libros y progreso sobreviven al reinicio en el mismo perfil y dominio; no hay sincronizaci?n entre dispositivos. Producci?n verificada en Chrome/Edge: 10 escenarios de persistencia y 17 del lector por navegador; CI aprobada. T022 completada.

## 0.3.0 · 2026-10-06
Importación EPUB privada directamente en el navegador y disponible en Vercel. Texto por orden de lectura, título e idioma del libro; sin subir archivos ni ejecutar HTML. Límites ZIP, CRC, descompresión acotada y rechazo de cifrado textual. Mantiene vocabulario, posición y respaldos. EPUB2 con entidades tipográficas habituales y fuentes ofuscadas compatible. El libro conserva su idioma original; no se traduce automáticamente.
Verificación pública Chrome/Edge: 17 flujos PASS; CI aprobada con 18 pruebas backend, 10 frontend y 9 ZIP. T021 completada. Micrófono físico y Azure real siguen pendientes.

## 0.2.0 · 2026-10-06
Demo estática para Vercel con publicación limitada a tres archivos, aviso de alcance e importación TXT local UTF-8. EPUB y Azure se conservan en versión local. CSP bloquea conexiones API en la demo. Pruebas de importación inválida y ausencia de API añadidas; compilación incluida en CI.
Publicación HTTPS verificada en readlingo.arcdata.app y readlingo-eight.vercel.app con Chrome/Edge: 15 flujos aprobados y ningún error de página ni solicitud API. CI aprobada. T020 completada.

## 0.1.1 · 2026-10-06
Restauración de respaldos JSON con validación y protección ante cuota, origen de significado persistente y traducción visible conservada al guardar. Corregidos foco y controles móviles. Ocho pruebas frontend aprobadas y recorrido Chrome/Edge aprobado con micrófono simulado; 17 backend aprobadas y una omitida por permisos de Windows. Revisión independiente completada. Azure real y hardware siguen pendientes.

## Revisión de estado · 2026-10-06
Verificación en Windows con Python 3.14.5 y Node 24.16.0: 17 pruebas backend aprobadas y una omitida por permisos de enlaces simbólicos; 5 pruebas frontend y sintaxis aprobadas. Evidencia actualizada y dos incidencias de vocabulario registradas como T018/T019. Sin cambios de código funcional. Git no inicializado en esta carpeta; navegador real y proveedores siguen pendientes.

## 0.1.0 · 2026-10-06
Primera versión local de ReadLingo: lector, importación, vocabulario, práctica oral y adaptadores opcionales Azure. Perfiles de desarrollo multiagente, pruebas, CI y documentación. Estado de pruebas detallado en docs/VERIFICACION.md. No desplegado ni certificado para uso público.
