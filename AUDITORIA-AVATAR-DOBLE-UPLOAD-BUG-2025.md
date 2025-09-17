# AUDITORIA: Bug de Doble Upload y Avatar Desaparecido - 2025

## 🎯 OBJETIVO
Investigar por qué aparecen dos uploads de avatar y luego se borra, identificando:
- Dos requests en Network
- Uno devuelve 204 No Content
- Dos imágenes "nuevas" en UI que luego desaparecen

## 📋 METODOLOGÍA
Solo investigación y reporte de evidencias. NO modificar código aún.

---

## A) MAPA DEL FLUJO DE AVATAR

### 1. Componente Principal de Upload
**`Backend/src/components/ui/profile-avatar.tsx`**
- Línea ~100-150: `handleFileUpload()` - Función principal de upload
- Línea ~200-250: `handleInputChange()` - Handler del input file
- Línea ~300: `onImageChange?.()` - Callback al componente padre

### 2. API Route
**`Backend/src/app/api/users/avatar/route.ts`**
- Línea 30-80: `POST()` - Upload de avatar
- Línea 150-200: `DELETE()` - Eliminación de avatar  
- Línea 250-300: `GET()` - Obtener avatar actual

### 3. Utilidades
**`Backend/src/utils/avatar.ts`**
- Línea 15-30: `getAvatarUrl()` - Genera URLs con cache-busting
- Línea 100-120: `generateAvatarFilename()` - Nombres únicos

### 4. Contexto de Usuario
**`Backend/src/contexts/UserContext.tsx`**
- Línea ~150-200: `updateAvatar()` - Actualización en contexto
- Línea ~250-300: `updateProfile()` - Actualización general de perfil

### 5. Página de Perfil
**`Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx`**
- Uso del componente ProfileAvatar
- Posibles handlers adicionales

---

## B) LLAMADAS A /api/users/avatar

### Búsqueda de Todas las Llamadas
Necesito buscar en el código todas las referencias a `/api/users/avatar`:

1. **ProfileAvatar Component**: `fetch('/api/users/avatar', { method: 'POST' })`
2. **UserContext**: Posible llamada en `updateAvatar()`
3. **Páginas de perfil**: Posibles llamadas directas
4. **Hooks personalizados**: useUser, useSupabaseAuth, etc.

---

## C) EVIDENCIA DE DUPLICACIÓN

### Posibles Causas de Doble Request:

#### 1. **React StrictMode**
- En desarrollo, React.StrictMode ejecuta efectos dos veces
- Verificar si hay useEffect sin dependencias correctas

#### 2. **Doble Handler**
- onChange + onSubmit en el mismo input
- Dos listeners en el mismo elemento

#### 3. **Optimistic Update + Real Update**
- Preview inmediato + confirmación del servidor
- Estado local + estado del servidor

#### 4. **Context + Component State**
- UserContext.updateAvatar() + ProfileAvatar.handleUpload()
- Doble actualización de estado

#### 5. **Router Refresh**
- router.refresh() llamado múltiples veces
- Revalidación automática de Next.js

---

## D) ANÁLISIS DE RESPUESTAS DEL BACKEND

### Problema del 204 No Content:
- ¿La API devuelve 204 en lugar de 200 + JSON?
- ¿El frontend espera JSON pero recibe empty response?
- ¿Hay middleware que intercepta la respuesta?

### Cache-Busting:
- ¿Se devuelve updated_at para ?v=epoch?
- ¿Se actualiza correctamente user_profiles.photos[0]?

---

## E) INVESTIGACIÓN DETALLADA

### Archivos a Examinar:
1. `Backend/src/components/ui/profile-avatar.tsx` - Lógica de upload
2. `Backend/src/app/api/users/avatar/route.ts` - API responses
3. `Backend/src/contexts/UserContext.tsx` - Estado global
4. `Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx` - Integración
5. `Backend/src/hooks/useUser.ts` - Hooks de usuario

### Buscar Patrones Problemáticos:
- Múltiples `fetch()` calls
- useEffect sin cleanup
- Estado que dispara re-renders
- Callbacks anidados
- Promise chains sin await

---

## 🔍 PRÓXIMOS PASOS DE INVESTIGACIÓN

1. **Examinar ProfileAvatar component** - Buscar dobles handlers
2. **Revisar API route responses** - Verificar status codes
3. **Analizar UserContext** - Buscar dobles updates
4. **Buscar useEffect problemáticos** - Dependencias incorrectas
5. **Verificar StrictMode** - Efectos duplicados en desarrollo

---

**ESTADO**: 🔄 INVESTIGACIÓN EN PROGRESO  
**PRÓXIMO**: Examinar archivos específicos para evidencia de duplicación
