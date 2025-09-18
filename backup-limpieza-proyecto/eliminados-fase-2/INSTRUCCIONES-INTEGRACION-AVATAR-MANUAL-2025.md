# INSTRUCCIONES DE INTEGRACIÓN MANUAL - SISTEMA DE AVATARES

## 🎯 INTEGRACIONES COMPLETADAS AUTOMÁTICAMENTE

### ✅ ProfileDropdown
- Import de AvatarUniversal agregado
- Reemplazo de iniciales por componente AvatarUniversal
- Configuración con cache-busting automático

### ✅ ProfileAvatar  
- Import de utilidades de avatar agregado
- Cache-busting integrado en display de imágenes
- Compatibilidad con sistema existente mantenida

## 🔧 INTEGRACIONES MANUALES REQUERIDAS

### 1. Navbar Component
**Archivo**: `Backend/src/components/navbar.tsx`

**Cambios requeridos**:
```tsx
// Agregar import
import { AvatarUniversal } from "@/components/ui/avatar-universal"

// En la sección desktop auth, reemplazar ProfileDropdown por:
<div className="flex items-center space-x-3">
  <AvatarUniversal
    src={currentUser?.user_metadata?.profile_image || null}
    name={currentUser?.user_metadata?.name || currentUser?.email || 'Usuario'}
    updatedAt={currentUser?.updated_at || null}
    size="sm"
    className="cursor-pointer"
  />
  <ProfileDropdown 
    user={currentUser} 
    onSignOut={signOut}
  />
</div>

// En la sección mobile, reemplazar el div con iniciales por:
<AvatarUniversal
  src={currentUser?.user_metadata?.profile_image || null}
  name={currentUser?.user_metadata?.name || currentUser?.email || 'Usuario'}
  updatedAt={currentUser?.updated_at || null}
  size="md"
  className="mr-3"
/>
```

### 2. UserContext Enhancement
**Archivo**: `Backend/src/contexts/UserContext.tsx`

**Cambios requeridos**:
```tsx
// En la función updateAvatar, agregar timestamp para cache-busting:
const now = new Date().toISOString();
const { error } = await supabase
  .from('User')
  .update({ 
    profile_image: imageUrl,
    updated_at: now
  })
  .eq('id', user.id);

// Actualizar estado local con timestamp
const updatedProfile = { 
  ...profile, 
  profile_image: imageUrl,
  updated_at: now
};
```

### 3. Otras Superficies de Avatar
**Archivos a revisar**:
- `Backend/src/app/comunidad/page.tsx`
- `Backend/src/app/messages/[conversationId]/page.tsx`
- `Backend/src/components/property-card.tsx`

**Cambios requeridos**:
Reemplazar cualquier uso directo de imágenes de avatar por:
```tsx
<AvatarUniversal
  src={user.profile_image || user.avatar}
  name={user.name}
  updatedAt={user.updated_at}
  size="md"
/>
```

## 🧪 TESTING REQUERIDO

### 1. Funcionalidad Básica
- [ ] Upload de avatar funciona correctamente
- [ ] Cache-busting se aplica automáticamente
- [ ] Imágenes aparecen instantáneamente después del upload
- [ ] Eliminación de avatar funciona

### 2. Consistencia Visual
- [ ] Avatar se muestra igual en navbar, dropdown, perfil
- [ ] Fallbacks con iniciales funcionan correctamente
- [ ] Diferentes tamaños se renderizan bien

### 3. Cache-Busting
- [ ] URLs incluyen parámetro ?v=timestamp
- [ ] Timestamp cambia después de upload
- [ ] Navegador descarga imagen fresca
- [ ] Funciona después de recargar página

### 4. Dispositivos Móviles
- [ ] Avatares se ven correctamente en móvil
- [ ] Upload funciona en dispositivos táctiles
- [ ] Performance es adecuada

## 📋 CHECKLIST DE FINALIZACIÓN

- [x] Utilidades de avatar creadas
- [x] API mejorada con cache-busting
- [x] Componente AvatarUniversal creado
- [ ] Navbar integrado con avatares reales
- [ ] ProfileDropdown integrado con avatares reales
- [ ] UserContext mejorado con cache-busting
- [ ] Testing completo realizado
- [ ] Documentación final creada

---
*Instrucciones generadas automáticamente el 17/9/2025, 10:44:35*
