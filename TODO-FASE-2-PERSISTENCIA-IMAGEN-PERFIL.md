# TODO - FASE 2: PERSISTENCIA DE IMAGEN DE PERFIL

## PROGRESO ACTUAL ✅

### ✅ PASO 1: Normalización de Base de Datos
- [x] Migración SQL creada (`Backend/sql-migrations/normalize-avatar-field-2025.sql`)
- [x] Script incluye normalización de campos `avatar` → `profile_image`
- [x] Funciones de limpieza y validación implementadas
- [x] Trigger de sincronización temporal creado

### ✅ PASO 2: APIs Actualizadas
- [x] API de avatar actualizada (`Backend/src/app/api/users/avatar/route.ts`)
- [x] API de perfil completo creada (`Backend/src/app/api/users/profile/route.ts`)
- [x] Hook de autenticación actualizado (`Backend/src/hooks/useSupabaseAuth.ts`)
- [x] Todas las APIs usan campo `profile_image` normalizado

### ✅ PASO 3: Contexto Global de Usuario
- [x] UserContext creado (`Backend/src/contexts/UserContext.tsx`)
- [x] Hook personalizado creado (`Backend/src/hooks/useUser.ts`)
- [x] Caché local implementado (localStorage)
- [x] Funciones de actualización de perfil y avatar

### ✅ PASO 4: Integración en Layout
- [x] UserProvider integrado en layout principal
- [x] Componente Avatar UI creado (`Backend/src/components/ui/avatar.tsx`)
- [x] UserMenu actualizado para usar contexto global
- [x] Página de perfil actualizada para usar nuevo contexto

### ✅ PASO 5: Testing
- [x] Script de testing creado (`Backend/test-profile-image-persistence-2025.js`)
- [x] Verificación de todos los componentes implementados
- [x] Validación de estructura de archivos

## PENDIENTE PARA COMPLETAR 🔄

### 🔄 PASO 6: Corrección de Errores TypeScript
- [ ] Corregir error en useEffect de InquilinoProfilePage
- [ ] Ajustar props de componentes RecentActivity y ProfileStats
- [ ] Verificar compatibilidad de ProfileForm
- [ ] Resolver imports faltantes

### 🔄 PASO 7: Ejecución de Migración SQL
- [ ] Ejecutar migración en Supabase Dashboard
- [ ] Verificar que bucket 'avatars' esté configurado
- [ ] Confirmar políticas RLS funcionando
- [ ] Validar datos migrados correctamente

### 🔄 PASO 8: Testing de Integración
- [ ] Probar subida de imagen de perfil
- [ ] Verificar guardado en base de datos
- [ ] Probar logout → login → verificar persistencia
- [ ] Confirmar caché local funcionando
- [ ] Validar sincronización entre componentes

### 🔄 PASO 9: Optimizaciones Finales
- [ ] Implementar lazy loading para imágenes
- [ ] Mejorar manejo de errores de red
- [ ] Optimizar rendimiento de caché
- [ ] Agregar fallbacks para imágenes rotas

## INSTRUCCIONES PARA CONTINUAR

### 1. Ejecutar Migración SQL
```sql
-- Ejecutar en Supabase SQL Editor:
-- Backend/sql-migrations/normalize-avatar-field-2025.sql
```

### 2. Verificar Configuración de Storage
```sql
-- Verificar bucket avatars:
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Verificar políticas RLS:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 3. Instalar Dependencias Faltantes
```bash
npm install @radix-ui/react-avatar
```

### 4. Corregir Errores TypeScript
- Ajustar props de componentes
- Verificar tipos de interfaces
- Resolver imports faltantes

### 5. Testing Manual
1. Subir imagen de perfil
2. Cerrar sesión
3. Volver a iniciar sesión
4. Verificar que imagen persiste

## CRITERIOS DE ÉXITO

- ✅ Imagen de perfil se mantiene después de logout/login
- ✅ Imagen se muestra en UserMenu y ProfileAvatar
- ✅ Cambios se reflejan inmediatamente en toda la app
- ✅ Caché local funciona correctamente
- ✅ No hay errores de TypeScript
- ✅ APIs responden correctamente
- ✅ Base de datos almacena URLs correctamente

## NOTAS IMPORTANTES

1. **Compatibilidad**: Mantener compatibilidad con código legacy durante transición
2. **Seguridad**: Políticas RLS de Supabase Storage deben estar activas
3. **Rendimiento**: Caché local reduce llamadas a API
4. **UX**: Estados de carga y error bien manejados
5. **Escalabilidad**: Estructura permite agregar más campos de perfil fácilmente

## ARCHIVOS CLAVE CREADOS/MODIFICADOS

### Nuevos Archivos:
- `Backend/sql-migrations/normalize-avatar-field-2025.sql`
- `Backend/src/contexts/UserContext.tsx`
- `Backend/src/hooks/useUser.ts`
- `Backend/src/app/api/users/profile/route.ts`
- `Backend/src/components/ui/avatar.tsx`
- `Backend/test-profile-image-persistence-2025.js`

### Archivos Modificados:
- `Backend/src/app/api/users/avatar/route.ts`
- `Backend/src/hooks/useSupabaseAuth.ts`
- `Backend/src/app/layout.tsx`
- `Backend/src/components/user-menu.tsx`
- `Backend/src/app/profile/inquilino/InquilinoProfilePageCorrected.tsx`

---

**Última actualización**: 2025-01-15
**Estado**: 70% completado - Pendiente correcciones TypeScript y testing final
