-- =====================================================
-- NORMALIZACIÓN DE ESQUEMA DE BASE DE DATOS
-- FASE 3: LIMPIEZA Y ESTRUCTURA
-- =====================================================

-- 1. LIMPIEZA DE DATOS DE PRUEBA Y TEMPORALES
-- =====================================================

-- Eliminar usuarios de prueba (identificados por patrones comunes)
DELETE FROM "User" 
WHERE 
  email LIKE '%test%' 
  OR email LIKE '%prueba%'
  OR email LIKE '%demo%'
  OR email LIKE '%example%'
  OR name LIKE '%Test%'
  OR name LIKE '%Prueba%'
  OR name LIKE '%Demo%';

-- Eliminar propiedades de prueba
DELETE FROM "Property" 
WHERE 
  title LIKE '%Test%'
  OR title LIKE '%Prueba%'
  OR title LIKE '%Demo%'
  OR title LIKE '%Ejemplo%'
  OR description LIKE '%test%'
  OR description LIKE '%prueba%';

-- Eliminar favoritos huérfanos (sin usuario o propiedad válida)
DELETE FROM "Favorite" 
WHERE 
  "userId" NOT IN (SELECT id FROM "User")
  OR "propertyId" NOT IN (SELECT id FROM "Property");

-- Eliminar mensajes huérfanos
DELETE FROM "Message" 
WHERE 
  "senderId" NOT IN (SELECT id FROM "User")
  OR "receiverId" NOT IN (SELECT id FROM "User");

-- 2. NORMALIZACIÓN DE NOMBRES DE CAMPOS
-- =====================================================

-- Estandarizar nombres de campos en tabla User
-- (Algunos campos pueden tener nombres inconsistentes)

-- Verificar y corregir campos de User si es necesario
DO $$
BEGIN
  -- Verificar si existe campo userType vs user_type
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'User' AND column_name = 'user_type') THEN
    -- Migrar datos si existe user_type pero no userType
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'userType') THEN
      ALTER TABLE "User" RENAME COLUMN user_type TO "userType";
    END IF;
  END IF;
  
  -- Verificar campos de fecha
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'User' AND column_name = 'created_at') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'createdAt') THEN
      ALTER TABLE "User" RENAME COLUMN created_at TO "createdAt";
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'User' AND column_name = 'updated_at') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'updatedAt') THEN
      ALTER TABLE "User" RENAME COLUMN updated_at TO "updatedAt";
    END IF;
  END IF;
END $$;

-- 3. NORMALIZACIÓN DE TIPOS DE DATOS
-- =====================================================

-- Asegurar que los campos de precio sean consistentes
ALTER TABLE "Property" 
ALTER COLUMN price TYPE DECIMAL(12,2);

-- Asegurar que los campos de área sean consistentes
ALTER TABLE "Property" 
ALTER COLUMN area TYPE DECIMAL(8,2);

-- Normalizar campos de texto
UPDATE "Property" 
SET title = TRIM(title),
    description = TRIM(description),
    address = TRIM(address)
WHERE title IS NOT NULL OR description IS NOT NULL OR address IS NOT NULL;

UPDATE "User" 
SET name = TRIM(name),
    email = LOWER(TRIM(email))
WHERE name IS NOT NULL OR email IS NOT NULL;

-- 4. ELIMINACIÓN DE TABLAS OBSOLETAS
-- =====================================================

-- Eliminar tablas de prueba si existen
DROP TABLE IF EXISTS "TestTable";
DROP TABLE IF EXISTS "TempData";
DROP TABLE IF EXISTS "ProfileViews"; -- Si es temporal
DROP TABLE IF EXISTS "UserStats"; -- Si es temporal y se calcula dinámicamente

-- Eliminar vistas obsoletas
DROP VIEW IF EXISTS "PropertyWithUser";
DROP VIEW IF EXISTS "UserWithStats";

-- 5. CREACIÓN DE ÍNDICES OPTIMIZADOS
-- =====================================================

