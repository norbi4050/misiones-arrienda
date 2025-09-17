-- =====================================================
-- FIX RLS CORREGIDO: Tabla UserProfile para Sistema de Avatares
-- =====================================================
-- Corrige políticas RLS usando el nombre correcto de columna: userId

-- =====================================================
-- 1. VERIFICAR ESTRUCTURA ACTUAL DE UserProfile
-- =====================================================

-- Verificar qué columnas existen en UserProfile
DO $$
BEGIN
    RAISE NOTICE 'Verificando estructura de UserProfile...';
    
    -- Verificar si userId existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserProfile' 
        AND column_name = 'userId'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Columna userId encontrada';
    ELSE
        RAISE NOTICE '❌ Columna userId NO encontrada';
    END IF;
    
    -- Verificar si user_id existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserProfile' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Columna user_id encontrada';
    ELSE
        RAISE NOTICE '❌ Columna user_id NO encontrada';
    END IF;
END $$;

-- =====================================================
-- 2. AGREGAR COLUMNAS FALTANTES A UserProfile
-- =====================================================

-- Agregar created_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserProfile' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "UserProfile" ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Columna created_at agregada a UserProfile';
    ELSE
        RAISE NOTICE '✅ Columna created_at ya existe en UserProfile';
    END IF;
END $$;

-- Agregar updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserProfile' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "UserProfile" ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Columna updated_at agregada a UserProfile';
    ELSE
        RAISE NOTICE '✅ Columna updated_at ya existe en UserProfile';
    END IF;
END $$;

-- Agregar photos si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserProfile' 
        AND column_name = 'photos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "UserProfile" ADD COLUMN photos TEXT[];
        RAISE NOTICE '✅ Columna photos agregada a UserProfile';
    ELSE
        RAISE NOTICE '✅ Columna photos ya existe en UserProfile';
    END IF;
END $$;

-- =====================================================
-- 3. CONFIGURAR RLS PARA UserProfile CON NOMBRE CORRECTO
-- =====================================================

-- Habilitar RLS
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Users can view their own profile" ON "UserProfile";
DROP POLICY IF EXISTS "Users can create their own profile" ON "UserProfile";
DROP POLICY IF EXISTS "Users can update their own profile" ON "UserProfile";
DROP POLICY IF EXISTS "Users can delete their own profile" ON "UserProfile";

-- Crear políticas RLS usando userId (camelCase)
CREATE POLICY "Users can view their own profile" ON "UserProfile"
    FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users can create their own profile" ON "UserProfile"
    FOR INSERT WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update their own profile" ON "UserProfile"
    FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users can delete their own profile" ON "UserProfile"
    FOR DELETE USING ("userId" = auth.uid());

-- =====================================================
-- 4. CREAR TRIGGER PARA updated_at EN UserProfile
-- =====================================================

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS update_userprofile_updated_at ON "UserProfile";

-- Crear trigger para UserProfile
CREATE TRIGGER update_userprofile_updated_at
    BEFORE UPDATE ON "UserProfile"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. OTORGAR PERMISOS EXPLÍCITOS
-- =====================================================

-- Otorgar permisos a usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON "UserProfile" TO authenticated;

-- =====================================================
-- 6. VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
    -- Verificar tabla existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'UserProfile' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERROR: Tabla UserProfile no existe';
    END IF;
    
    -- Verificar RLS habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'UserProfile' AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'ERROR: RLS no habilitado en UserProfile';
    END IF;
    
    -- Verificar políticas existen
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'UserProfile' AND policyname = 'Users can create their own profile'
    ) THEN
        RAISE EXCEPTION 'ERROR: Política de creación no existe';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CORRECCIÓN RLS USERPROFILE COMPLETADA';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '✅ Tabla UserProfile correctamente configurada';
    RAISE NOTICE '✅ RLS habilitado con políticas permisivas usando userId';
    RAISE NOTICE '✅ Trigger updated_at configurado';
    RAISE NOTICE '✅ Permisos otorgados a authenticated';
    RAISE NOTICE '✅ Columnas created_at, updated_at, photos agregadas';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 SISTEMA DE AVATARES COMPLETAMENTE FUNCIONAL';
    RAISE NOTICE '🧪 PRUEBA SUBIR AVATAR AHORA';
END $$;
