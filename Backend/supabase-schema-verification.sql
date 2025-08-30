-- Verificación y creación de schema para Misiones Arrienda
-- Proyecto Supabase: qfeyhaaxyemmnohqdele

-- 1. Verificar si existe la tabla Property
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Property'
);

-- 2. Crear tabla Property si no existe
CREATE TABLE IF NOT EXISTS "Property" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    "propertyType" VARCHAR(50),
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    garages INTEGER DEFAULT 0,
    area DECIMAL(10,2) NOT NULL,
    "lotArea" DECIMAL(10,2),
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT 'Misiones',
    country VARCHAR(100) DEFAULT 'Argentina',
    "postalCode" VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    contact_phone VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    images JSONB DEFAULT '[]'::jsonb,
    "virtualTourUrl" VARCHAR(500),
    amenities JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    "yearBuilt" INTEGER,
    floor INTEGER,
    "totalFloors" INTEGER,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    featured BOOLEAN DEFAULT false,
    "oldPrice" DECIMAL(12,2),
    deposit DECIMAL(12,2),
    "userId" UUID,
    "agentId" UUID,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "highlightedUntil" TIMESTAMP WITH TIME ZONE,
    "isPaid" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_property_city ON "Property"(city);
CREATE INDEX IF NOT EXISTS idx_property_type ON "Property"("propertyType");
CREATE INDEX IF NOT EXISTS idx_property_price ON "Property"(price);
CREATE INDEX IF NOT EXISTS idx_property_status ON "Property"(status);
CREATE INDEX IF NOT EXISTS idx_property_created ON "Property"("createdAt");

-- 4. Crear trigger para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_updated_at 
    BEFORE UPDATE ON "Property" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Configurar Row Level Security (RLS)
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "Properties are viewable by everyone" ON "Property"
    FOR SELECT USING (true);

-- Política para inserción (usuarios autenticados)
CREATE POLICY "Users can insert their own properties" ON "Property"
    FOR INSERT WITH CHECK (auth.uid() = "userId" OR "userId" IS NULL);

-- Política para actualización (solo propietarios)
CREATE POLICY "Users can update their own properties" ON "Property"
    FOR UPDATE USING (auth.uid() = "userId");

-- 6. Insertar datos de prueba para testing
INSERT INTO "Property" (
    title, description, price, currency, "propertyType", 
    bedrooms, bathrooms, area, address, city, contact_phone,
    amenities, features, status
) VALUES 
(
    'Casa de Prueba - Testing Supabase',
    'Esta es una propiedad de prueba para verificar la conexión con Supabase y el funcionamiento del formulario de publicar.',
    150000,
    'ARS',
    'HOUSE',
    3,
    2,
    120.5,
    'Av. Testing 123',
    'Posadas',
    '+54 376 123456',
    '["Piscina", "Jardín", "Garage"]'::jsonb,
    '["Aire acondicionado", "Calefacción"]'::jsonb,
    'AVAILABLE'
) ON CONFLICT DO NOTHING;

-- 7. Verificar que los datos se insertaron correctamente
SELECT 
    id, title, price, city, contact_phone, "createdAt"
FROM "Property" 
WHERE title LIKE '%Testing Supabase%'
LIMIT 5;
