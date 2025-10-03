-- =============================================
-- MIGRACIÓN: Usuario de Inmobiliaria Faltante en Tabla Users
-- Fecha: 2025-01-XX
-- Propósito: Migrar usuario existente en auth.users a tabla users
-- =============================================

-- =============================================
-- CONTEXTO DEL PROBLEMA:
-- =============================================
-- 1. Usuario existe en auth.users (autenticación funciona)
-- 2. Usuario NO existe en tabla users (perfil de aplicación falta)
-- 3. Tipo de usuario: Inmobiliaria
-- 4. Necesita campos: is_company, company_name, license_number, etc.

-- =============================================
-- PASO 0: DIAGNÓSTICO PREVIO (EJECUTAR PRIMERO)
-- =============================================

-- 0.1 Verificar que el usuario existe en auth.users
-- REEMPLAZA 'tu-email@ejemplo.com' con tu email real
SELECT 
  id as auth_user_id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users 
WHERE email = 'tu-email@ejemplo.com';

-- Resultado esperado: 1 fila con tu información
-- COPIA EL 'id' (auth_user_id) para usarlo en los siguientes pasos

-- 0.2 Verificar que NO existe en tabla users
SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name
FROM users 
WHERE email = 'tu-email@ejemplo.com';

-- Resultado esperado: 0 filas (no existe)

-- 0.3 Verificar estructura de la tabla users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- =============================================
-- PASO 1: PREPARAR DATOS PARA LA MIGRACIÓN
-- =============================================

-- 1.1 Verificar que la columna is_company existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_company'
  ) THEN
    RAISE EXCEPTION 'ERROR: La columna is_company no existe. Ejecuta primero FIX-MISSING-IS-COMPANY-COLUMN-2025.sql';
  END IF;
END $$;

-- =============================================
-- PASO 2: INSERTAR USUARIO EN TABLA USERS
-- =============================================

-- 2.1 OPCIÓN A: Inserción con datos mínimos (RECOMENDADO PARA EMPEZAR)
-- REEMPLAZA LOS VALORES ENTRE COMILLAS SIMPLES CON TUS DATOS REALES

INSERT INTO users (
  id,                    -- UUID de auth.users
  name,                  -- Nombre de la persona o empresa
  email,                 -- Email (debe coincidir con auth.users)
  phone,                 -- Teléfono (opcional, puede ser NULL)
  user_type,             -- Tipo: 'inmobiliaria'
  is_company,            -- true para inmobiliarias
  company_name,          -- Nombre de la empresa
  license_number,        -- Matrícula profesional (opcional)
  is_verified,           -- false inicialmente (se activa con CUIT)
  email_verified,        -- true si el email está verificado
  created_at,            -- Fecha de creación
  updated_at             -- Fecha de actualización
) VALUES (
  'PEGA-AQUI-EL-UUID-DE-AUTH-USERS',  -- Reemplaza con el id de auth.users
  'Nombre de Tu Empresa',               -- Tu nombre o nombre de empresa
  'tu-email@ejemplo.com',               -- Tu email
  NULL,                                 -- Teléfono (NULL si no lo tienes)
  'inmobiliaria',                       -- Tipo de usuario
  true,                                 -- Es empresa
  'Nombre Legal de Tu Empresa SA',     -- Nombre completo de la empresa
  NULL,                                 -- Matrícula (NULL si no la tienes aún)
  false,                                -- No verificado (se verifica con CUIT)
  true,                                 -- Email verificado
  NOW(),                                -- Fecha de creación
  NOW()                                 -- Fecha de actualización
)
ON CONFLICT (id) DO NOTHING;  -- Evita error si ya existe

-- 2.2 OPCIÓN B: Inserción con datos completos (SI TIENES TODA LA INFO)
-- Descomenta y completa si tienes todos los datos

