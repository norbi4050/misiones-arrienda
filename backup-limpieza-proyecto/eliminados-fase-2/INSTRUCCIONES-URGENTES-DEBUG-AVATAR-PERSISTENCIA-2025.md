# INSTRUCCIONES URGENTES - DEBUG AVATAR PERSISTENCIA 2025

## 🚨 ESTADO ACTUAL

✅ **API Debug Activada**: La API de avatar ahora tiene logging detallado
✅ **Investigación Completa**: Identificadas múltiples hipótesis del problema
✅ **Archivos Preparados**: Scripts de diagnóstico y corrección listos

## 🎯 ACCIÓN INMEDIATA REQUERIDA

### PASO 1: Probar Subida con API Debug
1. **Ir a la página de perfil** en tu navegador
2. **Abrir DevTools** (F12) y ir a la pestaña Console
3. **Intentar subir un avatar** usando el componente de perfil
4. **Observar logs detallados** que aparecerán en la consola del servidor

### PASO 2: Revisar Logs del Servidor
Los logs aparecerán en la terminal donde ejecutas `npm run dev` con este formato:
```
🚀 INICIO - Avatar upload API
🔐 Verificando autenticación...
✅ Usuario autenticado: 6403f9d2-e846-4c70-87e0-e051127d9500
📄 Obteniendo FormData...
✅ Archivo recibido: { name: "...", size: ..., type: "..." }
📋 PASO 1: Obteniendo avatar anterior...
📝 PASO 2: Generando nombres únicos...
☁️  PASO 3: Subiendo archivo a Supabase Storage...
🔗 PASO 4: Obteniendo URL pública...
💾 PASO 5: Actualizando base de datos...
🔍 PASO 6: Verificando persistencia...
```

### PASO 3: Identificar Punto de Fallo
Busca específicamente estos mensajes críticos:
- ❌ **ERROR CRÍTICO actualizando BD**: Problema de permisos/RLS
- 🚨 **PROBLEMA: La imagen no persistió correctamente**: Rollback de transacción
- ❌ **Error verificando persistencia**: Problema de lectura después de escritura

## 🔍 QUÉ BUSCAR EN LOS LOGS

### Escenario 1: Error de Permisos RLS
```
❌ ERROR CRÍTICO actualizando BD: new row violates row-level security policy
```
**Solución**: Ejecutar `Backend/sql-migrations/FIX-RLS-POLICIES-TYPE-CASTING-2025.sql`

### Escenario 2: Error de Transacción
```
✅ Base de datos actualizada exitosamente
🚨 PROBLEMA: La imagen no persistió correctamente!
```
**Solución**: Hay un rollback automático - revisar triggers o constraints

### Escenario 3: Error de Storage
```
❌ Error subiendo archivo: [mensaje de error]
```
**Solución**: Problema con bucket avatars - verificar configuración

### Escenario 4: Error de Campos
```
❌ Error obteniendo datos usuario: column "profile_image" does not exist
```
**Solución**: Campo faltante en tabla User

## 🛠️ SOLUCIONES PREPARADAS

### Si Error RLS:
```sql
-- Ejecutar en Supabase Dashboard:
-- Archivo: Backend/sql-migrations/FIX-RLS-POLICIES-TYPE-CASTING-2025.sql
```

### Si Error de Campos:
```sql
-- Agregar campo profile_image si no existe:
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

### Si Error de Storage:
```sql
-- Crear bucket avatars:
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
```

## 📋 CHECKLIST DE DEBUGGING

### Antes de Probar:
- [ ] Servidor Next.js ejecutándose (`npm run dev`)
- [ ] DevTools abierto en pestaña Console
- [ ] Usuario logueado en la aplicación

### Durante la Prueba:
- [ ] Subir imagen pequeña (< 1MB) formato JPG/PNG
- [ ] Observar logs en tiempo real
- [ ] Anotar exactamente dónde falla el proceso
- [ ] Verificar si imagen aparece temporalmente

### Después de la Prueba:
- [ ] Copiar logs completos del servidor
- [ ] Verificar estado final en Supabase Dashboard
- [ ] Comprobar si archivo se subió al bucket avatars
- [ ] Revisar campo profile_image en tabla User

## 🚀 PRÓXIMOS PASOS SEGÚN RESULTADO

### Si Logs Muestran Éxito Pero No Persiste:
→ **Problema de Frontend**: Revisar componente y estado local

### Si Error en Paso 5 (BD):
→ **Problema de RLS**: Ejecutar correcciones SQL

### Si Error en Paso 3 (Storage):
→ **Problema de Bucket**: Configurar storage correctamente

### Si Error en Paso 6 (Verificación):
→ **Problema de Rollback**: Investigar triggers y constraints

## 📞 REPORTE REQUERIDO

Después de probar, necesito que me proporciones:

1. **Logs completos** del servidor durante la subida
2. **Mensajes de error** específicos si los hay
3. **Estado final** del campo profile_image en BD
4. **Archivos en bucket** avatars después del intento

Con esta información podré identificar exactamente el problema y crear la solución definitiva.

---

**URGENCIA**: 🔥 CRÍTICA  
**TIEMPO ESTIMADO**: 5-10 minutos de testing  
**OBJETIVO**: Identificar punto exacto de fallo en persistencia
