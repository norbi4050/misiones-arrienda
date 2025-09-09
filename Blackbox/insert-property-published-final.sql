-- BLACKBOX - INSERT FINAL PARA TABLA "Property" CON TODAS LAS COLUMNAS
-- Ejecutar en Supabase SQL Editor

-- Insertar propiedad PUBLISHED con todos los campos requeridos
INSERT INTO "Property" (
  id,
  title,
  description,
  price,
  currency,
  "propertyType",
  bedrooms,
  bathrooms,
  area,
  address,
  city,
  province,
  "postalCode",
  images,
  amenities,
  features,
  status,
  "createdAt",
  "updatedAt",
  "userId",
  "agentId"
) VALUES (
  'published-prop-001',
  'Casa Moderna en Posadas Centro',
  'Hermosa casa moderna de 3 dormitorios en el corazón de Posadas. Excelente ubicación cerca de comercios y transporte público.',
  250000,
  'ARS',
  'HOUSE',
  3,
  2,
  180,
  'Av. Mitre 1234',
  'Posadas',
  'Misiones',
  '3300',
  '["/placeholder-house-1.jpg", "/placeholder-house-2.jpg"]',
  '["garage", "garden", "pool"]',
  '["security", "balcony"]',
  'PUBLISHED',
  NOW(),
  NOW(),
  NULL,
  NULL
);

-- Insertar segunda propiedad PUBLISHED
INSERT INTO "Property" (
  id,
  title,
  description,
  price,
  currency,
  "propertyType",
  bedrooms,
  bathrooms,
  area,
  address,
  city,
  province,
  "postalCode",
  images,
  amenities,
  features,
  status,
  "createdAt",
  "updatedAt",
  "userId",
  "agentId"
) VALUES (
  'published-prop-002',
  'Departamento Premium en Puerto Iguazú',
  'Moderno departamento de 2 dormitorios con vista panorámica a las Cataratas. Equipado con amenities de primera calidad.',
  180000,
  'ARS',
  'APARTMENT',
  2,
  1,
  95,
  'Av. Victoria Aguirre 567',
  'Puerto Iguazú',
  'Misiones',
  '3370',
  '["/placeholder-apartment-1.jpg", "/placeholder-apartment-2.jpg"]',
  '["pool", "gym", "parking"]',
  '["elevator", "concierge"]',
  'PUBLISHED',
  NOW(),
  NOW(),
  NULL,
  NULL
);

-- Verificar inserción exitosa
SELECT
  id,
  title,
  city,
  "propertyType",
  price,
  currency,
  "updatedAt"
FROM "Property"
WHERE id IN ('published-prop-001', 'published-prop-002')
ORDER BY "updatedAt" DESC;

-- Contar total de propiedades publicadas
SELECT
  COUNT(*) as total_published_properties
FROM "Property"
WHERE status = 'PUBLISHED';
