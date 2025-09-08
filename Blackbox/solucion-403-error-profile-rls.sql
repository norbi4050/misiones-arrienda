-- =========================================
-- SOLUCIÓN ERROR 403 PROFILE - POLÍTICAS RLS
-- =========================================
-- Fecha: Diciembre 2025
-- Problema: Error 403 al actualizar perfil de usuario
-- Solución: Crear políticas RLS para tabla users
-- =========================================

-- PASO 1: Verificar estado actual de RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- PASO 2: Habilitar RLS en tabla users (si no está habilitado)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- PASO 3: Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON users;

-- PASO 4: Crear nuevas políticas RLS específicas y seguras

-- Política SELECT: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política INSERT: Los usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Política UPDATE: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política DELETE: Los usuarios pueden eliminar su propio perfil
CREATE POLICY "Users can delete own profile"
ON users
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- PASO 5: Política adicional para administradores (opcional)
-- Solo si hay un rol de administrador definido
-- CREATE POLICY "Admins can manage all profiles"
-- ON users
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- PASO 6: Verificar que las políticas se crearon correctamente
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
WHERE tablename = 'users'
ORDER BY policyname;

-- PASO 7: Probar las políticas con una consulta de ejemplo
-- Esta consulta debería funcionar ahora para usuarios autenticados
-- SELECT * FROM users WHERE id = auth.uid();

-- =========================================
-- VERIFICACIÓN POST-INSTALACIÓN
-- =========================================
-- Después de ejecutar este script, verificar:
-- 1. Los usuarios autenticados pueden hacer SELECT en su propio perfil
-- 2. Los usuarios autenticados pueden hacer UPDATE en su propio perfil
-- 3. Los usuarios autenticados pueden hacer INSERT en su propio perfil
-- 4. Los usuarios NO autenticados NO pueden acceder a ningún perfil
-- 5. Los usuarios NO pueden acceder a perfiles de otros usuarios
-- =========================================
