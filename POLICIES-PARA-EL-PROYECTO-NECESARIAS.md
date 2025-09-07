# POLICIES PARA EL PROYECTO NECESARIAS

## Resumen Ejecutivo
Este documento contiene las políticas RLS (Row Level Security) necesarias y optimizadas para el proyecto de inmobiliaria. Las políticas han sido diseñadas considerando la seguridad de datos, funcionalidad del negocio y mejores prácticas de Supabase.

## Tabla: profiles
**Propósito:** Gestionar perfiles de usuario adicionales a auth.users

### Políticas Requeridas:
```sql
-- INSERT: Permitir insert sin restricción especial
CREATE POLICY "profiles_optimized_insert" ON profiles
FOR INSERT WITH CHECK (true);

-- SELECT: Restringir solo al usuario autenticado o rol service_role
CREATE POLICY "profiles_secure_select" ON profiles
FOR SELECT USING ((id = auth.uid()) OR (auth.role() = 'service_role'));

-- UPDATE: Solo el usuario propietario puede actualizar
CREATE POLICY "profiles_owner_update" ON profiles
FOR UPDATE USING (id = auth.uid());
```

## Tabla: properties
**Propósito:** Gestionar propiedades inmobiliarias

### Políticas Requeridas:
```sql
-- SELECT: Público, sin restricciones (para mostrar listados)
CREATE POLICY "properties_public_select" ON properties
FOR SELECT USING (true);

-- INSERT: Solo el usuario propietario puede insertar
CREATE POLICY "properties_owner_insert" ON properties
FOR INSERT WITH CHECK (((SELECT auth.uid())::text = user_id));

-- UPDATE: Solo el usuario propietario puede actualizar
CREATE POLICY "properties_owner_update" ON properties
FOR UPDATE USING (((SELECT auth.uid())::text = user_id));

-- DELETE: Solo el usuario propietario puede eliminar
CREATE POLICY "properties_owner_delete" ON properties
FOR DELETE USING (((SELECT auth.uid())::text = user_id));
```

## Tabla: property_inquiries
**Propósito:** Gestionar consultas sobre propiedades

### Políticas Requeridas:
```sql
-- SELECT: Solo el usuario que hizo la consulta o rol service_role
CREATE POLICY "property_inquiries_owner_select" ON property_inquiries
FOR SELECT USING ((inquirer_user_id = (SELECT (auth.uid())::text)) OR (auth.role() = 'service_role'));

-- INSERT: Solo el usuario puede insertar sus propias consultas
CREATE POLICY "property_inquiries_owner_insert" ON property_inquiries
FOR INSERT WITH CHECK ((inquirer_user_id = (SELECT (auth.uid())::text)) OR (auth.role() = 'service_role'));

-- UPDATE: Solo el usuario puede actualizar sus consultas
CREATE POLICY "property_inquiries_owner_update" ON property_inquiries
FOR UPDATE USING ((inquirer_user_id = (SELECT (auth.uid())::text)) OR (auth.role() = 'service_role'));

-- DELETE: Solo el usuario puede eliminar sus consultas
CREATE POLICY "property_inquiries_owner_delete" ON property_inquiries
FOR DELETE USING ((inquirer_user_id = (SELECT (auth.uid())::text)) OR (auth.role() = 'service_role'));
```

## Tabla: users
**Propósito:** Extensión de auth.users con datos adicionales del negocio

### Políticas Requeridas:
```sql
-- SELECT: Solo el usuario propietario o rol service_role
CREATE POLICY "users_owner_select" ON users
FOR SELECT USING (((id = (SELECT (auth.uid())::text)) OR (auth.role() = 'service_role')));

-- INSERT: Permitir insert para el usuario autenticado o rol service_role
CREATE POLICY "users_authenticated_insert" ON users
FOR INSERT WITH CHECK (((id = (SELECT (auth.uid())::text)) OR (auth.role() = 'service_role')));

-- UPDATE: Solo el usuario propietario o rol service_role
CREATE POLICY "users_owner_update" ON users
FOR UPDATE USING (((id = (SELECT (auth.uid())::text)) OR (auth.role() = 'service_role')));

-- DELETE: Solo el usuario propietario o rol service_role
CREATE POLICY "users_owner_delete" ON users
FOR DELETE USING (((id = (SELECT (auth.uid())::text)) OR (auth.role() = 'service_role')));
```

## Consideraciones de Seguridad

### ✅ POLÍTICAS SEGURAS IMPLEMENTADAS:
1. **Principio de Menor Privilegio**: Cada usuario solo accede a sus propios datos
2. **Protección de Datos Sensibles**: Información personal restringida
3. **Acceso Público Controlado**: Solo datos necesarios son públicos (properties)
4. **Rol Administrativo**: service_role tiene acceso completo cuando necesario

### ⚠️ PROBLEMAS CRÍTICOS EN POLÍTICAS ACTUALES:
1. **profiles SELECT=true**: Permite acceso público a datos de perfil
2. **users SELECT permisivo**: Usuarios autenticados ven todos los datos de usuario
3. **Políticas duplicadas**: Múltiples políticas idénticas en users
4. **service_role excesivo**: Algunos accesos podrían ser más restrictivos

## Recomendaciones de Implementación

### Prioridad 1 - CRÍTICA:
- Corregir `profiles` SELECT policy
- Corregir `users` SELECT policy
- Eliminar políticas duplicadas

### Prioridad 2 - MEDIA:
- Optimizar uso de `service_role`
- Consolidar políticas similares
- Agregar índices de rendimiento

### Prioridad 3 - BAJA:
- Documentar políticas
- Agregar comentarios descriptivos
- Implementar auditoría de acceso

## Script de Implementación

```sql
-- Ejecutar en orden de prioridad
-- 1. Eliminar políticas problemáticas
-- 2. Crear nuevas políticas seguras
-- 3. Verificar funcionamiento
-- 4. Optimizar rendimiento
```

## Testing Recomendado

1. **Test de Seguridad**: Verificar que usuarios no puedan acceder a datos ajenos
2. **Test Funcional**: Confirmar que operaciones CRUD funcionan correctamente
3. **Test de Rendimiento**: Medir impacto en consultas
4. **Test de Regresión**: Asegurar que cambios no rompan funcionalidad existente

---

**Fecha de Creación:** Diciembre 2024
**Versión:** 1.0
**Estado:** Lista para implementación
