-- 🔐 RLS POLICIES ESPECÍFICAS PARA ADMINISTRADORES
-- Sistema de Eliminación de Usuarios

-- Política para que solo admins puedan ver todos los usuarios
CREATE POLICY "admin_can_view_all_users" ON auth.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Política para que solo admins puedan eliminar usuarios
CREATE POLICY "admin_can_delete_users" ON auth.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  AND auth.uid() != id -- Prevenir auto-eliminación
);

-- Política para que solo admins puedan actualizar roles
CREATE POLICY "admin_can_update_user_roles" ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
    AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
    AND up.role = 'admin'
  )
);

-- Política para acceso a audit_logs solo para admins
CREATE POLICY "admin_can_view_audit_logs" ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Política para crear audit_logs (sistema)
CREATE POLICY "system_can_create_audit_logs" ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Habilitar RLS en las tablas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Comentarios para documentación
COMMENT ON POLICY "admin_can_view_all_users" ON auth.users IS 
'Permite a los administradores ver todos los usuarios del sistema';

COMMENT ON POLICY "admin_can_delete_users" ON auth.users IS 
'Permite a los administradores eliminar usuarios, excepto a sí mismos';

COMMENT ON POLICY "admin_can_update_user_roles" ON public.user_profiles IS 
'Permite a los administradores actualizar roles de usuarios';

COMMENT ON POLICY "admin_can_view_audit_logs" ON public.audit_logs IS 
'Permite a los administradores ver todos los logs de auditoría';

COMMENT ON POLICY "system_can_create_audit_logs" ON public.audit_logs IS 
'Permite al sistema crear registros de auditoría';
