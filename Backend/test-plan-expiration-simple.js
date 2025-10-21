console.log('🧪 TEST: Sistema de Auto-Expiración de Planes\n')
console.log('=' .repeat(60))
console.log('\n📋 Para probar el sistema completo, ejecuta estos SQL en Supabase:\n')

const USER_ID = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'

console.log(`
-- ============================================
-- PASO 1: Crear 10 propiedades de prueba
-- ============================================
INSERT INTO properties (user_id, title, description, price, property_type, operation_type, is_active, location, bedrooms, bathrooms, area)
VALUES
  ('${USER_ID}'::uuid, 'Propiedad Test 1', 'Prueba', 150000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 2', 'Prueba', 160000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 3', 'Prueba', 170000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 4', 'Prueba', 180000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 5', 'Prueba', 190000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 6', 'Prueba', 200000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 7', 'Prueba', 210000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 8', 'Prueba', 220000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 9', 'Prueba', 230000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50),
  ('${USER_ID}'::uuid, 'Propiedad Test 10', 'Prueba', 240000, 'departamento', 'venta', true, 'Posadas', 2, 1, 50);

-- ============================================
-- PASO 2: Verificar total de propiedades
-- ============================================
SELECT COUNT(*) as total_activas
FROM properties
WHERE user_id = '${USER_ID}'::uuid
  AND is_active = true;

-- ============================================
-- PASO 3: Asignar plan Professional
-- ============================================
UPDATE users
SET
  plan_tier = 'professional',
  plan_end_date = NOW() + INTERVAL '1 year'
WHERE id = '${USER_ID}';

-- ============================================
-- PASO 4: Simular expiración (cambiar fecha al pasado)
-- ============================================
UPDATE users
SET plan_end_date = NOW() - INTERVAL '1 day'
WHERE id = '${USER_ID}';

-- ============================================
-- PASO 5: Ejecutar función de expiración
-- ============================================
SELECT * FROM expire_user_plan('${USER_ID}');

-- Deberías ver:
-- success: true
-- old_plan: professional
-- new_plan: free
-- properties_deactivated: 8 (porque teníamos 13 total, mantiene 5)

-- ============================================
-- PASO 6: Verificar propiedades después de expiración
-- ============================================
SELECT COUNT(*) as activas
FROM properties
WHERE user_id = '${USER_ID}'::uuid
  AND is_active = true;
-- Debe retornar: 5

SELECT COUNT(*) as desactivadas
FROM properties
WHERE user_id = '${USER_ID}'::uuid
  AND is_active = false
  AND deactivated_reason IS NOT NULL;
-- Debe retornar: 8

-- ============================================
-- PASO 7: Ver detalles de propiedades desactivadas
-- ============================================
SELECT
  id,
  title,
  deactivated_reason,
  deactivated_at,
  created_at
FROM properties
WHERE user_id = '${USER_ID}'::uuid
  AND is_active = false
  AND deactivated_reason = 'plan_downgrade'
ORDER BY deactivated_at DESC;

-- ============================================
-- PASO 8: Re-asignar plan Professional
-- ============================================
UPDATE users
SET
  plan_tier = 'professional',
  plan_end_date = NOW() + INTERVAL '1 year'
WHERE id = '${USER_ID}';

-- ============================================
-- PASO 9: Reactiva propiedades automáticamente
-- ============================================
SELECT reactivate_properties_on_upgrade('${USER_ID}', 20);

-- Deberías ver: 8 (las 8 que se desactivaron)

-- ============================================
-- PASO 10: Verificar estado final
-- ============================================
SELECT COUNT(*) as activas_final
FROM properties
WHERE user_id = '${USER_ID}'::uuid
  AND is_active = true;
-- Debe retornar: 13 (todas activas de nuevo)

-- ============================================
-- PASO 11 (OPCIONAL): Limpiar propiedades de prueba
-- ============================================
DELETE FROM properties
WHERE user_id = '${USER_ID}'::uuid
  AND title LIKE 'Propiedad Test%';
`)

console.log('\n' + '='.repeat(60))
console.log('✅ Copia y pega estos SQL en Supabase SQL Editor')
console.log('📝 Ejecuta paso por paso y verifica los resultados\n')
