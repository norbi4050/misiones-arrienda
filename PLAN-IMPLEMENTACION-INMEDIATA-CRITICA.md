# Plan de Implementación Inmediata - Problemas Críticos

## 🚨 PROBLEMAS IDENTIFICADOS POR EL USUARIO

### 1. Cards "Destacado" siguen visibles en Home
- **Problema**: Aunque limpié `sampleProperties`, el Home aún muestra 4 propiedades mock
- **Causa**: Debe haber datos hardcodeados en otro lugar o cache
- **Solución**: Buscar y eliminar todos los fallbacks hardcodeados

### 2. Contadores "0 PROPIEDADES / 0 USUARIOS" con claim "100% reales"
- **Problema**: Confuso mostrar "0" con "estadísticas 100% reales"
- **Solución**: Conectar a DB real o cambiar texto a "plataforma nueva"

### 3. Ruta /properties no funciona correctamente
- **Problema**: Link "Propiedades" no lleva a listado independiente
- **Solución**: Crear página /properties con filtros y paginación

### 4. Formularios sin backend verificado
- **Problema**: Publicar, Inmobiliaria, Dueño Directo sin feedback
- **Solución**: Implementar POST, validaciones y estados

### 5. WhatsApp sin mensaje prellenado
- **Problema**: CTA no incluye información de la propiedad
- **Solución**: Agregar ?text= con título, ciudad y URL

### 6. SEO base faltante
- **Problema**: Falta metadata única por página
- **Solución**: Implementar title/description/OG por ruta

### 7. Similar Properties no verificado
- **Problema**: Tras fix TypeScript, no confirmado que funcione
- **Solución**: Verificar que aparezca en fichas reales

### 8. Imágenes sin optimizar
- **Problema**: No usa next/image con optimizaciones
- **Solución**: Reemplazar img por next/image

## 📋 PLAN DE ACCIÓN INMEDIATA

### FASE 1: Limpieza Completa de Datos Mock (URGENTE)
1. ✅ Buscar todos los archivos con datos hardcodeados
2. ✅ Eliminar fallbacks de propiedades mock
3. ✅ Verificar que Home muestre estado vacío correcto

### FASE 2: Estadísticas Reales
1. ✅ Cambiar texto de "100% reales" a algo apropiado
2. ✅ Conectar contadores a DB o mostrar mensaje de "plataforma nueva"

### FASE 3: Navegación /properties
1. ✅ Verificar que /properties funcione correctamente
2. ✅ Asegurar que el link del navbar navegue ahí
3. ✅ Implementar filtros por querystring

### FASE 4: Formularios con Feedback
1. ✅ Implementar estados loading/success/error
2. ✅ Agregar toasts/mensajes de confirmación
3. ✅ Verificar endpoints de API

### FASE 5: WhatsApp Mejorado
1. ✅ Agregar mensaje prellenado con datos de propiedad
2. ✅ Incluir teléfono real

### FASE 6: SEO Básico
1. ✅ Agregar metadata única por página
2. ✅ Implementar Open Graph
3. ✅ Verificar sitemap y robots.txt

### FASE 7: Optimizaciones
1. ✅ Reemplazar img por next/image
2. ✅ Verificar Similar Properties
3. ✅ Testing completo

## 🎯 PRIORIDADES

**CRÍTICO (Hacer AHORA)**:
1. Eliminar cards mock del Home
2. Arreglar estadísticas confusas
3. Verificar navegación /properties

**IMPORTANTE (Hacer HOY)**:
4. Formularios con feedback
5. WhatsApp mejorado
6. SEO básico

**MEJORAS (Hacer ESTA SEMANA)**:
7. Similar Properties
8. Optimización imágenes

## 🔍 ARCHIVOS A REVISAR/MODIFICAR

### Buscar datos mock en:
- ✅ `src/components/property-grid.tsx` - Ya revisado, está bien
- ✅ `src/app/page.tsx` - Ya revisado, usa fetchRealProperties
- ❓ `src/components/hero-section.tsx` - Puede tener datos hardcodeados
- ❓ Otros componentes con fallbacks

### Modificar para estadísticas:
- ✅ `src/components/stats-section.tsx` - Cambiar texto
- ❓ `src/app/api/stats/route.ts` - Conectar a DB real

### Verificar navegación:
- ✅ `src/app/properties/page.tsx` - Debe existir y funcionar
- ✅ `src/components/navbar.tsx` - Link debe apuntar correctamente

### Formularios:
- ❓ `src/app/publicar/page.tsx` - Agregar feedback
- ❓ `src/app/inmobiliaria/register/page.tsx` - Agregar feedback
- ❓ `src/app/dueno-directo/register/page.tsx` - Agregar feedback

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Home sin cards mock
- [ ] Estadísticas con texto apropiado
- [ ] Link "Propiedades" funciona
- [ ] Formularios con feedback
- [ ] WhatsApp con mensaje prellenado
- [ ] Metadata por página
- [ ] Similar Properties funciona
- [ ] Imágenes optimizadas

## 🚀 PRÓXIMOS PASOS

1. **INMEDIATO**: Buscar y eliminar datos mock restantes
2. **HOY**: Implementar todas las correcciones críticas
3. **ESTA SEMANA**: Completar mejoras y optimizaciones
4. **TESTING**: Verificar cada cambio en la web

Este plan aborda todos los puntos críticos identificados por el usuario y establece un orden de prioridades para resolverlos eficientemente.
