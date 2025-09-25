# 🔧 **DIFF CONSOLIDACIÓN ROLE + AVATAR**

## 📋 **RESUMEN DE CAMBIOS**

**Estado:** ✅ **CAMBIOS MÍNIMOS APLICADOS**  
**Fecha:** Enero 2025  
**Objetivo:** Consolidar tipos de role y optimizar sistema avatar

---

## 📁 **ARCHIVOS MODIFICADOS**

### **A) ✅ Tipo Único CommunityRole**

#### **NUEVO:** `src/domain/user/roles.ts`
```typescript
// Definición única de roles de comunidad
export const COMMUNITY_ROLES = ['BUSCO', 'OFREZCO', 'TENANT', 'OWNER', 'AGENCY'] as const;
export type CommunityRole = typeof COMMUNITY_ROLES[number];

// Valores por defecto
export const DEFAULT_COMMUNITY_ROLE: CommunityRole = 'BUSCO';

// Validadores helper
export function isValidCommunityRole(role: string): role is CommunityRole {
  return COMMUNITY_ROLES.includes(role as CommunityRole);
}

// Mapeo para UI
export const COMMUNITY_ROLE_LABELS: Record<CommunityRole, string> = {
  BUSCO: 'Busco habitación/compañeros',
  OFREZCO: 'Ofrezco habitación/casa',
  TENANT: 'Inquilino',
  OWNER: 'Propietario',
  AGENCY: 'Inmobiliaria'
};
```

### **B) ✅ Schema Prisma - String Union Segura**

#### **MODIFICADO:** `prisma/schema.prisma`
```diff
// ANTES:
- enum CommunityRole {
-   BUSCO     // Busco habitación/compañeros
-   OFREZCO   // Ofrezco habitación/casa
- }

- role CommunityRole

// DESPUÉS:
+ // Enums para el módulo Comunidad - Usando string union para flexibilidad
+ // Los valores válidos se definen en src/domain/user/roles.ts

+ role String @default("BUSCO") // Valores válidos: BUSCO, OFREZCO, TENANT, OWNER, AGENCY
```

**✅ Beneficios:**
- Evita problemas de migración con enum nativo Postgres
- Permite agregar nuevos roles sin cambios de schema
- Default "BUSCO" previene errores de NULL

### **C) ✅ API Comunidad - Tipo Centralizado**

#### **MODIFICADO:** `src/app/api/comunidad/profiles/route.ts`
```diff
// ANTES:
- import { z } from 'zod'
- role: z.enum(['BUSCO', 'OFREZCO']),

// DESPUÉS:
+ import { COMMUNITY_ROLES, type CommunityRole } from '@/domain/user/roles'
+ role: z.enum(COMMUNITY_ROLES),
```

**✅ Beneficios:**
- Single source of truth para validación
- Automáticamente incluye nuevos roles (TENANT, OWNER, AGENCY)
- Consistencia entre schema y validación

### **D) ✅ Avatar Endpoint - Upload + Cache Optimizado**

#### **MODIFICADO:** `src/app/api/users/avatar/route.ts`

**Nuevas características:**
```typescript
// 1. Helper para timestamp epoch
function getTimestampEpoch(): number {
  return Math.floor(Date.now() / 1000)
}

// 2. Upload directo a bucket avatars/<userId>/
if (contentType?.includes('multipart/form-data')) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  const filePath = `avatars/${userId}/avatar-${timestamp}.${fileExt}`
  
  const { data: uploadData } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { cacheControl: '3600', upsert: true })
}

// 3. Respuesta optimizada con epoch
return NextResponse.json({ 
  url: `${avatarUrl}?v=${updatedAtEpoch}`,
  v: updatedAtEpoch,
  user_id: userId,
  success: true 
})
```

**✅ Cambios clave:**
- **Upload directo:** Bucket `avatars/<userId>/filename`
- **Cache-busting:** Epoch timestamp en lugar de ISO string
- **Formato JSON:** `{ url, v }` en lugar de `{ avatarUrl, ... }`
- **NO toca:** `profile_image` (solo usa `photos[0]`)

### **E) ✅ Componente Avatar - Backward Compatible**

#### **MODIFICADO:** `src/components/ui/avatar-universal.tsx`
```diff
// ANTES:
- if (data.avatarUrl) {
-   setAvatarUrl(data.avatarUrl)

// DESPUÉS:
+ // Nueva API devuelve { url, v } o { avatarUrl, ... } (backward compatibility)
+ const avatarUrl = data.url || data.avatarUrl
+ 
+ if (avatarUrl) {
+   setAvatarUrl(avatarUrl)
```

**✅ Beneficios:**
- Backward compatible con respuestas antiguas
- Soporta nuevo formato `{ url, v }`
- Sin breaking changes en UI existente

### **F) ✅ Script de Test Avatar**

#### **NUEVO:** `scripts/test-avatar-flow.ps1`
```powershell
# Test completo: GET → POST → GET → verificar cache-busting
$initialState = Test-AvatarEndpoint -method "GET"
$updateState = Test-AvatarEndpoint -method "POST" -body $updateBody  
$finalState = Test-AvatarEndpoint -method "GET"

# Verificar que timestamps cambiaron
if ($newV -gt $initialV -and $finalV -eq $newV) {
    Write-Host "✅ Cache-busting working correctly"
}
```

#### **AGREGADO:** `package.json`
```diff
+ "test:avatar": "powershell -ExecutionPolicy Bypass -File scripts/test-avatar-flow.ps1"
```

---

## 🧪 **COMANDOS DE BUILD Y PRUEBA**

### **Build:**
```bash
# Regenerar cliente Prisma con nuevo schema
npm run db:generate

# Build completo
npm run build
```

### **Pruebas:**
```bash
# Test específico de avatar
npm run test:avatar

# Smoke tests existentes
npm run smoke:win
npm run smoke:analytics
```

---

## ✅ **VERIFICACIÓN DE CAMBIOS**

### **1. Tipo CommunityRole:**
- ✅ Definido en `src/domain/user/roles.ts`
- ✅
