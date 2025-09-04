-- 🔒 POLÍTICAS RLS PARA PERFILES DE USUARIO
-- Solución para error 401 profile fetch

-- Habilitar RLS en tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "users_select_own_profile" ON users;
CREATE POLICY "users_select_own_profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Política para UPDATE: Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para INSERT: Permitir inserción durante registro
DROP POLICY IF EXISTS "users_insert_own_profile" ON users;
CREATE POLICY "users_insert_own_profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Verificar permisos en la tabla
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'users';