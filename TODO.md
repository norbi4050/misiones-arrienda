# TODO - Soft Guard Dashboard y Perfil con Imagen

## ✅ Completado

### 1. Middleware Soft Guard
- ✅ Reemplazado middleware.ts con versión "soft" que usa createServerClient
- ✅ Solo hace auth.getSession() para sincronizar cookies, sin redirecciones
- ✅ Evidencia: middleware actualizado sin redirecciones

### 2. Dashboard Soft Guard
- ✅ /dashboard con soft-guard implementado
- ✅ Si no hay sesión, muestra CTA de login
- ✅ Si hay sesión, render normal
- ✅ Evidencia: dashboard muestra contenido apropiado según estado de autenticación

### 3. "Mi perfil" con sección de foto
- ✅ Link "Mi perfil" del header apunta a /profile/inquilino
- ✅ Página /profile/inquilino tiene ProfileImageUpload
- ✅ Tras PATCH exitoso, ejecuta router.refresh() en el componente uploader
- ✅ Evidencia: sección de foto presente y funcional

## Smoke Test
- ✅ /dashboard logueado → no te manda a login
- ✅ Menú "Mi perfil" → ves sección Foto de perfil (uploader presente)
- ✅ Subís imagen <2MB → queda en avatars/<uid>/… y PATCH 200 guarda URL
- ✅ Header refresca y muestra el avatar nuevo (gracias a router.refresh())

## Estado Final
✅ **TAREA COMPLETADA** - Todos los requisitos implementados correctamente.
