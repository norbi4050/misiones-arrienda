# 🧹 FASE 3: LIMPIEZA Y ESTRUCTURA DE CÓDIGO

## 📋 OBJETIVOS DE LA FASE 3

### 3.1 Eliminación de Código Duplicado
- **Unificar hooks de autenticación** (useAuth vs useSupabaseAuth)
- **Eliminar archivos obsoletos** y de prueba
- **Consolidar componentes duplicados**
- **Limpiar imports no utilizados**

### 3.2 Normalización de Base de Datos
- **Unificar esquemas** Prisma vs Supabase
- **Eliminar tablas de prueba** y datos temporales
- **Normalizar nombres de campos** y convenciones
- **Optimizar relaciones** entre tablas

### 3.3 Reorganización de Estructura
- **Organizar componentes** por funcionalidad
- **Estandarizar convenciones** de nombres
- **Crear estructura modular** y escalable
- **Documentar arquitectura** del proyecto

## 🎯 TAREAS ESPECÍFICAS

### ✅ 3.1.1 Unificación de Hooks de Autenticación

**Problema Identificado:**
- Existen dos hooks: `useAuth.ts` y `useSupabaseAuth.ts`
- Duplicación de lógica de autenticación
- Inconsistencia en el uso a través del proyecto

**Solución:**
1. Analizar diferencias entre ambos hooks
2. Crear hook unificado con mejor funcionalidad
3. Migrar todos los componentes al hook unificado
4. Eliminar hook obsoleto

### ✅ 3.1.2 Limpieza de Archivos Obsoletos

**Archivos a Eliminar:**
```
Backend/test-*.js (archivos de prueba)
Backend/verify-*.js (scripts de verificación)
Backend/audit-*.js (scripts de auditoría)
Backend/check-*.js (scripts de verificación)
Backend/diagnostico-*.js (scripts de diagnóstico)
Backend/fix-*.js (scripts de corrección)
*-old.* (archivos con sufijo old)
*-backup.* (archivos de respaldo)
*-final.* (versiones finales obsoletas)
```

### ✅ 3.1.3 Consolidación de Componentes

**Componentes Duplicados Identificados:**
- `auth-provider.tsx` vs `auth-provider-old.tsx`
- `profile-form.tsx` (múltiples versiones)
- `profile-stats.tsx` (versiones mejoradas)
- Componentes UI con sufijos `-improved`, `-enhanced`

### ✅ 3.2.1 Normalización de Esquema de Base de Datos

**Problemas Identificados:**
- Esquemas Prisma y Supabase no sincronizados
- Nombres de campos inconsistentes
- Tablas de prueba sin eliminar
- Relaciones mal definidas

**Acciones:**
1. Crear esquema unificado
2. Migrar datos a estructura normalizada
3. Eliminar tablas obsoletas
4. Actualizar tipos TypeScript

### ✅ 3.2.2 Limpieza de Datos de Prueba

**Datos a Eliminar:**
- Usuarios de prueba
- Propiedades de ejemplo
- Datos de desarrollo
- Registros temporales

### ✅ 3.3.1 Reorganización de Estructura de Componentes

**Estructura Actual (Problemática):**
```
src/components/
├── ui/ (mezclado)
├── comunidad/ (específico)
├── eldorado/ (específico por ciudad)
└── auth-provider.tsx (raíz)
```

**Estructura Propuesta (Organizada):**
```
src/components/
├── ui/ (componentes genéricos)
│   ├── forms/
│   ├── buttons/
│   ├── modals/
│   └── layout/
├── features/ (por funcionalidad)
│   ├── auth/
│   ├── properties/
│   ├── profile/
│   └── community/
└── shared/ (compartidos)
    ├── providers/
    ├── guards/
    └── wrappers/
```

### ✅ 3.3.2 Estandarización de Convenciones

**Convenciones a Implementar:**
- **Nombres de archivos**: kebab-case para archivos, PascalCase para componentes
- **Nombres de funciones**: camelCase
- **Nombres de constantes**: UPPER_SNAKE_CASE
- **Nombres de tipos**: PascalCase con sufijo Type/Interface
- **Nombres de hooks**: camelCase con prefijo use

## 🛠️ HERRAMIENTAS Y SCRIPTS

### Script de Normalización de BD
```sql
-- Backend/sql-migrations/normalize-database-schema.sql
-- Unifica esquemas y elimina datos de prueba
```

### Script de Reorganización
```javascript
// Backend/scripts/reorganize-project-structure.js
// Mueve archivos a nueva estructura
```

### Script de Testing Estructurado
```javascript
// Backend/scripts/setup-structured-testing.js
// Configura testing organizado
```

## 📊 MÉTRICAS DE ÉXITO

### Reducción de Código:
- **Archivos eliminados**: 50-100 archivos obsoletos
- **Líneas de código**: 20-30% reducción
- **Dependencias**: 5-10 paquetes no utilizados eliminados

### Mejora de Estructura:
- **Componentes organizados**: Por funcionalidad
- **Hooks unificados**: 1 hook de auth en lugar de 2+
- **Esquema normalizado**: BD consistente
- **Convenciones**: 100% adherencia a estándares

### Mantenibilidad:
- **Tiempo de desarrollo**: 40% reducción para nuevas features
- **Onboarding**: 60% más rápido para nuevos desarrolladores
- **Debugging**: 50% más eficiente localizar problemas

## ⚠️ PRECAUCIONES

### Backup Obligatorio:
- Crear backup completo antes de iniciar
- Backup de base de datos
- Backup de archivos de código
- Plan de rollback definido

### Testing Exhaustivo:
- Ejecutar tests después de cada cambio mayor
- Verificar funcionalidad crítica
- Probar en entorno de desarrollo
- Validar con datos reales

### Migración Gradual:
- No hacer todos los cambios de una vez
- Migrar por módulos/funcionalidades
- Verificar cada paso antes del siguiente
- Mantener funcionalidad durante migración

## 📅 CRONOGRAMA ESTIMADO

### Día 1: Análisis y Preparación
- Análisis detallado de archivos duplicados
- Identificación de dependencias
- Creación de plan de migración
- Setup de backups

### Día 2: Limpieza de Código
- Eliminación de archivos obsoletos
- Unificación de hooks
- Consolidación de componentes
- Testing de funcionalidad

### Día 3: Normalización de BD
- Creación de esquema unificado
- Migración de datos
- Eliminación de tablas obsoletas
- Actualización de tipos

### Día 4: Reorganización
- Reestructuración de componentes
- Aplicación de convenciones
- Actualización de imports
- Testing final

### Día 5: Validación y Documentación
- Testing exhaustivo
- Documentación de cambios
- Guías de desarrollo actualizadas
- Entrega de fase completada

---

**Responsable**: Sistema de Auditoría Automatizada
**Estado**: 📋 PLANIFICADA
**Prioridad**: ALTA
**Dependencias**: Fase 1 y 2 completadas
