# TODO - Solución Completa Problemas Autenticación y Accesibilidad

## 🔧 Problemas Identificados
- [ ] **Multiple GoTrueClient instances** - Instancias duplicadas de Supabase client
- [ ] **Login state issue** - Error "debes iniciar sesión" cuando ya estás logueado
- [ ] **Form accessibility warnings** - Campos sin id/name, labels sin asociación

## 📋 Plan de Solución

### 1. Refactorizar Supabase Client (Singleton Pattern)
- [ ] Crear cliente singleton compartido
- [ ] Eliminar instancias duplicadas
- [ ] Actualizar imports en todos los archivos

### 2. Corregir Estado de Autenticación
- [ ] Revisar lógica de sesión en useSupabaseAuth
- [ ] Verificar persistencia de sesión
- [ ] Corregir manejo de estado de autenticación

### 3. Solucionar Warnings de Accesibilidad
- [ ] Auditar todos los formularios
- [ ] Agregar id/name a campos de formulario
- [ ] Asociar labels correctamente con inputs

### 4. Testing y Verificación
- [ ] Probar flujo completo de autenticación
- [ ] Verificar eliminación de warnings
- [ ] Confirmar funcionamiento de formularios

## 🎯 Archivos a Modificar
- `Backend/src/lib/supabase/client.ts` - Refactorizar cliente
- `Backend/src/lib/supabaseClient.ts` - Eliminar o refactorizar
- `Backend/src/hooks/useSupabaseAuth.ts` - Corregir lógica de auth
- `Backend/src/components/auth-provider.tsx` - Actualizar imports
- Formularios en componentes - Agregar accesibilidad

## ✅ Checklist Final
- [ ] No hay warnings de "Multiple GoTrueClient instances"
- [ ] Autenticación funciona correctamente
- [ ] No hay warnings de accesibilidad en formularios
- [ ] Sesión persiste correctamente
- [ ] Perfil carga sin errores de login
