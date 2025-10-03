-- =============================================
-- MIGRACIÓN CORREGIDA: norbi4050@gmail.com
-- Fecha: 2025-01-XX
-- Usuario: Cesar - Baldes Inmobiliaria
-- UUID: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
-- =============================================

-- =============================================
-- PASO 1: VERIFICAR ESTRUCTURA DE LA TABLA USERS
-- =============================================

-- Primero verificamos qué columnas existen realmente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- =============================================
-- PASO 2: INSERTAR USUARIO CON DATOS CORRECTOS
-- =============================================

-- Inserción con solo las columnas que existen
INSERT INTO users (
  id,                    -- UUID de auth.users
  name,                  -- Nombre
  email,                 -- Email
  phone,                 -- Teléfono (opcional)
  user_type,             -- Tipo: 'inmobiliaria'
  is_company,            -- true para inmobiliarias
  company_name,          -- Nombre de la empresa
  license_number,        -- Matrícula profesional (opcional)
  email_verified,        -- true si el email está verificado
  created_at,            -- Fecha de creación
  updated_at             -- Fecha de actualización
) VALUES (
  'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b',  -- UUID de auth.users
  'Cesar',                                   -- Nombre del usuario
  'norbi4050@gmail.com',                     -- Email
  NULL,                                      -- Teléfono (agregar después si lo tienes)
  'inmobiliaria',                            -- Tipo de usuario
  true,                                      -- Es empresa
  'Baldes',                                  -- Nombre de la empresa
  NULL,                                      -- Matrícula (agregar después si la tienes)
  true,                                      -- Email verificado
  NOW(),                                     -- Fecha de creación
  NOW()                                      -- Fecha de actualización
)
ON CONFLICT (id) DO NOTHING;  -- Evita error si ya existe

-- =============================================
-- PASO 3: VERIFICAR QUE SE INSERTÓ CORRECTAMENTE
-- =============================================

SELECT 
  id,
  name,
  email,
  user_type,
  is_company,
  company_name,
  email_verified,
  created_at
FROM users 
WHERE email = 'norbi4050@gmail.com';

-- Resultado esperado: 1 fila con tus datos

-- =============================================
-- PASO 4: VERIFICAR CONSISTENCIA
-- =============================================

-- Verificar que el usuario existe en ambas tablas
SELECT 
  'auth.users' as tabla,
  au.id,
  au.email,
  au.created_at,
  NULL::text as user_type,
  NULL::boolean as is_company
FROM auth.users au
WHERE au.email = 'norbi4050@gmail.com'

UNION ALL

SELECT 
  'users' as tabla,
  u.id,
  u.email,
  u.created_at,
  u.user_type,
  u.is_company
FROM users u
WHERE u.email = 'norbi4050@gmail.com';

-- Resultado esperado: 2 filas con el mismo id y email

-- =============================================
-- PASO 5: VERIFICAR CONSTRAINTS
-- =============================================

-- Verificar que cumple con todos los constraints
SELECT 
  id,
  email,
  user_type,
  is_company,
  company_name,
  CASE 
    WHEN user_type = 'inmobiliaria' AND is_company = true AND company_name IS NOT NULL AND company_name != '' 
      THEN '✅ VÁLIDO'
    ELSE '❌ INVÁLIDO'
  END as estado_validacion
FROM users
WHERE email = 'norbi4050@gmail.com';

-- Resultado esperado: estado_validacion = '✅ VÁLIDO'

-- =============================================
-- PASO 6: VERIFICAR TODOS LOS CONSTRAINTS DE LA TABLA
-- =============================================

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
ORDER BY conname;

-- =============================================
-- PASO 7 (OPCIONAL): ACTUALIZAR DATOS ADICIONALES
-- =============================================

-- Si quieres agregar más información después, usa estos UPDATE:

-- Agregar teléfono
/*
UPDATE users
SET 
  phone = '+54 9 XXX XXX-XXXX',
  updated_at = NOW()
WHERE email = 'norbi4050@gmail.com';
*/

-- Agregar CUIT (si la columna existe)
/*
UPDATE users
SET 
  cuit = 'XX-XXXXXXXX-X',
  updated_at = NOW()
WHERE email = 'norbi4050@gmail.com';
*/

-- Agregar matrícula profesional
/*
UPDATE users
SET 
  license_number = 'CUCICBA XXXX',
  updated_at = NOW()
WHERE email = 'norbi4050@gmail.com';
*/

-- Agregar dirección completa (si las columnas existen)
/*
UPDATE users
SET 
  address = 'Tu dirección',
  city = 'Tu ciudad',
  province = 'Misiones',
  postal_code = 'XXXX',
  updated_at = NOW()
WHERE email = 'norbi4050@gmail.com';
*/

-- =============================================
-- PASO 8: CREAR PERFIL EN INMOBILIARIAS (SI EXISTE LA TABLA)
-- =============================================

-- Verificar si existe la tabla inmobiliarias
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_name = 'inmobiliarias'
) as tabla_inmobiliarias_existe;

-- Si existe, insertar perfil de inmobiliaria
/*
INSERT INTO inmobiliarias (
  id,
  user_id,
  company_name,
  phone,
  email,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),                         -- ID único para inmobiliaria
  'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b',   -- user_id (mismo que users.id)
  'Baldes',                                  -- Nombre de la empresa
  NULL,                                      -- Teléfono
  'norbi4050@gmail.com',                     -- Email
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;
*/

-- =============================================
-- RESUMEN DE PASOS A SEGUIR:
-- =============================================

/*
1. ✅ Ejecutar PASO 1 para ver la estructura de la tabla
2. ✅ Ejecutar PASO 2 para insertar el usuario
3. ✅ Ejecutar PASO 3 para verificar
4. ✅ Ejecutar PASO 4 para verificar consistencia
5. ✅ Ejecutar PASO 5 para verificar constraints
6. ✅ Cerrar sesión en la aplicación
7. ✅ Limpiar caché del navegador (localStorage.clear() en consola)
8. ✅ Volver a hacer login
9. ✅ Ejecutar en consola del navegador:
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

-- =============================================
-- DATOS DEL USUARIO:
-- =============================================

/*
UUID: a4ef1f3d-c3e8-46df-b186-5b5c837cc14b
Email: norbi4050@gmail.com
Nombre: Cesar
Empresa: Baldes
Tipo: inmobiliaria
is_company: true
email_verified: true
*/

-- =============================================
-- NOTAS IMPORTANTES:
-- =============================================

-- ✅ DESPUÉS DE EJECUTAR:
-- 1. Cierra sesión en la aplicación
-- 2. Limpia caché: localStorage.clear() en consola del navegador
-- 3. Vuelve a hacer login
-- 4. Verifica que puedes acceder a /mi-empresa

-- 🎯 RESULTADO ESPERADO:
-- - Usuario existe en tabla users
-- - is_company = true
-- - user_type = 'inmobiliaria'
-- - company_name = 'Baldes'
-- - Puedes acceder a todas las funciones de inmobiliaria

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
