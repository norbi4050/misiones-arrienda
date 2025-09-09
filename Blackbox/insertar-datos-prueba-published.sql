-- BLACKBOX - INSERTAR DATOS DE PRUEBA CON STATUS 'PUBLISHED'
-- Ejecutar en Supabase SQL Editor

-- Insertar 2 propiedades de prueba con status PUBLISHED
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
  country,
  images,
  amenities,
  "contact_name",
  "contact_phone",
  "contact_email",
  status,
  "createdAt",
  "updatedAt"
) VALUES
(
  'test-prop-1',
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
  'Argentina',
  '["/placeholder-house-1.jpg", "/placeholder-house-2.jpg"]',
  '["garage", "garden", "pool"]',
  'María González',
  '+54 376 4123456',
  'maria.gonzalez@example.com',
  'PUBLISHED',
  NOW(),
  NOW()
),
(
  'test-prop-2',
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
  'Argentina',
  '["/placeholder-apartment-1.jpg", "/placeholder-apartment-2.jpg"]',
  '["pool", "gym", "parking"]',
  'Carlos Rodríguez',
  '+54 3757 4987654',
  'carlos.rodriguez@example.com',
  'PUBLISHED',
  NOW(),
  NOW()
);

-- Verificar que los datos se insertaron correctamente
SELECT
  id,
  title,
  city,
  "propertyType",
  price,
  currency,
  status,
  "createdAt"
FROM "Property"
WHERE status = 'PUBLISHED'
ORDER BY "createdAt" DESC;

-- Contar total de propiedades publicadas
SELECT
  COUNT(*) as total_published_properties,
  status
FROM "Property"
WHERE status = 'PUBLISHED'
GROUP BY status;
