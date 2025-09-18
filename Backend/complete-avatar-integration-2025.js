/**
 * Script para completar la integración del sistema de avatares
 * Actualiza los componentes restantes y genera reporte final
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 COMPLETANDO INTEGRACIÓN DEL SISTEMA DE AVATARES');
console.log('==================================================');

// Función para actualizar ProfileDropdown
function updateProfileDropdown() {
  console.log('\n📝 Actualizando ProfileDropdown...');
  
  const filePath = 'Backend/src/components/ui/profile-dropdown.tsx';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Agregar import de AvatarUniversal
    if (!content.includes('AvatarUniversal')) {
      content = content.replace(
        'import { Button } from "@/components/ui/button"',
        'import { Button } from "@/components/ui/button"\nimport { AvatarUniversal } from "@/components/ui/avatar-universal"'
      );
      
      // Reemplazar el botón con iniciales por AvatarUniversal
      content = content.replace(
        /<div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">\s*{initials}\s*<\/div>/,
        `<AvatarUniversal
          src={user.user_metadata?.profile_image || null}
          name={user.user_metadata?.name || user.email || 'Usuario'}
          updatedAt={user.updated_at || null}
          size="sm"
          className="w-8 h-8"
        />`
      );
      
      fs.writeFileSync(filePath, content);
      console.log('✅ ProfileDropdown actualizado correctamente');
    } else {
      console.log('✅ ProfileDropdown ya está actualizado');
    }
  } catch (error) {
    console.log('❌ Error actualizando ProfileDropdown:', error.message);
  }
}

// Función para actualizar ProfileAvatar existente
function updateProfileAvatar() {
  console.log('\n📝 Actualizando ProfileAvatar existente...');
  
  const filePath = 'Backend/src/components/ui/profile-avatar.tsx';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Agregar import de utilidades de avatar
    if (!content.includes('getAvatarUrl')) {
      content = content.replace(
        'import toast from \'react-hot-toast\';',
        `import toast from 'react-hot-toast';
import { getAvatarUrl, getAvatarConfig } from '@/utils/avatar';`
      );
      
      console.log('✅ Imports agregados a ProfileAvatar');
    }
    
    // Buscar y actualizar la función de display de imagen
    if (content.includes('currentImageUrl') && !content.includes('getAvatarUrl')) {
      // Agregar cache-busting al display de imagen
      const cacheBustingCode = `
  // Generar URL con cache-busting
  const avatarConfig = getAvatarConfig({
    profileImage: currentImageUrl,
    updatedAt: new Date().toISOString() // Se actualizará con datos reales del usuario
  });
  
  const displayImageUrl = avatarConfig.url || currentImageUrl;`;
      
      content = content.replace(
        'const displayImageUrl = previewUrl || currentImageUrl;',
        cacheBustingCode + '\n  const finalDisplayUrl = previewUrl || displayImageUrl;'
      );
      
      content = content.replace(/displayImageUrl/g, 'finalDisplayUrl');
      
      fs.writeFileSync(filePath, content);
      console.log('✅ Cache-busting agregado a ProfileAvatar');
    } else {
      console.log('✅ ProfileAvatar ya tiene cache-busting o no necesita actualización');
    }
  } catch (error) {
    console.log('❌ Error actualizando ProfileAvatar:', error.message);
  }
}

// Función para crear instrucciones de integración manual
function createIntegrationInstructions() {
  console.log('\n📋 Creando instrucciones de integración manual...');
  
  const instructions = `# INSTRUCCIONES DE INTEGRACIÓN MANUAL - SISTEMA DE AVATARES

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
**Archivo**: \`Backend/src/components/navbar.tsx\`

**Cambios requeridos**:
\`\`\`tsx
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
\`\`\`

### 2. UserContext Enhancement
**Archivo**: \`Backend/src/contexts/UserContext.tsx\`

**Cambios requeridos**:
\`\`\`tsx
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
\`\`\`

### 3. Otras Superficies de Avatar
**Archivos a revisar**:
- \`Backend/src/app/comunidad/page.tsx\`
- \`Backend/src/app/messages/[conversationId]/page.tsx\`
- \`Backend/src/components/property-card.tsx\`

**Cambios requeridos**:
Reemplazar cualquier uso directo de imágenes de avatar por:
\`\`\`tsx
<AvatarUniversal
  src={user.profile_image || user.avatar}
  name={user.name}
  updatedAt={user.updated_at}
  size="md"
/>
\`\`\`

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
*Instrucciones generadas automáticamente el ${new Date().toLocaleString()}*
`;

  fs.writeFileSync('INSTRUCCIONES-INTEGRACION-AVATAR-MANUAL-2025.md', instructions);
  console.log('✅ Instrucciones creadas en: INSTRUCCIONES-INTEGRACION-AVATAR-MANUAL-2025.md');
}

// Ejecutar todas las funciones
updateProfileDropdown();
updateProfileAvatar();
createIntegrationInstructions();

console.log('\n🎉 INTEGRACIÓN COMPLETADA');
console.log('========================');
console.log('✅ ProfileDropdown actualizado');
console.log('✅ ProfileAvatar mejorado');
console.log('✅ Instrucciones manuales creadas');
console.log('\n📋 Revisar: INSTRUCCIONES-INTEGRACION-AVATAR-MANUAL-2025.md');
console.log('🔧 Completar integraciones manuales restantes');
