# 🔧 PLAN DE CORRECCIÓN - PROBLEMAS CRÍTICOS DETECTADOS EN AUDITORÍA

## PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **DESALINEACIÓN SCHEMA VS VALIDACIÓN**
- **Problema:** Campo `propertyType` en Prisma vs `type` en Zod
- **Impacto:** Inconsistencia que puede causar errores de mapeo
- **Solución:** Unificar nombres de campos

### 2. **CAMPOS JSON COMO STRING SIN VALIDACIÓN**
- **Problema:** `images`, `amenities`, `features` como String sin validación JSON
- **Impacto:** Datos corruptos, errores de parsing
- **Solución:** Implementar validación JSON estructurada

### 3. **INCONSISTENCIA EN AUTENTICACIÓN**
- **Problema:** Frontend requiere auth estricta, API permite `user?.id || null`
- **Impacto:** Lógica contradictoria, posibles vulnerabilidades
- **Solución:** Consistencia en validación de autenticación

### 4. **VALIDACIÓN DE LÍMITES DE IMÁGENES**
- **Problema:** Frontend limita por plan, backend no valida
- **Impacto:** Bypass de restricciones de planes
- **Solución:** Validación backend de límites por plan

### 5. **CAMPOS FALTANTES EN VALIDACIÓN**
- **Problema:** Campos en Prisma no incluidos en propertySchema
- **Impacto:** Datos incompletos, validación insuficiente
- **Solución:** Sincronizar todos los campos

## PLAN DE IMPLEMENTACIÓN

### FASE 1: CORRECCIÓN DE VALIDACIONES ZOD
- [ ] Unificar nombres de campos (type → propertyType)
- [ ] Agregar campos faltantes al schema
- [ ] Implementar validación JSON para arrays
- [ ] Validar límites de imágenes por plan

### FASE 2: CORRECCIÓN DE API
- [ ] Actualizar API para usar campos unificados
- [ ] Implementar validación de autenticación consistente
- [ ] Agregar validación de límites en backend

### FASE 3: CORRECCIÓN DE TIPOS TYPESCRIPT
- [ ] Crear tipos unificados
- [ ] Actualizar interfaces de componentes
- [ ] Eliminar inconsistencias de tipos

### FASE 4: TESTING Y VALIDACIÓN
- [ ] Probar formulario de publicación
- [ ] Validar API endpoints
- [ ] Verificar consistencia de datos

## ARCHIVOS A MODIFICAR

1. `Backend/src/lib/validations/property.ts` - Schema Zod principal
2. `Backend/src/app/api/properties/route.ts` - API endpoints
3. `Backend/src/app/publicar/page.tsx` - Formulario publicación
4. `Backend/src/types/property.ts` - Tipos TypeScript (crear)
5. `Backend/src/app/properties/properties-client.tsx` - Cliente propiedades

## PRIORIDAD: CRÍTICA
Estas correcciones son esenciales para la estabilidad del sistema en producción.
