-- BLACKBOX - SEMILLA MÍNIMA PARA PROPERTIES API
-- Ejecutar en Supabase SQL Editor

-- Insertar 2 filas válidas en "Property" con status PUBLISHED
INSERT INTO "Property" (
  id, title, description, price,
  bedrooms, bathrooms, area,
  address, city, province, "postalCode",
  "propertyType", status,
  images, amenities, features,
  "updatedAt", "userId", "agentId"
) VALUES
(
  'published-prop-001',
  'Casa Moderna en Posadas Centro',
  'Hermosa casa moderna de 3 dormitorios en el corazón de Posadas.',
  250000,
  3, 2, 180,
  'Av. Mitre 1234', 'Posadas', 'Misiones', '3300',
  'HOUSE', 'PUBLISHED',
  '["/placeholder-house-1.jpg","/placeholder-house-2.jpg"]',
  '["garage","garden"]',
  '["security","balcony"]',
  NOW(), 'seed-user', 'seed-agent'
),
(
  'published-prop-002',
  'Departamento Premium en Puerto Iguazú',
  'Moderno departamento de 2 dormitorios con vista.',
  180000,
  2, 1, 95,
  'Av. Victoria Aguirre 567', 'Puerto Iguazú', 'Misiones', '3370',
  'APARTMENT', 'PUBLISHED',
  '["/placeholder-apartment-1.jpg","/placeholder-apartment-2.jpg"]',
  '["pool","gym","parking"]',
  '["elevator","concierge"]',
  NOW(), 'seed-user', 'seed-agent'
);

-- Verificar que entraron
SELECT id, title, status, "updatedAt"
FROM "Property"
ORDER BY "updatedAt" DESC
LIMIT 5;
