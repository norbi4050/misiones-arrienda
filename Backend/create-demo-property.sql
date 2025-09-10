-- Script para crear propiedad demo PUBLISHED + activa
-- Ejecutar en Supabase SQL Editor

-- Paso 1: Crear usuario demo (si no existe)
INSERT INTO public."User" (
  id, name, email, phone, password, "userType", verified, "emailVerified", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(), 
  'Usuario Demo', 
  'demo@misiones-arrienda.com', 
  '+54 376 123-4567', 
  'demo123', 
  'dueno_directo', 
  true, 
  true, 
  now(), 
  now()
) ON CONFLICT (email) DO NOTHING;

-- Paso 2: Crear propiedad demo PUBLISHED + activa
-- Usar el ID del usuario demo creado arriba
INSERT INTO public."Property" (
  id,
  title,
  description,
  price,
  bedrooms,
  bathrooms,
  garages,
  area,
  "lotArea",
  address,
  city,
  province,
  "postalCode",
  latitude,
  longitude,
  "propertyType",
  status,
  images,
  "virtualTourUrl",
  amenities,
  features,
  "yearBuilt",
  floor,
  "totalFloors",
  featured,
  "isPaid",
  "userId",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Casa demo Posadas Centro',
  'Hermosa casa en el centro de Posadas, ideal para familias. Propiedad demo para pruebas de sistema.',
  120000,
  3,
  2,
  1,
  150.5,
  300.0,
  'Av. Mitre 1234',
  'Posadas',
  'Misiones',
  '3300',
  -27.3676,
  -55.8961,
  'HOUSE',
  'PUBLISHED',  -- ✅ Status PUBLISHED
  '[]',         -- ✅ Array vacío para forzar fallback
  null,
  '["piscina", "jardin", "cochera", "parrilla"]',
  '["aire_acondicionado", "calefaccion", "alarma"]',
  2018,
  null,
  1,
  false,
  null,
  null,
  false,
  (SELECT id FROM public."User" WHERE email = 'demo@misiones-arrienda.com' LIMIT 1),
  now(),
  now()
);

-- Paso 3: Verificar que se creó correctamente
SELECT 
  id,
  title,
  status,
  price,
  images,
  city,
  "createdAt"
FROM public."Property" 
WHERE title = 'Casa demo Posadas Centro'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Mostrar el ID para usar en los tests
SELECT 
  'Propiedad creada con ID: ' || id as mensaje,
  'Comando de test: node Backend/test-detail-seo-fallback.mjs --id=' || id as comando_test
FROM public."Property" 
WHERE title = 'Casa demo Posadas Centro'
ORDER BY "createdAt" DESC
LIMIT 1;
