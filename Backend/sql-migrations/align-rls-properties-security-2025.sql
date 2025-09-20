-- =====================================================
-- ALINEACIÓN RLS - LISTADO PÚBLICO Y OPERACIONES DUEÑO
-- Fecha: 3 de Enero 2025
-- Objetivo: Alinear RLS con listado público y operaciones del dueño
-- =====================================================

-- ===== ANÁLISIS DEL ESTADO ACTUAL =====
-- 
-- PROBLEMA IDENTIFICADO:
-- - El listado público usa Service Role (bypassa RLS) con filtros en server
-- - Esto es CORRECTO para performance, pero necesitamos políticas RLS como backup
-- - Los endpoints del dueño necesitan políticas específicas para CRUD
-- - Datos sensibles (user_id, contact_*) deben estar protegidos en endpoints públicos
--
-- ESTRATEGIA:
-- 1. Mantener Service Role para listado público (performance)
-- 2. Crear políticas RLS para endpoints autenticados
-- 3. Asegurar que datos sensibles no se expongan públicamente

-- ===== VERIFICAR ESTADO ACTUAL DE RLS =====

-- Verificar si RLS está habilitado en properties
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS HABILITADO'
        ELSE 'RLS DESHABILITADO'
    END as status
FROM pg_tables 
WHERE tablename = 'properties';

-- Listar políticas existentes
SELECT 
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- ===== HABILITAR RLS EN PROPERTIES =====

-- Habilitar RLS en la tabla properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- ===== ELIMINAR POLÍTICAS EXISTENTES (SI EXISTEN) =====

-- Eliminar políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON properties;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON properties;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;

-- ===== POLÍTICAS RLS PARA PROPERTIES =====

-- 1. POLÍTICA SELECT PÚBLICA - Solo propiedades disponibles y activas
CREATE POLICY "public_properties_select" ON properties
FOR SELECT 
USING (
    status = 'AVAILABLE' 
    AND is_active = true
);

-- 2. POLÍTICA SELECT DEL DUEÑO - Incluye sus DRAFT y todas sus propiedades
CREATE POLICY "owner_properties_select" ON properties
FOR SELECT 
USING (
    auth.uid()::text = user_id
);

-- 3. POLÍTICA INSERT DEL DUEÑO - Solo puede crear sus propias propiedades
CREATE POLICY "owner_properties_insert" ON properties
FOR INSERT 
WITH CHECK (
    auth.uid()::text = user_id
);

-- 4. POLÍTICA UPDATE DEL DUEÑO - Solo puede actualizar sus propias propiedades
CREATE POLICY "owner_properties_update" ON properties
FOR UPDATE 
USING (
    auth.uid()::text = user_id
)
WITH CHECK (
    auth.uid()::text = user_id
);

-- 5. POLÍTICA DELETE DEL DUEÑO - Solo puede eliminar sus propias propiedades
CREATE POLICY "owner_properties_delete" ON properties
FOR DELETE 
USING (
    auth.uid()::text = user_id
);

-- ===== VERIFICAR POLÍTICAS CREADAS =====

SELECT 
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- ===== COMENTARIOS SOBRE LAS POLÍTICAS =====

COMMENT ON POLICY "public_properties_select" ON properties IS 
'Permite acceso público de lectura solo a propiedades AVAILABLE y activas. Usado como backup cuando no se usa Service Role.';

COMMENT ON POLICY "owner_properties_select" ON properties IS 
'Permite al dueño ver todas sus propiedades, incluyendo DRAFT. Usado en dashboard del usuario.';

COMMENT ON POLICY "owner_properties_insert" ON properties IS 
'Permite al dueño crear nuevas propiedades. Valida que user_id coincida con el usuario autenticado.';

COMMENT ON POLICY "owner_properties_update" ON properties IS 
'Permite al dueño actualizar solo sus propiedades. Valida ownership en USING y WITH CHECK.';

COMMENT ON POLICY "owner_properties_delete" ON properties IS 
'Permite al dueño eliminar solo sus propiedades. Usado para borrar DRAFT o propiedades expiradas.';

-- ===== TESTING DE POLÍTICAS =====

-- Test 1: Verificar que RLS está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'properties' AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'ERROR: RLS no está habilitado en properties';
    END IF;
    
    RAISE NOTICE 'SUCCESS: RLS habilitado en properties';
END $$;

-- Test 2: Contar políticas creadas
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'properties';
    
    IF policy_count < 5 THEN
        RAISE EXCEPTION 'ERROR: Solo % políticas creadas, esperadas 5', policy_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: % políticas RLS creadas para properties', policy_count;
END $$;

-- ===== CONFIGURACIÓN PARA ENDPOINTS =====

-- Crear función helper para verificar ownership
CREATE OR REPLACE FUNCTION check_property_ownership(property_id TEXT, user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM properties 
        WHERE id = property_id AND user_id = check_property_ownership.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== RESUMEN DE CONFIGURACIÓN =====

-- Mostrar resumen final
SELECT 
    'CONFIGURACIÓN RLS PROPERTIES' as component,
    CASE 
        WHEN rowsecurity THEN '✅ HABILITADO'
        ELSE '❌ DESHABILITADO'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'properties') as total_policies
FROM pg_tables 
WHERE tablename = 'properties';

-- ===== RECOMENDACIONES DE USO =====

/*
RECOMENDACIONES PARA ENDPOINTS:

1. LISTADO PÚBLICO (/api/properties GET):
   - ✅ MANTENER Service Role con filtros server-side (performance)
   - ✅ Políticas RLS como backup de seguridad
   - ✅ NO exponer user_id, contact_phone, contact_email, address completa

2. DASHBOARD DEL DUEÑO (/api/properties/my GET):
   - ✅ Usar cliente autenticado (respeta RLS)
   - ✅ Política owner_properties_select permite ver DRAFT
   - ✅ Incluir todos los campos (es el dueño)

3. CREAR PROPIEDAD (/api/properties POST):
   - ✅ Usar cliente autenticado
   - ✅ Política owner_properties_insert valida ownership
   - ✅ user_id debe coincidir con auth.uid()

4. ACTUALIZAR PROPIEDAD (/api/properties/[id] PUT):
   - ✅ Usar cliente autenticado
   - ✅ Política owner_properties_update valida ownership
   - ✅ Solo el dueño puede actualizar

5. ELIMINAR PROPIEDAD (/api/properties/[id] DELETE):
   - ✅ Usar cliente autenticado
   - ✅ Política owner_properties_delete valida ownership
   - ✅ Solo el dueño puede eliminar

CAMPOS SENSIBLES A PROTEGER EN ENDPOINTS PÚBLICOS:
- user_id (nunca exponer)
- contact_phone (solo en detalle de propiedad)
- contact_email (solo en detalle de propiedad)
- address completa (solo ciudad/provincia en listado)
*/

-- ===== VERIFICACIÓN FINAL =====

SELECT 
    '🔒 RLS PROPERTIES CONFIGURADO' as status,
    'Políticas creadas: ' || COUNT(*) as details
FROM pg_policies 
WHERE tablename = 'properties';