/*
INSERT INTO users (
  id,
  name,
  email,
  phone,
  user_type,
  is_company,
  company_name,
  license_number,
  cuit,
  address,
  city,
  province,
  postal_code,
  website,
  description,
  is_verified,
  email_verified,
  created_at,
  updated_at
) VALUES (
  'PEGA-AQUI-EL-UUID-DE-AUTH-USERS',
  'Nombre Completo',
  'tu-email@ejemplo.com',
  '+54 9 11 1234-5678',
  'inmobiliaria',
  true,
  'Tu Empresa Inmobiliaria SA',
  'CUCICBA 1234',
  '30-12345678-9',
  'Av. Corrientes 1234',
  'Buenos Aires',
  'Buenos Aires',
  'C1043',
  'https://www.tuempresa.com',
  'Descripción de tu empresa inmobiliaria',
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================
-- PASO 3: VERIFICAR LA INSERCIÓN
-- =============================================

-- 3.1 Verificar que el usuario ahora existe en users
SELECT 
  id,
  name,
  email,
  user_type,
  is_company,
  company_name,
  license_number,
  is_verified,
  email_verified,
  created_at
FROM users 
WHERE email = 'tu-email@ejemplo.com';

-- Resultado esperado: 1 fila con tus datos

-- 3.2 Verificar consistencia entre auth.users y users
SELECT 
  'auth.users' as tabla,
  au.id,
  au.email,
  au.created_at,
  NULL::text as user_type,
  NULL::boolean as is_company
FROM auth.users au
WHERE au.email = 'tu-email@ejemplo.com'

UNION ALL

SELECT 
  'users' as tabla,
  u.id,
  u.email,
  u.created_at,
  u.user_type,
  u.is_company
FROM users u
WHERE u.email = 'tu-email@ejemplo.com';

-- Resultado esperado: 2 filas con el mismo id y email

-- =============================================
-- PASO 4: CREAR PERFIL EN INMOBILIARIAS (SI EXISTE LA TABLA)
-- =============================================

-- 4.1 Verificar si existe la tabla inmobiliarias
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_name = 'inmobiliarias'
) as tabla_inmobiliarias_existe;

-- 4.2 Si existe, insertar perfil de inmobiliaria
-- Descomenta si la tabla existe y quieres crear el perfil

/*
INSERT INTO inmobiliarias (
  id,
  user_id,
  company_name,
  cuit,
  license_number,
  phone,
  email,
  website,
  address,
  city,
  province,
  postal_code,
  description,
  is_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),                    -- ID único para inmobiliaria
  'PEGA-AQUI-EL-UUID-DE-AUTH-USERS',  -- user_id (mismo que users.id)
  'Tu Empresa Inmobiliaria SA',
  NULL,                                 -- CUIT (agregar después)
  NULL,                                 -- Matrícula (agregar después)
  NULL,                                 -- Teléfono
  'tu-email@ejemplo.com',
  NULL,                                 -- Website
  NULL,                                 -- Dirección
  NULL,                                 -- Ciudad
  NULL,                                 -- Provincia
  NULL,                                 -- Código postal
  NULL,                                 -- Descripción
  false,                                -- No verificado
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;
*/

-- =============================================
-- PASO 5: VERIFICACIÓN COMPLETA POST-MIGRACIÓN
-- =============================================

-- 5.1 Verificar que el usuario puede hacer login
-- Este query simula lo que hace el endpoint /api/users/profile
SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  u.user_type,
  u.is_company,
  u.company_name,
  u.license_number,
  u.cuit,
  u.is_verified,
  u.email_verified,
  u.avatar_url,
  u.created_at
FROM users u
WHERE u.email = 'tu-email@ejemplo.com';

-- Resultado esperado: 1 fila con todos tus datos

-- 5.2 Verificar que is_company está correctamente configurado
SELECT 
  user_type,
  is_company,
  COUNT(*) as total
FROM users
WHERE email = 'tu-email@ejemplo.com'
GROUP BY user_type, is_company;

-- Resultado esperado:
-- user_type    | is_company | total
-- inmobiliaria | true       | 1

-- 5.3 Verificar que no hay inconsistencias
SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  CASE 
    WHEN user_type = 'inmobiliaria' AND is_company != true THEN 'ERROR: is_company debe ser true'
    WHEN is_company = true AND (company_name IS NULL OR company_name = '') THEN 'ERROR: falta company_name'
    ELSE 'OK'
  END as estado
FROM users
WHERE email = 'tu-email@ejemplo.com';

-- Resultado esperado: estado = 'OK'

-- =============================================
-- PASO 6: ACTUALIZAR DATOS ADICIONALES (OPCIONAL)
-- =============================================

-- 6.1 Actualizar teléfono si no lo agregaste antes
/*
UPDATE users
SET 
  phone = '+54 9 11 1234-5678',
  updated_at = NOW()
WHERE email = 'tu-email@ejemplo.com';
*/

-- 6.2 Actualizar dirección y datos de contacto
/*
UPDATE users
SET 
  address = 'Av. Corrientes 1234',
  city = 'Buenos Aires',
  province = 'Buenos Aires',
  postal_code = 'C1043',
  website = 'https://www.tuempresa.com',
  updated_at = NOW()
WHERE email = 'tu-email@ejemplo.com';
*/

-- 6.3 Actualizar descripción de la empresa
/*
UPDATE users
SET 
  description = 'Somos una empresa inmobiliaria con más de 10 años de experiencia...',
  updated_at = NOW()
WHERE email = 'tu-email@ejemplo.com';
*/

-- 6.4 Agregar CUIT (cuando lo tengas)
/*
UPDATE users
SET 
  cuit = '30-12345678-9',
  updated_at = NOW()
WHERE email = 'tu-email@ejemplo.com';
*/

