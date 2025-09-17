# PLAN FASE 2: PERSISTENCIA DE LA IMAGEN DE PERFIL DEL USUARIO

## ANÁLISIS DEL ESTADO ACTUAL

### Información Recopilada:

**Componentes Existentes:**
- ✅ `ProfileAvatar` component (`Backend/src/components/ui/profile-avatar.tsx`)
- ✅ Avatar API endpoint (`Backend/src/app/api/users/avatar/route.ts`)
- ✅ Supabase Storage configurado (`Backend/sql-migrations/setup-avatars-bucket-storage.sql`)
- ✅ `useSupabaseAuth` hook con función `updateProfile`
- ✅ Perfil de usuario (`Backend/src/app/profile/inquilino/InquilinoProfilePageCorrected.tsx`)

**Flujo Actual Identificado:**
1. **Subida de imagen**: Se sube a Supabase Storage bucket 'avatars'
2. **Guardado en BD**: Se actualiza la columna `avatar` en tabla `User`
3. **Problema identificado**: Inconsistencia entre campos `avatar` vs `profile_image`
4. **Problema de persistencia**: La imagen no se mantiene entre sesiones

**Problemas Detectados:**
1. **Inconsistencia de campos**: El código usa tanto `avatar` como `profile_image`
2. **Falta de sincronización**: No se actualiza el estado global del usuario tras cambio de avatar
3. **Recuperación incompleta**: Al iniciar sesión no se carga la imagen desde la BD
4. **Caché de sesión**: No se mantiene la imagen en el contexto de usuario

## PLAN DE IMPLEMENTACIÓN

### PASO 1: Normalizar Campos de Base de Datos

**Objetivo**: Unificar el campo de imagen de perfil en la base de datos

**Archivos a modificar:**
- `Backend/sql-migrations/normalize-avatar-field-2025.sql` (nuevo)
- `Backend/src/app/api/users/avatar/route.ts`
- `Backend/src/hooks/useSupabaseAuth.ts`

**Acciones:**
1. Crear migración SQL para normalizar campos
2. Actualizar API para usar campo consistente
3. Actualizar hook de autenticación

### PASO 2: Mejorar Recuperación de Perfil al Iniciar Sesión

**Objetivo**: Asegurar que la imagen se cargue correctamente al autenticarse

**Archivos a modificar:**
- `Backend/src/hooks/useSupabaseAuth.ts`
- `Backend/src/components/auth-provider.tsx`
- `Backend/src/app/api/users/profile/route.ts` (nuevo)

**Acciones:**
1. Crear endpoint para obtener perfil completo del usuario
2. Modificar hook de auth para cargar datos de perfil
3. Actualizar AuthProvider para manejar datos de perfil

### PASO 3: Implementar Context de Usuario Global

**Objetivo**: Mantener datos de usuario (incluyendo imagen) en estado global

**Archivos a crear/modificar:**
- `Backend/src/contexts/UserContext.tsx` (nuevo)
- `Backend/src/hooks/useUser.ts` (nuevo)
- `Backend/src/app/layout.tsx`

**Acciones:**
1. Crear contexto de usuario global
2. Implementar hook personalizado para acceder al contexto
3. Integrar contexto en layout principal

### PASO 4: Actualizar Componentes para Usar Estado Global

**Objetivo**: Sincronizar todos los componentes con el estado global del usuario

**Archivos a modificar:**
- `Backend/src/components/user-menu.tsx`
- `Backend/src/components/ui/profile-avatar.tsx`
- `Backend/src/app/profile/inquilino/InquilinoProfilePageCorrected.tsx`

**Acciones:**
1. Actualizar UserMenu para usar contexto global
2. Modificar ProfileAvatar para actualizar contexto
3. Sincronizar página de perfil con contexto

### PASO 5: Implementar Persistencia en Caché Local

**Objetivo**: Mantener imagen disponible durante la sesión y entre recargas

**Archivos a crear/modificar:**
- `Backend/src/utils/userCache.ts` (nuevo)
- `Backend/src/hooks/useUserCache.ts` (nuevo)

**Acciones:**
1. Implementar sistema de caché local (localStorage/sessionStorage)
2. Crear hook para manejar caché de usuario
3. Integrar caché con contexto de usuario

### PASO 6: Mejorar Manejo de Errores y Estados de Carga

