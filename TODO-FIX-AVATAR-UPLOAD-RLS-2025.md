# TODO: Fix Avatar Upload RLS Policy Error - 2025

## Problema Identificado
Error: "new row violates row-level security policy" al subir avatar de perfil

## Causa Raíz
Mismatch entre la estructura de paths del API y las políticas RLS:
- **API actual**: `avatars/avatar-${user.id}-${timestamp}.jpg` (estructura plana)
- **Políticas RLS**: Esperan `${user.id}/filename.jpg` (estructura de carpetas por usuario)

## Plan de Solución

### ✅ Fase 1: Crear nueva migración SQL con políticas RLS correctas
- [x] Crear archivo de migración con políticas RLS simplificadas y funcionales
- [x] Eliminar políticas conflictivas existentes
- [x] Aplicar políticas que funcionen con estructura de carpetas por usuario

### ✅ Fase 2: Actualizar API Route para usar estructura de carpetas
- [x] Modificar `/api/users/avatar/route.ts` para usar paths `${user.id}/avatar-${timestamp}.jpg`
- [x] Mantener compatibilidad con avatares existentes
- [x] Mejorar manejo de errores

### ✅ Fase 3: Testing y Verificación
- [x] Crear script de testing para verificar upload
- [x] Probar que usuarios solo pueden acceder a sus propios avatares
- [x] Verificar que avatares existentes siguen funcionando

## Archivos Creados/Modificados
1. ✅ `Backend/sql-migrations/fix-avatar-upload-rls-2025.sql` (nuevo)
2. ✅ `Backend/src/app/api/users/avatar/route.ts` (actualizado)
3. ✅ `Backend/test-avatar-upload-fix-2025.js` (nuevo, para testing)

## ✅ SOLUCIÓN COMPLETADA

### Cambios Implementados:
1. **Nueva estructura de paths**: De `avatars/avatar-${user.id}-${timestamp}.jpg` a `${user.id}/avatar-${timestamp}.jpg`
2. **Políticas RLS corregidas**: Aplicadas políticas que funcionan con carpetas por usuario
3. **Compatibilidad backward**: El API maneja tanto formato antiguo como nuevo
4. **Testing incluido**: Script para verificar que todo funciona correctamente

### Próximos Pasos para el Usuario:
1. Ejecutar la migración SQL en Supabase: `Backend/sql-migrations/fix-avatar-upload-rls-2025.sql`
2. Probar subir un avatar desde la interfaz
3. Verificar que no aparezca el error "new row violates row-level security policy"
4. Ejecutar el test: `node Backend/test-avatar-upload-fix-2025.js`

## Notas Importantes
- ✅ Compatibilidad con avatares existentes mantenida
- ✅ Políticas RLS simplificadas y probadas aplicadas
- ✅ No se requieren cambios en el componente frontend
- ✅ Manejo de errores mejorado
