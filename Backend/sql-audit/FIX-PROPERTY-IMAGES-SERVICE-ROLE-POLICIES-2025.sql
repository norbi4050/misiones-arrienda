-- FIX POLÍTICAS RLS PARA SERVICE ROLE - PROPERTY IMAGES
-- Fecha: 3 Enero 2025
-- Problema: Service Role bloqueado por políticas que requieren auth.role() = 'authenticated'

-- =====================================================
-- SOLUCIÓN: CREAR POLÍTICAS ESPECÍFICAS PARA SERVICE ROLE
-- =====================================================

-- 1. Política para INSERT (upload) - Service Role
CREATE POLICY "service_role_upload_property_images" ON storage.objects
FOR INSERT TO service_role
WITH CHECK (bucket_id = 'property-images');

-- 2. Política para SELECT (list) - Service Role  
CREATE POLICY "service_role_read_property_images" ON storage.objects
FOR SELECT TO service_role
USING (bucket_id = 'property-images');

-- 3. Política para UPDATE - Service Role
CREATE POLICY "service_role_update_property_images" ON storage.objects
FOR UPDATE TO service_role
USING (bucket_id = 'property-images')
WITH CHECK (bucket_id = 'property-images');

-- 4. Política para DELETE - Service Role
CREATE POLICY "service_role_delete_property_images" ON storage.objects
FOR DELETE TO service_role
USING (bucket_id = 'property-images');

-- =====================================================
-- VERIFICACIÓN: LISTAR POLÍTICAS DESPUÉS DEL FIX
-- =====================================================

-- Verificar que las nuevas políticas se crearon
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%service_role%property%'
ORDER BY policyname;

-- =====================================================
-- ALTERNATIVA: MODIFICAR POLÍTICAS EXISTENTES
-- =====================================================

-- Si prefieres modificar las existentes en lugar de crear nuevas:
/*
-- Opción A: Agregar service_role a políticas existentes
ALTER POLICY "owner_upload_property_images" ON storage.objects TO authenticated, service_role;
ALTER POLICY "owner_update_property_images" ON storage.objects TO authenticated, service_role;
ALTER POLICY "owner_delete_property_images" ON storage.objects TO authenticated, service_role;

-- Opción B: Crear política más permisiva para service_role
CREATE POLICY "service_role_full_access_property_images" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'property-images')
WITH CHECK (bucket_id = 'property-images');
*/

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =====================================================

/*
PASOS PARA APLICAR EL FIX:

1. Conectarse a Supabase SQL Editor
2. Ejecutar las 4 políticas CREATE POLICY una por una
3. Ejecutar la query de verificación
4. Probar upload desde la aplicación

RESULTADO ESPERADO:
- Service Role podrá hacer INSERT/SELECT/UPDATE/DELETE en property-images
- Upload funcionará sin error 500
- Políticas existentes para usuarios autenticados se mantienen intactas
*/
