-- =====================================================
-- FIX RLS: Tabla UserProfile para Sistema de Avatares
-- =====================================================
-- Corrige políticas RLS para permitir creación de perfiles

-- =====================================================
-- 1. VERIFICAR Y CORREGIR TABLA UserProfile
-- =====================================================

-- Crear tabla UserProfile si no existe
CREATE TABLE IF NOT EXISTS "UserProfile" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE UNIQUE,
    bio TEXT,
    location TEXT,
    photos TEXT[],
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columnas faltantes si no existen
DO $$
BEGIN
    -- Agregar created_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserProfile' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "UserProfile" ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Agregar updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserProfile' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "UserProfile" ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Agregar photos si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserProfile' 
        AND column_name = 'photos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "UserProfile" ADD COLUMN photos TEXT[];
    END IF;
END $$;

-- =====================================================
-- 2. CONFIGURAR RLS PARA UserProfile
-- =====================================================

-- Habilitar RLS
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Users can view their own profile" ON "UserProfile";
DROP POLICY IF EXISTS "Users can create their own profile" ON "UserProfile";
DROP POLICY IF EXISTS "Users can update their own profile" ON "UserProfile";
DROP POLICY IF EXISTS "Users can delete their own profile" ON "UserProfile";

-- Crear políticas RLS permisivas
CREATE POLICY "Users can view their own profile" ON "UserProfile"
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" ON "UserProfile"
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON "UserProfile"
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own profile" ON "UserProfile"
    FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 3. CREAR TRIGGER PARA updated_at EN UserProfile
-- =====================================================

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS update_userprofile_updated_at ON "UserProfile";

-- Crear trigger para UserProfile
CREATE TRIGGER update_userprofile_updated_at
    BEFORE UPDATE ON "UserProfile"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. OTORGAR PERMISOS EXPLÍCITOS
-- =====================================================

-- Otorgar permisos a usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON "UserProfile" TO authenticated;

-- =====================================================
-- 5. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todo está configurado
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
    
    RAISE NOTICE '✅ Tabla UserProfile correctamente configurada';
    RAISE NOTICE '✅ RLS habilitado con políticas permisivas';
    RAISE NOTICE '✅ Trigger updated_at configurado';
    RAISE NOTICE '✅ Permisos otorgados a authenticated';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 SISTEMA DE AVATARES LISTO PARA FUNCIONAR';
END $$;