-- 6.5 Agregar matrícula profesional (cuando la tengas)
/*
UPDATE users
SET 
  license_number = 'CUCICBA 1234',
  updated_at = NOW()
WHERE email = 'tu-email@ejemplo.com';
*/

-- =============================================
-- PASO 7: VERIFICAR PERMISOS Y RLS
-- =============================================

-- 7.1 Verificar políticas RLS en tabla users
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
WHERE tablename = 'users';

-- 7.2 Verificar que el usuario puede ver sus propios datos
-- Este query simula el RLS
SELECT 
  id,
  email,
  user_type,
  is_company
FROM users
WHERE id = 'PEGA-AQUI-EL-UUID-DE-AUTH-USERS';

-- =============================================
-- PASO 8: TESTING EN LA APLICACIÓN
-- =============================================

-- Después de ejecutar este script, prueba lo siguiente:

-- 8.1 Cerrar sesión en la aplicación
-- 8.2 Limpiar caché del navegador:
--     - localStorage.clear()
--     - sessionStorage.clear()
-- 8.3 Volver a hacer login
-- 8.4 Verificar en consola del navegador:
/*
fetch('/api/debug-my-user-type')
  .then(r => r.json())
  .then(data => {
    console.log('Email:', data.authUser?.email);
    console.log('Existe en users:', data.diagnosis.existsInUsers);
    console.log('is_company:', data.diagnosis.isCompanyValue);
    console.log('user_type:', data.usersTable.userType);
    console.log('company_name:', data.usersTable.companyName);
  });
*/

-- 8.5 Verificar que puedes acceder a:
--     - /mi-empresa (perfil de inmobiliaria)
--     - /publicar (publicar propiedades)
--     - /mis-publicaciones (ver tus publicaciones)

-- =============================================
-- PASO 9: TROUBLESHOOTING
-- =============================================

-- 9.1 Si el usuario sigue sin aparecer, verificar:
SELECT 
  'Tabla users' as verificacion,
  COUNT(*) as registros
FROM users
WHERE email = 'tu-email@ejemplo.com'

UNION ALL

SELECT 
  'Tabla auth.users' as verificacion,
  COUNT(*) as registros
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';

-- Ambos deben tener 1 registro

-- 9.2 Si hay error de tipo UUID vs TEXT:
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('users', 'inmobiliarias')
  AND column_name IN ('id', 'user_id')
ORDER BY table_name, column_name;

-- 9.3 Si hay error de constraint:
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass;

-- =============================================
-- ROLLBACK (Solo si algo salió mal)
-- =============================================

-- CUIDADO: Esto eliminará el usuario de la tabla users
-- Solo ejecutar si necesitas empezar de nuevo

/*
DELETE FROM users 
WHERE email = 'tu-email@ejemplo.com';

-- Verificar que se eliminó
SELECT COUNT(*) FROM users WHERE email = 'tu-email@ejemplo.com';
-- Debe retornar 0
*/

-- =============================================
-- RESUMEN DE PASOS A SEGUIR:
-- =============================================

/*
1. ✅ Ejecutar PASO 0 para obtener tu UUID de auth.users
2. ✅ Copiar el UUID
3. ✅ Ejecutar PASO 2.1 reemplazando los valores con tus datos
4. ✅ Ejecutar PASO 3 para verificar
5. ✅ Ejecutar PASO 5 para verificación completa
6. ✅ Cerrar sesión y volver a entrar en la app
7. ✅ Verificar que todo funciona

Opcional:
- Ejecutar PASO 4 si existe tabla inmobiliarias
- Ejecutar PASO 6 para agregar datos adicionales
*/

-- =============================================
-- NOTAS IMPORTANTES:
-- =============================================

-- ⚠️ ANTES DE EJECUTAR:
-- 1. Haz un backup de la base de datos
-- 2. Ejecuta primero en un ambiente de desarrollo/staging
-- 3. Verifica que tienes el UUID correcto de auth.users

-- ✅ DESPUÉS DE EJECUTAR:
-- 1. Limpia caché del navegador
-- 2. Cierra sesión y vuelve a entrar
-- 3. Verifica que puedes acceder a todas las funciones

-- 📝 DATOS REQUERIDOS:
-- - UUID de auth.users (obtener del PASO 0)
-- - Email (debe coincidir exactamente)
-- - Nombre de la empresa
-- - Tipo de usuario: 'inmobiliaria'

-- 📝 DATOS OPCIONALES (pueden agregarse después):
-- - Teléfono
-- - CUIT
-- - Matrícula profesional
-- - Dirección completa
-- - Website
-- - Descripción

-- =============================================
-- CONTACTO Y SOPORTE:
-- =============================================

-- Si después de ejecutar este script sigues teniendo problemas:
-- 1. Ejecuta el PASO 9 (Troubleshooting)
-- 2. Copia los resultados de las queries de verificación
-- 3. Comparte los resultados para análisis

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
