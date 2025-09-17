# INSTRUCCIONES FINALES: Cierre Sistema de Avatares - Staging 2025

## 🎯 ESTADO ACTUAL

**✅ IMPLEMENTACIÓN COMPLETADA**
- SSoT unificada en `user_profiles.photos[0]`
- Cache-busting con `?v=<updated_at_epoch>`
- Componente AvatarUniversal reutilizable
- API actualizada para escribir en SSoT
- Fallback a `User.avatar` solo para lectura

## 📋 PASOS OBLIGATORIOS ANTES DE STAGING

### 1. Ejecutar SQL en Supabase Dashboard
```sql
-- Copiar y ejecutar: Backend/sql-migrations/verify-updated-at-trigger-avatar-2025.sql
```

**Verificar:**
- ✅ Trigger `updated_at` funciona en `user_profiles`
- ✅ Políticas RLS permiten lectura cross-user
- ✅ Bucket `avatars` existe y es público

### 2. Testing Manual Obligatorio

**A. Subir Avatar y Verificar API:**
```bash
# 1. Subir avatar desde perfil de usuario
# 2. Capturar respuesta de: GET /api/users/avatar
# 3. Verificar que incluye:
{
  "imageUrl": "...?v=1705315800000",
  "source": "user_profiles.photos[0]",
  "storagePath": "userId/avatar-timestamp.ext"
}
```

**B. Verificar Cache-Busting:**
- Cambiar avatar 2-3 veces seguidas
- Confirmar que `?v=` cambia en cada actualización
- Verificar que se muestra la imagen más reciente

**C. Consistencia Cross-User:**
- Usuario A cambia avatar
- Usuario B debe ver nuevo avatar en navbar/dropdown SIN recargar
- Verificar en inbox de mensajes y threads

### 3. Verificación de Rutas de Storage

**Formato esperado:**
```
✅ Correcto: avatars/abc123/avatar-1705315800000.jpg
❌ Incorrecto: avatars//abc123/avatar-1705315800000.jpg
```

**Verificar en Supabase Storage:**
- Navegar a Storage > avatars
- Confirmar estructura de carpetas por userId
- No debe haber rutas con doble slash (//)

## 🔍 EVIDENCIA REQUERIDA

### Respuestas de API (2 usuarios diferentes)
```json
// Usuario A - Después de cambio de avatar
{
  "imageUrl": "https://storage.supabase.co/avatars/user123/avatar-1705315800000.jpg?v=1705315800000",
  "originalUrl": "https://storage.supabase.co/avatars/user123/avatar-1705315800000.jpg",
  "source": "user_profiles.photos[0]",
  "storagePath": "user123/avatar-1705315800000.jpg",
  "cacheBusted": true
}

// Usuario B - Después de cambio de avatar  
{
  "imageUrl": "https://storage.supabase.co/avatars/user456/avatar-1705315900000.jpg?v=1705315900000",
  "originalUrl": "https://storage.supabase.co/avatars/user456/avatar-1705315900000.jpg", 
  "source": "user_profiles.photos[0]",
  "storagePath": "user456/avatar-1705315900000.jpg",
  "cacheBusted": true
}
```

### Capturas de Pantalla
- [ ] **Antes/Después:** Avatar en navbar antes y después del cambio
- [ ] **Recarga:** Avatar se mantiene después de F5
- [ ] **Reingreso:** Avatar se mantiene después de cerrar/abrir sesión
- [ ] **Móvil:** Avatar correcto en vista móvil

## ⚠️ PROBLEMAS CONOCIDOS A VERIFICAR

### RLS en Mensajes
- Verificar que `/messages` y `/messages/[id]` NO dan 403
- Si aparece 403, reportar query específica + user_id
- NO cambiar políticas RLS por ahora

### Cache del Navegador
- Si avatar no cambia inmediatamente, verificar que `?v=` está presente
- Probar en modo incógnito para confirmar cache-busting

## 🚀 CHECKLIST GO/NO-GO STAGING

### ✅ Arquitectura (COMPLETADO)
- [x] SSoT en user_profiles.photos[0]
- [x] User.avatar solo como fallback de lectura
- [x] Cache-busting implementado
- [x] Rutas sin doble slash
- [x] Componente universal creado

### ⚠️ Funcionalidad (PENDIENTE QA)
- [ ] API responde con source: "user_profiles.photos[0]"
- [ ] Cache-busting funciona (?v= cambia)
- [ ] Consistencia cross-user verificada
- [ ] Móvil funciona correctamente
- [ ] No errores 403 en mensajes

### ⚠️ Base de Datos (PENDIENTE VERIFICACIÓN)
- [ ] Trigger updated_at funciona en user_profiles
- [ ] Políticas RLS configuradas correctamente
- [ ] Bucket avatars público y accesible

## 📝 LISTA DE ARCHIVOS MODIFICADOS

**Archivos principales:**
1. `Backend/src/utils/avatar.ts` - Utilidades SSoT
2. `Backend/src/app/api/users/avatar/route.ts` - API con SSoT
3. `Backend/src/components/ui/avatar-universal.tsx` - Componente universal
4. `Backend/src/contexts/UserContext.tsx` - Soporte photos array
5. `Backend/src/components/navbar.tsx` - Avatares reales
6. `Backend/src/components/ui/profile-dropdown.tsx` - Avatares reales

**Archivos de documentación:**
- `TODO-AVATAR-SYSTEM-IMPLEMENTATION.md`
- `CHECKLIST-ACEPTACION-AVATAR-SYSTEM-2025.md`
- `REPORTE-FINAL-AVATAR-SYSTEM-COMPLETADO-2025.md`
- `Backend/sql-migrations/verify-updated-at-trigger-avatar-2025.sql`
- `Backend/test-avatar-system-staging-2025.js`

## 🎯 DECISIÓN FINAL

**ESTADO: 🔄 IMPLEMENTADO - PENDIENTE QA MANUAL**

Para marcar como **✅ LISTO PARA STAGING**, completar:
1. Ejecutar SQL de verificación
2. Obtener evidencia de API (2 usuarios)
3. Completar smoke tests
4. Verificar RLS en mensajes
5. Confirmar funcionamiento móvil

---

**Próximo Paso:** QA Manual según checklist de aceptación
**Responsable QA:** Equipo de desarrollo
**Deadline:** Antes de deploy a staging