**Objetivo**: Proporcionar mejor experiencia de usuario durante operaciones de imagen

**Archivos a modificar:**
- `Backend/src/components/ui/profile-avatar.tsx`
- `Backend/src/app/api/users/avatar/route.ts`

**Acciones:**
1. Mejorar manejo de errores en componente avatar
2. Implementar estados de carga más informativos
3. Agregar retry automático para fallos de red

### PASO 7: Testing y Validación

**Objetivo**: Verificar que la persistencia funciona correctamente

**Archivos a crear:**
- `Backend/test-profile-image-persistence-2025.js`

**Casos de prueba:**
1. Subir imagen y verificar guardado en BD
2. Cerrar sesión y volver a iniciar - verificar imagen persiste
3. Recargar página - verificar imagen se mantiene
4. Cambiar imagen - verificar actualización correcta
5. Eliminar imagen - verificar eliminación correcta

## DETALLES TÉCNICOS DE IMPLEMENTACIÓN

### 1. Normalización de Campos

```sql
-- Migración para normalizar campos de avatar
ALTER TABLE "User" RENAME COLUMN avatar TO profile_image;
-- Actualizar referencias existentes
UPDATE "User" SET profile_image = avatar WHERE avatar IS NOT NULL;
```

### 2. Estructura del Contexto de Usuario

```typescript
interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateAvatar: (imageUrl: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

### 3. Flujo de Persistencia Mejorado

```
1. Usuario sube imagen → ProfileAvatar
2. Imagen se sube a Supabase Storage
3. URL se guarda en BD (tabla User.profile_image)
4. Se actualiza contexto global de usuario
5. Se guarda en caché local
6. Todos los componentes se actualizan automáticamente
```

### 4. Recuperación al Iniciar Sesión

```
1. Usuario inicia sesión → useSupabaseAuth
2. Se obtiene sesión de Supabase Auth
3. Se carga perfil completo desde BD (incluyendo profile_image)
4. Se actualiza contexto global
5. Se guarda en caché local
6. Componentes muestran imagen automáticamente
```

## ARCHIVOS A CREAR/MODIFICAR

### Nuevos Archivos:
1. `Backend/sql-migrations/normalize-avatar-field-2025.sql`
2. `Backend/src/contexts/UserContext.tsx`
3. `Backend/src/hooks/useUser.ts`
4. `Backend/src/utils/userCache.ts`
5. `Backend/src/hooks/useUserCache.ts`
6. `Backend/src/app/api/users/profile/route.ts`
7. `Backend/test-profile-image-persistence-2025.js`

### Archivos a Modificar:
1. `Backend/src/app/api/users/avatar/route.ts`
2. `Backend/src/hooks/useSupabaseAuth.ts`
3. `Backend/src/components/auth-provider.tsx`
4. `Backend/src/components/user-menu.tsx`
5. `Backend/src/components/ui/profile-avatar.tsx`
6. `Backend/src/app/profile/inquilino/InquilinoProfilePageCorrected.tsx`
7. `Backend/src/app/layout.tsx`

## CRONOGRAMA DE IMPLEMENTACIÓN

**Día 1**: Pasos 1-2 (Normalización y recuperación)
**Día 2**: Pasos 3-4 (Contexto global y componentes)
**Día 3**: Pasos 5-6 (Caché y mejoras UX)
**Día 4**: Paso 7 (Testing y validación)

## CRITERIOS DE ÉXITO

✅ La imagen de perfil se mantiene después de cerrar sesión y volver a ingresar
✅ La imagen se muestra correctamente en todos los componentes (UserMenu, ProfileAvatar, etc.)
✅ Los cambios de imagen se reflejan inmediatamente en toda la aplicación
✅ El sistema maneja correctamente errores de red y estados de carga
✅ La imagen se mantiene durante recargas de página
✅ El rendimiento no se ve afectado por el sistema de caché

## CONSIDERACIONES ADICIONALES

1. **Seguridad**: Mantener políticas RLS de Supabase Storage
2. **Rendimiento**: Implementar lazy loading para imágenes
3. **Accesibilidad**: Mantener alt text y aria labels
4. **Responsive**: Asegurar que funciona en todos los dispositivos
5. **Fallbacks**: Manejar casos donde la imagen no se puede cargar

Este plan aborda completamente el problema de persistencia de imagen de perfil identificado en la Fase 2.
