# CHECKLIST DE ACEPTACIÓN: Sistema de Avatares - 2025

## ✅ SSoT (Single Source of Truth) - OBLIGATORIO

**Fuente única de verdad confirmada:**
- ✅ **user_profiles.photos[0]** es la fuente principal (SSoT)
- ✅ **User.avatar** es solo fallback de lectura (no escribir)
- ✅ API actualizada para escribir en user_profiles.photos[0]
- ✅ Utilidades priorizan photos[0] sobre profileImage

## 📋 Evidencia Mínima Requerida

### Respuestas de API (Pendiente - Requiere Testing Manual)
- [ ] **GET /api/users/avatar** - Usuario A después de cambio de avatar
- [ ] **GET /api/users/avatar** - Usuario B después de cambio de avatar
- [ ] Verificar que `imageUrl` incluye `?v=<updated_at_epoch>` diferente tras cambio
- [ ] Confirmar que `source: "user_profiles.photos[0]"` en respuesta
- [ ] Verificar ruta de storage: `avatars/<userId>/avatar-<timestamp>.<ext>` (sin //)

### Commit y Archivos
- ✅ **Archivos modificados:**
  - `Backend/src/utils/avatar.ts` (utilidades SSoT)
  - `Backend/src/app/api/users/avatar/route.ts` (API con SSoT)
  - `Backend/src/components/ui/avatar-universal.tsx` (componente universal)
  - `Backend/src/contexts/UserContext.tsx` (soporte photos array)
  - `Backend/src/components/navbar.tsx` (avatares reales)
  - `Backend/src/components/ui/profile-dropdown.tsx` (avatares reales)

## 🧪 Smoke Tests (Pendiente - Requiere Testing Manual)

### Consistencia Cross-User
- [ ] **Usuario A cambia avatar** → Usuario B ve nuevo avatar en:
  - [ ] Navbar
  - [ ] ProfileDropdown  
  - [ ] Inbox de mensajes
  - [ ] Thread de conversación
  - [ ] Sin limpiar caché del navegador

### Persistencia de Sesión
- [ ] **Cerrar sesión y reingresar** con Usuario A → avatar se mantiene
- [ ] **Cerrar sesión y reingresar** con Usuario B → avatar se mantiene

### Cache-Busting
- [ ] **Cambiar avatar 2-3 veces seguidas** → siempre muestra el último
- [ ] **Verificar que ?v= cambia** en cada actualización
- [ ] **URL final cambia** (nombre nuevo) o query ?v= cambia

### Móvil
- [ ] **Inbox** muestra avatar correcto en móvil
- [ ] **Thread** muestra avatar correcto en móvil

## 🔒 RLS y Logs (Pendiente - Requiere Testing Manual)

### Políticas de Lectura
- [ ] **Con policy de lectura en user_profiles** → no hay 400/403 en:
  - [ ] `/messages` (inbox)
  - [ ] `/messages/[id]` (thread)
- [ ] **Si aparece 403 puntual** → reportar query afectada + user_id

### Logs de Errores
- [ ] No errores 403 en console del navegador
- [ ] No errores de CORS en requests de avatar
- [ ] No errores de RLS en operaciones de lectura

## 🚀 Checklist Final GO a Staging

### Arquitectura
- ✅ **SSoT unificada** en user_profiles.photos[0]
- [ ] **updated_at cambia** en cada update de photos (verificar trigger)
- ✅ **Toda la app usa** /api/users/avatar y AvatarUniversal
- ✅ **Sin // en rutas** de storage (formato: userId/filename)
- ✅ **Cache-busting activo** con ?v= en todas las superficies

### Funcionalidades Core
- ✅ **Upload de avatar** → actualiza photos[0] + fallback
- ✅ **Delete de avatar** → limpia photos[0] + fallback  
- ✅ **Read de avatar** → prioriza photos[0] > fallback
- ✅ **Cache-busting** → URLs con ?v=<timestamp>
- ✅ **Limpieza automática** → archivos antiguos eliminados

### Componentes UI
- ✅ **AvatarUniversal** → componente reutilizable
- ✅ **Navbar** → avatares reales (no iniciales)
- ✅ **ProfileDropdown** → avatares reales
- ✅ **ProfileAvatar** → integrado con SSoT
- ✅ **Fallback consistente** → iniciales o ícono User

### Seguridad
- ✅ **RLS activo** en user_profiles
- ✅ **Validación userId** en todas las operaciones
- ✅ **Tipos de archivo** validados (JPEG, PNG, WebP)
- ✅ **Tamaño máximo** 5MB
- ✅ **Rutas validadas** por ownership

## 📊 Estado Actual

**Completado:**
- ✅ Arquitectura SSoT implementada
- ✅ Utilidades de avatar con cache-busting
- ✅ API actualizada para user_profiles.photos[0]
- ✅ Componente universal creado
- ✅ Integración en navbar y dropdown

**Pendiente para QA Manual:**
- ⚠️ Testing de respuestas de API reales
- ⚠️ Verificación de trigger updated_at
- ⚠️ Smoke tests cross-user
- ⚠️ Testing en móvil
- ⚠️ Verificación RLS en mensajes

## 🎯 Criterios de Aceptación

Para considerar el sistema **LISTO PARA STAGING**, todos los ítems marcados con [ ] deben estar ✅.

**Estado Actual: 🔄 IMPLEMENTADO - PENDIENTE QA MANUAL**

---

**Última Actualización:** 15 de Enero, 2025
**Responsable:** BlackBox AI
**Próximo Paso:** Testing manual y verificación de evidencias