-- Índices para búsquedas frecuentes en Property
CREATE INDEX IF NOT EXISTS idx_property_status ON "Property"(status);
CREATE INDEX IF NOT EXISTS idx_property_type ON "Property"(type);
CREATE INDEX IF NOT EXISTS idx_property_price ON "Property"(price);
CREATE INDEX IF NOT EXISTS idx_property_area ON "Property"(area);
CREATE INDEX IF NOT EXISTS idx_property_location ON "Property"(city, neighborhood);
CREATE INDEX IF NOT EXISTS idx_property_featured ON "Property"(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_property_user ON "Property"("userId");
CREATE INDEX IF NOT EXISTS idx_property_created ON "Property"("createdAt");

-- Índices para User
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_type ON "User"("userType");
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_created ON "User"("createdAt");

-- Índices para Favorite
CREATE INDEX IF NOT EXISTS idx_favorite_user ON "Favorite"("userId");
CREATE INDEX IF NOT EXISTS idx_favorite_property ON "Favorite"("propertyId");
CREATE INDEX IF NOT EXISTS idx_favorite_composite ON "Favorite"("userId", "propertyId");

-- Índices para Message
CREATE INDEX IF NOT EXISTS idx_message_sender ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS idx_message_receiver ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS idx_message_property ON "Message"("propertyId");
CREATE INDEX IF NOT EXISTS idx_message_created ON "Message"("createdAt");

-- 6. CONSTRAINTS Y VALIDACIONES
-- =====================================================

-- Asegurar que los emails sean únicos
ALTER TABLE "User" 
ADD CONSTRAINT unique_user_email UNIQUE (email);

-- Asegurar que no haya favoritos duplicados
ALTER TABLE "Favorite" 
ADD CONSTRAINT unique_user_property_favorite UNIQUE ("userId", "propertyId");

-- Validaciones de datos
ALTER TABLE "Property" 
ADD CONSTRAINT check_property_price_positive CHECK (price > 0);

ALTER TABLE "Property" 
ADD CONSTRAINT check_property_area_positive CHECK (area > 0);

-- 7. FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para limpiar datos regularmente
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Limpiar favoritos huérfanos
  DELETE FROM "Favorite" 
  WHERE "userId" NOT IN (SELECT id FROM "User")
     OR "propertyId" NOT IN (SELECT id FROM "Property");
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Limpiar mensajes huérfanos
  DELETE FROM "Message" 
  WHERE "senderId" NOT IN (SELECT id FROM "User")
     OR "receiverId" NOT IN (SELECT id FROM "User");
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Limpiar propiedades sin usuario
  DELETE FROM "Property" 
  WHERE "userId" NOT IN (SELECT id FROM "User");
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$;

-- Función para estadísticas de usuario (reemplaza tabla temporal)
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'propertiesCount', (
      SELECT COUNT(*) FROM "Property" 
      WHERE "userId" = user_id
    ),
    'favoritesCount', (
      SELECT COUNT(*) FROM "Favorite" 
      WHERE "userId" = user_id
    ),
    'messagesReceived', (
      SELECT COUNT(*) FROM "Message" 
      WHERE "receiverId" = user_id
    ),
    'messagesSent', (
      SELECT COUNT(*) FROM "Message" 
      WHERE "senderId" = user_id
    ),
    'joinedAt', (
      SELECT "createdAt" FROM "User" 
      WHERE id = user_id
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- 8. TRIGGERS PARA MANTENIMIENTO AUTOMÁTICO
-- =====================================================

-- Trigger para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Aplicar trigger a tablas principales
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_updated_at ON "Property";
CREATE TRIGGER update_property_updated_at
  BEFORE UPDATE ON "Property"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. VISTAS OPTIMIZADAS
-- =====================================================

-- Vista para propiedades con información del usuario
CREATE OR REPLACE VIEW property_with_owner AS
SELECT 
  p.*,
  u.name as owner_name,
  u.email as owner_email,
  u."userType" as owner_type
FROM "Property" p
JOIN "User" u ON p."userId" = u.id
WHERE p.status = 'AVAILABLE';

-- Vista para estadísticas del sistema
CREATE OR REPLACE VIEW system_stats AS
SELECT 
  'users' as metric,
  COUNT(*) as value,
  'total' as category
FROM "User"
UNION ALL
SELECT 
  'properties' as metric,
  COUNT(*) as value,
  'total' as category
FROM "Property"
UNION ALL
SELECT 
  'active_properties' as metric,
  COUNT(*) as value,
  'status' as category
FROM "Property"
WHERE status = 'AVAILABLE'
UNION ALL
SELECT 
  'favorites' as metric,
  COUNT(*) as value,
  'total' as category
FROM "Favorite";

-- 10. VERIFICACIÓN Y REPORTE
-- =====================================================

-- Verificar integridad referencial
DO $$
DECLARE
  orphaned_favorites INTEGER;
  orphaned_messages INTEGER;
  orphaned_properties INTEGER;
BEGIN
  -- Contar registros huérfanos
  SELECT COUNT(*) INTO orphaned_favorites
  FROM "Favorite" f
  WHERE f."userId" NOT IN (SELECT id FROM "User")
     OR f."propertyId" NOT IN (SELECT id FROM "Property");
  
  SELECT COUNT(*) INTO orphaned_messages
  FROM "Message" m
  WHERE m."senderId" NOT IN (SELECT id FROM "User")
     OR m."receiverId" NOT IN (SELECT id FROM "User");
  
  SELECT COUNT(*) INTO orphaned_properties
  FROM "Property" p
  WHERE p."userId" NOT IN (SELECT id FROM "User");
  
  -- Reportar resultados
  RAISE NOTICE 'Normalización completada:';
  RAISE NOTICE '- Favoritos huérfanos: %', orphaned_favorites;
  RAISE NOTICE '- Mensajes huérfanos: %', orphaned_messages;
  RAISE NOTICE '- Propiedades huérfanas: %', orphaned_properties;
END $$;

-- Estadísticas finales
SELECT 
  'Usuarios' as tabla,
  COUNT(*) as registros
FROM "User"
UNION ALL
SELECT 
  'Propiedades' as tabla,
  COUNT(*) as registros
FROM "Property"
UNION ALL
SELECT 
  'Favoritos' as tabla,
  COUNT(*) as registros
FROM "Favorite"
UNION ALL
SELECT 
  'Mensajes' as tabla,
  COUNT(*) as registros
FROM "Message";

-- Comentarios de documentación
COMMENT ON FUNCTION cleanup_orphaned_data IS 'Limpia datos huérfanos regularmente';
COMMENT ON FUNCTION get_user_stats IS 'Obtiene estadísticas de usuario dinámicamente';
COMMENT ON VIEW property_with_owner IS 'Vista optimizada de propiedades con datos del propietario';
COMMENT ON VIEW system_stats IS 'Estadísticas generales del sistema';

-- Finalización
SELECT 'Normalización de base de datos completada exitosamente' as resultado;
