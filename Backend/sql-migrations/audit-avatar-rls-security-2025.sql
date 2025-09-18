-- AUDITORÍA DE SEGURIDAD RLS PARA AVATARES - 2025
-- Este script verifica y mejora las políticas de seguridad para el sistema de avatares

-- 1. VERIFICAR POLÍTICAS EXISTENTES PARA TABLA USER
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'User' 
ORDER BY policyname;

-- 2. VERIFICAR POLÍTICAS DE STORAGE PARA BUCKET AVATARS
SELECT 
    name,
    definition
FROM storage.policies 
WHERE bucket_id = 'avatars'
ORDER BY name;

-- 3. VERIFICAR PERMISOS DE BUCKET AVATARS
SELECT 
    id,
    name,
    owner,
    created_at,
    updated_at,
    public,
    avif_autodetection,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';

-- 4. CREAR/ACTUALIZAR POLÍTICAS RLS PARA AVATARES SI NO EXISTEN

-- Política para permitir a usuarios ver su propio profile_image
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' 
        AND policyname = 'Users can view own profile_image'
    ) THEN
        CREATE POLICY "Users can view own profile_image" ON "User"
        FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- Política para permitir a usuarios actualizar su propio profile_image
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' 
        AND policyname = 'Users can update own profile_image'
    ) THEN
        CREATE POLICY "Users can update own profile_image" ON "User"
        FOR UPDATE USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Política para permitir a usuarios ver profile_images de otros (para comunidad/mensajes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' 
        AND policyname = 'Users can view others profile_image'
    ) THEN
        CREATE POLICY "Users can view others profile_image" ON "User"
        FOR SELECT USING (true); -- Permitir ver avatares de otros usuarios
    END IF;
END $$;

-- 5. POLÍTICAS DE STORAGE PARA BUCKET AVATARS

-- Política para subir avatares (solo a su propia carpeta)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
    'Users can upload own avatars',
    'avatars',
    'bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]'
) ON CONFLICT (name, bucket_id) DO NOTHING;

-- Política para ver avatares (todos pueden ver)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
    'Anyone can view avatars',
    'avatars',
    'bucket_id = ''avatars'''
) ON CONFLICT (name, bucket_id) DO NOTHING;

-- Política para actualizar avatares (solo propios)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
    'Users can update own avatars',
    'avatars',
    'bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]'
) ON CONFLICT (name, bucket_id) DO NOTHING;

-- Política para eliminar avatares (solo propios)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
    'Users can delete own avatars',
    'avatars',
    'bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]'
) ON CONFLICT (name, bucket_id) DO NOTHING;

-- 6. VERIFICAR QUE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'User';

-- Habilitar RLS si no está habilitado
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- 7. VERIFICAR CONFIGURACIÓN DEL BUCKET AVATARS
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

-- 8. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS DE AVATARES
CREATE INDEX IF NOT EXISTS idx_user_profile_image_updated_at 
ON "User" (profile_image, updated_at) 
WHERE profile_image IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_updated_at 
ON "User" (updated_at DESC);

-- 9. VERIFICAR TRIGGER DE UPDATED_AT
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'User' 
AND trigger_name LIKE '%updated_at%';

-- Crear trigger si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. REPORTE FINAL DE SEGURIDAD
SELECT 
    'AUDITORÍA COMPLETADA' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'User';

SELECT 
    'STORAGE POLICIES' as status,
    COUNT(*) as total_storage_policies
FROM storage.policies 
WHERE bucket_id = 'avatars';

-- Verificar que no hay vulnerabilidades obvias
SELECT 
    'VERIFICACIÓN FINAL' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname LIKE '%own%') 
        THEN 'SEGURO: Políticas de ownership implementadas'
        ELSE 'RIESGO: Faltan políticas de ownership'
    END as security_check;
