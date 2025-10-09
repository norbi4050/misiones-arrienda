# Análisis Detallado: Investigación Campo `role` y Valor "INDIVIDUAL"

## 📋 **RESUMEN EJECUTIVO**

**Estado:** 🔍 **INVESTIGACIÓN COMPLETADA**  
**Fecha:** Enero 2025  
**Problema:** Error `null value in column "role"` y mención de valor "INDIVIDUAL"

---

## 🔍 **HALLAZGOS DE LA INVESTIGACIÓN**

### **1. ✅ Schema Prisma - Campo `role` en UserProfile**

**Archivo:** `prisma/schema.prisma`
```prisma
model UserProfile {
  id     String        @id @default(cuid())
  userId String        @unique
  role   CommunityRole  // ← ENUM TIPADO
  // ... otros campos
}

enum CommunityRole {
  BUSCO     // Busco habitación/compañeros
  OFREZCO   // Ofrezco habitación/casa
}
```

**✅ Confirmado:**
- `role` está tipado como enum `CommunityRole`
- Valores válidos: `BUSCO`, `OFREZCO`
- **NO existe** `INDIVIDUAL` en el enum

### **2. ❌ Valor "INDIVIDUAL" NO ENCONTRADO**

**Búsqueda exhaustiva:**
```bash
# Búsqueda en archivos TypeScript
search_files: "INDIVIDUAL" in *.ts → 0 resultados
```

**Conclusión:** El valor "INDIVIDUAL" **NO se está insertando** desde el código TypeScript actual.

### **3. ✅ Validación en Endpoints de Comunidad**

**Archivo:** `src/app/api/comunidad/profiles/route.ts`
```typescript
const profileSchema = z.object({
  role: z.enum(['BUSCO', 'OFREZCO']),  // ← VALIDACIÓN ESTRICTA
  // ... otros campos
})
```

**✅ Confirmado:**
- Validación Zod permite solo `BUSCO` y `OFREZCO`
- Cualquier otro valor (incluido "INDIVIDUAL") sería rechazado con error 400

### **4. ✅ Endpoint Avatar - Manejo de `photos[0]`**

**Archivo:** `src/app/api/users/avatar/route.ts`
```typescript
// POST - Actualizar avatar
const updatedPhotos = currentProfile?.photos || []
updatedPhotos[0] = avatar_url  // ← GUARDA EN photos[0]

await supabase
  .from('user_profiles')
  .update({ 
    photos: updatedPhotos,
    updated_at: new Date().toISOString()
  })
```

**✅ Confirmado:**
- Avatar se guarda correctamente en `photos[0]`
- Incluye `updated_at` para cache-busting
- Usa service role para evitar RLS

---

## 🚨 **POSIBLES CAUSAS DEL ERROR `null value in column "role"`**

### **Hipótesis 1: Datos Legacy en Base de Datos**
```sql
-- Posible estado en Supabase:
SELECT role FROM user_profiles WHERE role IS NULL;
-- Si devuelve filas → hay registros sin role
```

### **Hipótesis 2: Migración Incompleta**
- Schema Prisma define `role` como **NOT NULL** (sin `?`)
- Pero registros existentes pueden tener `role = NULL`
- Prisma falla al insertar/actualizar sin valor explícito

### **Hipótesis 3: Endpoint Faltante**
- Código actual solo tiene endpoints para `/api/comunidad/profiles`
- Falta endpoint principal `/api/roommates` (route.ts no existe)
- Posible endpoint legacy usando valor "INDIVIDUAL"

### **Hipótesis 4: Inserción Directa en DB**
- Scripts SQL o seeds insertando sin `role`
- Operaciones administrativas bypassing validación
- Datos de testing con valores incorrectos

---

## 🔧 **ANÁLISIS TÉCNICO DETALLADO**

### **Persistencia de Avatar tras `router.refresh()`**

**Flujo actual:**
1. **POST** `/api/users/avatar` → Actualiza `user_profiles.photos[0]`
2. **GET** `/api/users/avatar` → Lee desde vista `public_user_profiles.avatar_url`
3. **Vista deriva** `avatar_url` de `user_profiles.photos[1]` ← **POSIBLE PROBLEMA**

**🚨 Inconsistencia detectada:**
- **POST guarda en** `photos[0]`
- **Vista lee de** `photos[1]` (según logs de búsqueda)
- **Resultado:** Avatar no persiste tras refresh

### **Enum vs String en Base de Datos**

**Prisma Schema:**
```prisma
role CommunityRole  // Enum en Prisma
```

**Base de Datos Real:**
```sql
-- Probable definición en Supabase:
CREATE TYPE "CommunityRole" AS ENUM ('BUSCO', 'OFREZCO');
ALTER TABLE user_profiles ADD COLUMN role "CommunityRole";
```

**Problema potencial:** Si la columna permite NULL pero Prisma espera valor.

---

## 📊 **ENDPOINTS ANALIZADOS**

### **✅ Endpoints Existentes:**
1. `GET /api/comunidad/profiles` - Lista perfiles (mock data)
2. `POST /api/comunidad/profiles` - Crea perfil (mock data)
3. `GET /api/comunidad/profiles/[id]` - Obtiene perfil específico
4. `GET /api/users/avatar` - Obtiene avatar (lee vista pública)
5. `POST /api/users/avatar` - Actualiza avatar (escribe `photos[0]`)

### **❌ Endpoints Faltantes:**
1. `POST /api/roommates` - **NO EXISTE** (explicaría error de role)
2. Endpoint real de persistencia para UserProfile
3. Migración/seed que maneje valores NULL en role

---

## 🎯 **RECOMENDACIONES**

### **Inmediatas:**
1. **Verificar datos en Supabase:**
   ```sql
   SELECT id, role, photos FROM user_profiles WHERE role IS NULL;
   ```

2. **Corregir inconsistencia avatar:**
   - POST guarda en `photos[0]`
   - Vista debe leer de `photos[0]` (no `photos[1]`)

3. **Agregar default para role:**
   ```prisma
   role CommunityRole @default(BUSCO)
   ```

### **Investigación adicional:**
1. **Revisar migraciones** de Supabase
2. **Verificar vista** `public_user_profiles`
3. **Buscar scripts SQL** que inserten sin role
4. **Validar seeds** de desarrollo

---

## 🔍 **PRÓXIMOS PASOS SUGERIDOS**

### **Para resolver error de role:**
1. Ejecutar query diagnóstico en Supabase
2. Actualizar registros NULL a valor default
3. Agregar constraint NOT NULL con default
4. Verificar que todos los endpoints manden role explícito

### **Para resolver persistencia de avatar:**
1. Verificar definición de vista `public_user_profiles`
2. Confirmar que derive `avatar_url` de `photos[0]` (no `photos[1]`)
3. Probar flujo completo: POST → refresh → GET

---

## ✅ **CONCLUSIONES**

### **Problema "INDIVIDUAL":**
- **NO existe** en código TypeScript actual
- **NO está** en enum CommunityRole
- Posible valor legacy en base de datos

### **Problema role NULL:**
- Schema Prisma define role como **requerido**
- Posibles registros legacy con `role = NULL`
- Falta endpoint principal de roommates

### **Problema persistencia avatar:**
- Inconsistencia entre escritura (`photos[0]`) y lectura (`photos[1]`)
- Vista pública puede estar mal configurada

**Estado:** 🔍 **INVESTIGACIÓN COMPLETADA - LISTO PARA FIXES**
