# Activar consultas de palabras con Azure F0

Estado: integración preparada; falta crear/configurar el recurso real. El código por sí solo no crea Azure ni prueba que un recurso sea gratuito.

## 1. Crear y verificar el recurso

En https://portal.azure.com busca **Translator** y crea un recurso de servicio único. Elige la tarifa **F0 (Free)**. Comprueba después en el recurso que el SKU es **F0**, anota su región y abre **Keys and Endpoint**. Si F0 no está disponible, detente: no elijas S1 ni un plan de pago.

Presupuesto autorizado para Translator: **USD 0/mes**, usando F0 real. F0 tiene un límite de 2 millones de caracteres al mes y deja de atender al agotarse; no es un descuento de los primeros 2 millones en S1. Cambiar a un SKU de pago requiere una decisión nueva. El alojamiento Vercel continúa sujeto a las cuotas y costes de tu plan actual.

## 2. Configurar Vercel sin compartir secretos en el chat

Abre el proyecto https://vercel.com/edwins-projects-f0f5d6e3/readlingo/settings/environment-variables . Añade estas variables para **Production**:

| Variable | Valor |
| --- | --- |
| `AZURE_TRANSLATOR_KEY` | Clave del recurso Translator; sólo servidor |
| `AZURE_TRANSLATOR_REGION` | Región exacta del recurso, por ejemplo `eastus` si es la elegida |
| `AZURE_TRANSLATOR_TIER` | `F0`, después de comprobar el SKU real |
| `READLINGO_TRANSLATION_ACCESS_KEY` | Código personal aleatorio distinto de la clave Azure, al menos 32 caracteres |
| `READLINGO_TRANSLATION_ENABLED` | `true`, sólo después de verificar las anteriores |

Genera el código personal en tu propio terminal con:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Marca las claves como sensibles y guarda el código personal en tu gestor de contraseñas. No lo incluyas en el repositorio. El código permite usar tu cuota gratuita: compártelo únicamente contigo mismo. La app no almacena ese código; el navegador puede ofrecer guardarlo en su gestor de contraseñas.

Las variables no actualizan un despliegue existente. Vuelve a desplegar el proyecto después de guardarlas. No cambies el endpoint del proveedor ni agregues claves al frontend.

## 3. Usar y verificar

En https://readlingo.arcdata.app selecciona una palabra, introduce **tu código personal** (no la clave Azure) y pulsa **Consultar traducción en línea**. El aviso junto al botón explica que se enviará esa palabra a Azure. No se envían el libro, la oración ni audio. Compara una muestra de palabras con un diccionario antes de confiar en los sentidos.

La respuesta se guarda en una caché local de hasta 500 palabras, que se reutiliza sin nueva consulta. **Aprender** incorpora el significado y su origen a tu vocabulario y al respaldo JSON. La caché sola no está incluida en el respaldo y puede perderse al borrar datos del navegador. Fallos de almacenamiento muestran un aviso y permiten reutilizar el resultado durante la sesión.

No hay traducción automática al señalar una palabra, traducción de libros completos, evaluación de audio ni traducción de oraciones en Vercel. Una traducción aislada no determina el sentido de una oración.

## Controles y límites

- API privada: Bearer personal, HTTPS, origen exacto, consentimiento explícito y palabra única de hasta 80 caracteres (la interfaz aplica 60).
- Cuerpo JSON máximo 1024 bytes, timeout Azure 8 segundos, sin reintentos ni redirecciones. Errores sanitizados; sin logs de palabras o claves.
- Activación deshabilitada por defecto; F0 declarado no equivale a consultar el SKU real. La verificación administrativa del paso 1 es obligatoria antes de habilitar.
- El límite mensual lo aplica Azure F0. No hay contador diario global propio ni promesa de disponibilidad si otras apps usan el mismo recurso.
- Para desactivar, cambia `READLINGO_TRANSLATION_ENABLED` a `false` y vuelve a desplegar. Si se expone el código personal o la clave Azure, rótalos en el servicio correspondiente.

## Fuentes oficiales, consultadas 2026-10-07

- https://learn.microsoft.com/en-us/azure/ai-services/translator/how-to/create-translator-resource
- https://www.microsoft.com/en-us/translator/business/faq/
- https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate
- https://vercel.com/docs/functions/runtimes/node-js

Contratos probados con respuestas simuladas: Node 24.16.0, Azure Translate API 3.0. Las pruebas simuladas no validan el recurso, su facturación ni la calidad real de Azure.
