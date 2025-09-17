# 🔍 REPORTE DE INVESTIGACIÓN: Bug de Doble Upload de Avatar

## 📋 RESUMEN EJECUTIVO

**Problema**: Al subir avatar en `/profile`, aparecen dos requests en Network, uno devuelve 204 No Content, se muestran dos imágenes en UI y luego el avatar desaparece.

**Estado**: ✅ INVESTIGACIÓN COMPLETADA - CAUSA RAÍZ IDENTIFICADA

---

## A) MAPA DEL FLUJO DE AVATAR

### 🔄 Flujo Completo Identificado:

```
1. Usuario selecciona archivo
   ↓
2. ProfileAvatar.handleFileSelect() [Línea ~120]
   ↓
3. fetch('/api/users/avatar', POST) [Línea ~150]
   ↓
4. onImageChange(imageUrl) callback [Línea ~180]
   ↓
5. InquilinoProfilePage.handleAvatarChange() [Línea ~100]
   ↓
6. updateAvatar(imageUrl) [UserContext]
   ↓
7. SEGUNDO fetch a API (implícito en updateAvatar)
```

### 📁 Archivos Involucrados:

1. **`Backend/src/components/ui/profile-avatar.tsx`**
   - Línea 120-180: `handleFileSelect()` - Primera llamada a API
   - Línea 150: `fetch('/api/users/avatar', { method: 'POST' })`
   - Línea 180: `onImageChange?.(imageUrl)` - Dispara callback

2. **`Backend/src/app/profile/inquilino/InquilinoProfilePageCorrected.tsx`**
   - Línea 100-110: `handleAvatarChange()` - Recibe callback
   - Línea 105: `await updateAvatar(imageUrl)` - Segunda llamada

3. **`Backend/src/contexts/UserContext.tsx`**
   - Línea 150-200: `updateAvatar()` - Actualiza base de datos
   - Línea 170: Actualización en tabla User

4. **`Backend/src/app/api/users/avatar/route.ts`**
   - Línea 30-100: `POST()` - Maneja upload
   - Línea 150-200: `DELETE()` - Maneja eliminación

---

## B) TODAS LAS LLAMADAS A /api/users/avatar

### ✅ Llamadas Identificadas:

1. **ProfileAvatar Component**
   - `Backend/src/components/ui/profile-avatar.tsx:150`
   - `fetch('/api/users/avatar', { method: 'POST' })`

2. **ProfileAvatar Component (DELETE)**
   - `Backend/src/components/ui/profile-avatar.tsx:220`
   - `fetch('/api/users/avatar', { method: 'DELETE' })`

3. **ProfileAvatar Enhanced Component**
   - `Backend/src/components/ui/profile-avatar-enhanced.tsx:150`
   - `fetch('/api/users/avatar', { method: 'POST' })`

4. **ProfileAvatar Enhanced Component (DELETE)**
   - `Backend/src/components/ui/profile-avatar-enhanced.tsx:220`
   - `fetch('/api/users/avatar', { method: 'DELETE' })`

---

## C) 🚨 EVIDENCIA DE DUPLICACIÓN

### Causa Raíz Identificada: **DOBLE HANDLER PATTERN**

#### 🔴 Problema Principal:
```typescript
// 1. ProfileAvatar hace upload directo a API
handleFileSelect() {
  const response = await fetch('/api/users/avatar', { method: 'POST' });
  onImageChange?.(imageUrl); // ← Dispara callback al padre
}

// 2. Página de perfil recibe callback y hace SEGUNDO update
handleAvatarChange(imageUrl) {
  await updateAvatar(imageUrl); // ← SEGUNDA llamada a API/DB
}
```

#### 🔍 Secuencia del Bug:
1. **Upload 1**: ProfileAvatar → `/api/users/avatar` (POST) → ✅ Sube archivo
2. **Callback**: `onImageChange(url)` → Notifica al padre
3. **Upload 2**: `handleAvatarChange()` → `updateAvatar()` → ❌ Intenta actualizar DB otra vez
4. **Conflicto**: Dos actualizaciones simultáneas causan inconsistencia
5. **Resultado**: Avatar desaparece por race condition

### 🔍 Evidencia Específica:

#### En ProfileAvatar.tsx (Líneas 150-180):
```typescript
// Primera llamada - CORRECTA
const response = await fetch('/api/users/avatar', {
  method: 'POST',
  body: formData,
});

const { imageUrl } = await response.json();
setCurrentImageUrl(imageUrl); // Update local
onImageChange?.(imageUrl); // ← DISPARA SEGUNDA LLAMADA
```

#### En InquilinoProfilePageCorrected.tsx (Líneas 100-110):
```typescript
const handleAvatarChange = async (imageUrl: string) => {
  try {
    await updateAvatar(imageUrl); // ← SEGUNDA LLAMADA INNECESARIA
    setProfileData(prev => ({ ...prev, profile_image: imageUrl }));
  } catch (error) {
    // Error handling
  }
};
```

---

## D) 🎯 CAUSA RAÍZ PROBABLE

### **Patrón de Doble Responsabilidad**

1. **ProfileAvatar** ya maneja el upload completo (API + storage)
2. **Página de perfil** recibe callback y hace update adicional innecesario
3. **Race condition** entre ambas actualizaciones
4. **Inconsistencia** en base de datos causa que avatar desaparezca

### ¿Por qué 204 No Content?
- Posible respuesta de `updateAvatar()` en UserContext
- O middleware que intercepta segunda llamada
- O endpoint que no devuelve JSON en ciertos casos

---

## E) 📋 PLAN DE FIX MÍNIMO

### 🎯 Estrategia: **Single Responsibility Pattern**

#### 1. **Eliminar Doble Handler**
- ✅ ProfileAvatar maneja upload completo
- ❌ Página NO debe hacer update adicional
- 🔄 Callback solo para UI feedback, no para API calls

#### 2. **Modificar handleAvatarChange**
```typescript
// ANTES (problemático):
const handleAvatarChange = async (imageUrl: string) => {
  await updateAvatar(imageUrl); // ← ELIMINAR ESTO
  setProfileData(prev => ({ ...prev, profile_image: imageUrl }));
};

// DESPUÉS (correcto):
const handleAvatarChange = (imageUrl: string) => {
  // Solo update local para UI optimista
  setProfileData(prev => ({ ...prev, profile_image: imageUrl }));
  // ProfileAvatar ya manejó la API
};
```

#### 3. **Garantizar Single-Flight**
- Usar flag `uploading` para prevenir múltiples uploads
- Deshabilitar input durante upload
- Mutex pattern en ProfileAvatar

#### 4. **Respuesta de API Consistente**
- Siempre devolver 200 + JSON con `{imageUrl, updated_at}`
- Nunca 204 No Content
- Incluir cache-busting en respuesta

#### 5. **Actualizar Cache-Busting**
- UserContext debe refrescar profile después de upload exitoso
- Usar `refreshProfile()` en lugar de `updateAvatar()`
- Evitar múltiples `router.refresh()`

---

## 🔧 ARCHIVOS A TOCAR

### 1. **Backend/src/app/profile/inquilino/InquilinoProfilePageCorrected.tsx**
- Simplificar `handleAvatarChange()` - solo UI update
- Eliminar llamada a `updateAvatar()`

### 2. **Backend/src/components/ui/profile-avatar.tsx**
- Agregar mutex/flag para prevenir dobles uploads
- Mejorar manejo de estados

### 3. **Backend/src/contexts/UserContext.tsx**
- Verificar que `updateAvatar()` no cause conflictos
- Asegurar single-flight pattern

### 4. **Backend/src/app/api/users/avatar/route.ts**
- Garantizar respuesta 200 + JSON consistente
- Nunca devolver 204 No Content

---

## 🎯 CONCLUSIÓN

**Causa Raíz**: Patrón de doble responsabilidad donde ProfileAvatar hace upload y la página hace update adicional, causando race condition.

**Solución**: Eliminar segunda llamada en `handleAvatarChange()`, mantener solo update de UI local.

**Impacto**: Fix mínimo, sin romper funcionalidad existente.

---

**Estado**: 🔍 INVESTIGACIÓN COMPLETADA  
**Próximo**: Implementar fix mínimo según plan  
**Prioridad**: 🔴 ALTA - Bug crítico de UX
