# Respuestas de Blackbox

## Análisis de Seguridad MercadoPago - 2025

### Problemas de Seguridad Identificados:

1. **Credenciales Hardcodeadas**: Las credenciales de MercadoPago están expuestas en el código fuente
2. **URLs Hardcodeadas**: URLs de localhost en configuración de back_urls
3. **Implementación Mock**: El endpoint de creación de preferencias devuelve datos simulados

### Archivos que requieren modificación:
- `Backend/src/lib/mercadopago.ts` (credenciales expuestas)
- `Backend/src/app/api/payments/create-preference/route.ts` (respuesta mock)
- Variables de entorno faltantes

### Plan de Acción:
1. Mover credenciales a variables de entorno
2. Implementar integración real con MercadoPago SDK
3. Hacer URLs configurables
4. Documentar variables de entorno requeridas

¿Proceder con la corrección de seguridad?
