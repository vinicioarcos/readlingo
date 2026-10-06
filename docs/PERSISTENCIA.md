# Persistencia del dispositivo

Implementada el 2026-10-06. Libros, vocabulario, fuente del significado, posiciones y repaso permanecen en IndexedDB del navegador y dominio actuales. No hay sincronizaci?n entre dispositivos ni servicios externos; el audio permanece temporal en memoria.

## Contrato
web/storage.js guarda una instant?nea validada con revisi?n dentro de una transacci?n. Migra readlingo.v1 sin eliminar la copia anterior. Dos pesta?as combinan sus cambios respecto a su lectura inicial; cambios simult?neos sobre la misma clave usan el ?ltimo guardado. La pantalla se actualiza al guardar o recargar; no hay actualizaci?n autom?tica de otra pesta?a.

Una lectura corrupta bloquea guardados normales y ofrece descarga del original para recuperaci?n. Restaurar una copia v?lida desbloquea el guardado. Restauraci?n y restablecimiento confirman la transacci?n antes de cambiar la biblioteca visible. Los fallos de escritura mantienen un aviso visible y permiten exportar los datos de la sesi?n.

Si IndexedDB no est? disponible al abrir, se usa localStorage con aviso de capacidad limitada; ese respaldo no garantiza atomicidad entre pesta?as. Los errores de una base abierta no provocan una migraci?n silenciosa a otro almacenamiento.

El bot?n Proteger almacenamiento local solicita StorageManager.persist. El navegador puede denegarlo; no evita borrado expl?cito, p?rdida del dispositivo, modo privado ni cambios de dominio. Exportar una copia JSON contin?a siendo necesario para recuperaci?n independiente del navegador.

## Nube pendiente
La sincronizaci?n necesita cuentas, aislamiento por usuario, almacenamiento privado, pol?tica de conflictos y consentimiento antes de transferir libros. No se ha creado un recurso facturable. La elecci?n del usuario sobre sincronizaci?n permanece pendiente; esta entrega mejora la persistencia local sin transferir libros.

## Fuentes
Documentaci?n oficial consultada el 2026-10-06: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist y https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API. API nativa, sin dependencia de ejecuci?n. Playwright 1.62.1 se usa solamente para pruebas. Vercel: https://vercel.com/docs/storage.
