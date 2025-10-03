-- =============================================
-- MIGRACIÓN ESPECÍFICA: norbi4050@gmail.com
-- Fecha: 2025-01-XX
-- Usuario: Inmobiliaria
-- =============================================

-- =============================================
-- PASO 1: OBTENER UUID DEL USUARIO EN AUTH.USERS
-- =============================================

-- Ejecuta esto primero para obtener el UUID
SELECT 
  id as auth_user_id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'norbi4050@gmail.com';

-- COPIA EL 'id' (UUID) que aparece en el resultado
-- Lo necesitarás para el siguiente paso

-- =============================================
-- PASO 2: INSERTAR USUARIO EN TABLA USERS
-- =============================================

-- IMPORTANTE: Reemplaza 'PEGA-AQUI-EL-UUID' con el UUID real de auth.users

INSERT INTO users (
  id,                    -- UUID de auth.users (REEMPLAZAR)
  name,                  -- Nombre de la empresa
  email,                 -- Email
  phone,                 -- Teléfono (opcional)
  user_type,             -- Tipo: 'inmobiliaria'
  is_company,            -- true para inmobiliarias
  company_name,          -- Nombre de la empresa
  license_number,        -- Matrícula profesional (opcional)
  is_verified,           -- false inicialmente
  email_verified,        -- true si el email está verificado
  created_at,            -- Fecha de creación
  updated_at             -- Fecha de actualización
) VALUES (
  'PEGA-AQUI-EL-UUID-DE-AUTH-USERS',  -- ⚠️ REEMPLAZAR CON UUID REAL
  'Norbi Inmobiliaria',                 -- Nombre (puedes cambiarlo)
  'norbi4050@gmail.com',                -- Email
  NULL,                                 -- Teléfono (agregar después si lo tienes)
  'inmobiliaria',                       -- Tipo de usuario
  true,                                 -- Es empresa
  'Norbi Inmobiliaria',                 -- Nombre de la empresa (puedes cambiarlo)
  NULL,                                 -- Matrícula (agregar después si la tienes)
  false,                                -- No verificado (se verifica con CUIT)
  true,                                 -- Email verificado
  NOW(),                                -- Fecha de creación
  NOW()                                 -- Fecha de actualización
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
  is_verified,
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
-- PASO 6 (OPCIONAL): ACTUALIZAR DATOS ADICIONALES
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

-- Agregar CUIT
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

-- Agregar dirección completa
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
-- RESUMEN DE PASOS A SEGUIR:
-- =============================================

/*
1. ✅ Ejecutar PASO 1 para obtener el UUID de auth.users
2. ✅ Copiar el UUID
3. ✅ Reemplazar 'PEGA-AQUI-EL-UUID-DE-AUTH-USERS' en el PASO 2 con el UUID real
4. ✅ Ejecutar PASO 2 para insertar el usuario
5. ✅ Ejecutar PASO 3 para verificar
6. ✅ Ejecutar PASO 4 para verificar consistencia
7. ✅ Ejecutar PASO 5 para verificar constraints
8. ✅ Cerrar sesión en la aplicación
9. ✅ Limpiar caché del navegador (localStorage.clear() en consola)
10. ✅ Volver a hacer login
11. ✅ Ejecutar en consola del navegador:
    fetch('/api/debug-my-user-type')
      .then(r => r.json())
      .then(data => console.log(data));
*/

-- =============================================
-- NOTAS IMPORTANTES:
-- =============================================

-- ⚠️ ANTES DE EJECUTAR:
-- 1. Asegúrate de tener el UUID correcto de auth.users
-- 2. Verifica que el email sea exactamente 'norbi4050@gmail.com'
-- 3. Ejecuta en el SQL Editor de Supabase

-- ✅ DESPUÉS DE EJECUTAR:
-- 1. Cierra sesión en la aplicación
-- 2. Limpia caché: localStorage.clear() en consola del navegador
-- 3. Vuelve a hacer login
-- 4. Verifica que puedes acceder a /mi-empresa

-- 🎯 RESULTADO ESPERADO:
-- - Usuario existe en tabla users
-- - is_company = true
-- - user_type = 'inmobiliaria'
-- - company_name tiene valor
-- - Puedes acceder a todas las funciones de inmobiliaria

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
