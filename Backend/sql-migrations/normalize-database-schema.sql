-- =====================================================
-- 🗄️ NORMALIZACIÓN DE ESQUEMAS DE BASE DE DATOS
-- FASE 3: LIMPIEZA Y ESTRUCTURA
-- =====================================================

-- Este script normaliza los esquemas inconsistentes identificados en la auditoría
-- y establece estándares consistentes para toda la base de datos

-- =====================================================
-- 1. NORMALIZACIÓN DE TABLA USER
-- =====================================================

-- Verificar estructura actual de la tabla User
DO $$
BEGIN
    -- Agregar columna role si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'role'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "role" VARCHAR(20) DEFAULT 'USER';
        RAISE NOTICE 'Columna role agregada a tabla User';
    END IF;
    
    -- Migrar datos de isAdmin a role si la columna existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'isAdmin'
    ) THEN
        -- Migrar datos existentes
        UPDATE "User" SET "role" = 'ADMIN' WHERE "isAdmin" = true;
        UPDATE "User" SET "role" = 'USER' WHERE "isAdmin" = false OR "isAdmin" IS NULL;
        
        -- Eliminar columna obsoleta
        ALTER TABLE "User" DROP COLUMN IF EXISTS "isAdmin";
        RAISE NOTICE 'Datos migrados de isAdmin a role y columna isAdmin eliminada';
    END IF;
END $$;

-- Agregar constraint para valores válidos de role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_role_check' AND table_name = 'User'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT user_role_check 
        CHECK (role IN ('USER', 'ADMIN', 'MODERATOR'));
        RAISE NOTICE 'Constraint user_role_check agregado';
    END IF;
END $$;

-- Normalizar campo user_type si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'user_type'
    ) THEN
        -- Estandarizar valores
        UPDATE "User" SET "user_type" = 'inquilino' WHERE "user_type" IN ('INQUILINO', 'tenant');
        UPDATE "User" SET "user_type" = 'dueno_directo' WHERE "user_type" IN ('DUENO', 'OWNER', 'owner');
        UPDATE "User" SET "user_type" = 'inmobiliaria' WHERE "user_type" IN ('INMOBILIARIA', 'AGENCY', 'agency');
        
        -- Agregar constraint
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'user_type_check' AND table_name = 'User'
        ) THEN
            ALTER TABLE "User" ADD CONSTRAINT user_type_check 
            CHECK (user_type IN ('inquilino', 'dueno_directo', 'inmobiliaria'));
        END IF;
        
        RAISE NOTICE 'Campo user_type normalizado';
    END IF;
END $$;

-- =====================================================
-- 2. NORMALIZACIÓN DE TABLA PROPERTY
-- =====================================================

-- Estandarizar valores de status
UPDATE "Property" SET status = 'AVAILABLE' WHERE status IN ('available', 'ACTIVE', 'active');
UPDATE "Property" SET status = 'UNAVAILABLE' WHERE status IN ('unavailable', 'INACTIVE', 'inactive');
UPDATE "Property" SET status = 'PENDING' WHERE status IN ('pending', 'REVIEW', 'review');
UPDATE "Property" SET status = 'EXPIRED' WHERE status IN ('expired', 'DELETED', 'deleted');

-- Agregar constraint para status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'property_status_check' AND table_name = 'Property'
    ) THEN
        ALTER TABLE "Property" ADD CONSTRAINT property_status_check 
        CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'PENDING', 'EXPIRED'));
        RAISE NOTICE 'Constraint property_status_check agregado';
    END IF;
END $$;

-- Normalizar campo type si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Property' AND column_name = 'type'
    ) THEN
        -- Estandarizar valores de tipo de propiedad
        UPDATE "Property" SET type = 'APARTMENT' WHERE type IN ('apartment', 'depto', 'departamento');
        UPDATE "Property" SET type = 'HOUSE' WHERE type IN ('house', 'casa', 'home');
        UPDATE "Property" SET type = 'ROOM' WHERE type IN ('room', 'habitacion', 'cuarto');
        UPDATE "Property" SET type = 'STUDIO' WHERE type IN ('studio', 'monoambiente', 'loft');
        
        -- Agregar constraint
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'property_type_check' AND table_name = 'Property'
        ) THEN
            ALTER TABLE "Property" ADD CONSTRAINT property_type_check 
            CHECK (type IN ('APARTMENT', 'HOUSE', 'ROOM', 'STUDIO', 'COMMERCIAL', 'OTHER'));
        END IF;
        
        RAISE NOTICE 'Campo type normalizado en Property';
    END IF;
END $$;

-- =====================================================
-- 3. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices críticos para tabla User
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_user_type ON "User"(user_type);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "User"(created_at);

-- Índices críticos para tabla Property
CREATE INDEX IF NOT EXISTS idx_property_status ON "Property"(status);
CREATE INDEX IF NOT EXISTS idx_property_user_id ON "Property"("userId");
CREATE INDEX IF NOT EXISTS idx_property_created_at ON "Property"(created_at);
CREATE INDEX IF NOT EXISTS idx_property_updated_at ON "Property"(updated_at);
CREATE INDEX IF NOT EXISTS idx_property_featured ON "Property"(featured) WHERE featured = true;

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_property_status_user ON "Property"(status, "userId");
CREATE INDEX IF NOT EXISTS idx_property_status_created ON "Property"(status, created_at DESC);

-- Índices para tabla Favorite si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Favorite') THEN
        CREATE INDEX IF NOT EXISTS idx_favorite_user_id ON "Favorite"("userId");
        CREATE INDEX IF NOT EXISTS idx_favorite_property_id ON "Favorite"("propertyId");
        CREATE INDEX IF NOT EXISTS idx_favorite_user_property ON "Favorite"("userId", "propertyId");
        RAISE NOTICE 'Índices creados para tabla Favorite';
    END IF;
END $$;

-- =====================================================
-- 4. FOREIGN KEYS Y CONSTRAINTS
-- =====================================================

-- Verificar y agregar foreign keys faltantes
DO $$
BEGIN
    -- FK Property -> User
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_property_user' AND table_name = 'Property'
    ) THEN
        ALTER TABLE "Property" ADD CONSTRAINT fk_property_user 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key fk_property_user agregado';
    END IF;
    
    -- FK Favorite -> User (si existe)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Favorite') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_favorite_user' AND table_name = 'Favorite'
        ) THEN
            ALTER TABLE "Favorite" ADD CONSTRAINT fk_favorite_user 
            FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
            RAISE NOTICE 'Foreign key fk_favorite_user agregado';
        END IF;
        
        -- FK Favorite -> Property
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_favorite_property' AND table_name = 'Favorite'
        ) THEN
            ALTER TABLE "Favorite" ADD CONSTRAINT fk_favorite_property 
            FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE CASCADE;
            RAISE NOTICE 'Foreign key fk_favorite_property agregado';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5. NORMALIZACIÓN DE TIPOS DE DATOS
-- =====================================================

-- Estandarizar tipos de datos para campos de fecha
DO $$
BEGIN
    -- Verificar y normalizar campos de timestamp
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'created_at' 
        AND data_type != 'timestamp with time zone'
    ) THEN
        ALTER TABLE "User" ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Campo created_at normalizado en User';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Property' AND column_name = 'created_at' 
        AND data_type != 'timestamp with time zone'
    ) THEN
        ALTER TABLE "Property" ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Campo created_at normalizado en Property';
    END IF;
END $$;

-- =====================================================
-- 6. LIMPIEZA DE DATOS INCONSISTENTES
-- =====================================================

-- Limpiar emails duplicados (mantener el más reciente)
WITH duplicates AS (
    SELECT id, email, created_at,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM "User"
    WHERE email IS NOT NULL
)
DELETE FROM "User" 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Limpiar propiedades sin usuario válido
DELETE FROM "Property" 
WHERE "userId" NOT IN (SELECT id FROM "User");

-- Actualizar campos NULL a valores por defecto
UPDATE "User" SET role = 'USER' WHERE role IS NULL;
UPDATE "Property" SET status = 'AVAILABLE' WHERE status IS NULL;
UPDATE "Property" SET featured = false WHERE featured IS NULL;

-- =====================================================
-- 7. FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para validar email
CREATE OR REPLACE FUNCTION validate_email(email_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email_text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar texto
CREATE OR REPLACE FUNCTION clean_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN TRIM(REGEXP_REPLACE(input_text, '\s+', ' ', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpiar datos antes de insertar
CREATE OR REPLACE FUNCTION clean_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Limpiar y validar email
    IF NEW.email IS NOT NULL THEN
        NEW.email = LOWER(TRIM(NEW.email));
        IF NOT validate_email(NEW.email) THEN
            RAISE EXCEPTION 'Email inválido: %', NEW.email;
        END IF;
    END IF;
    
    -- Limpiar nombre
    IF NEW.name IS NOT NULL THEN
        NEW.name = clean_text(NEW.name);
    END IF;
    
    -- Establecer valores por defecto
    IF NEW.role IS NULL THEN
        NEW.role = 'USER';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tabla User
DROP TRIGGER IF EXISTS trigger_clean_user_data ON "User";
CREATE TRIGGER trigger_clean_user_data
    BEFORE INSERT OR UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION clean_user_data();

-- =====================================================
-- 8. ESTADÍSTICAS Y ANÁLISIS
-- =====================================================

-- Función para generar estadísticas de la base de datos
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    size_pretty TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. VERIFICACIONES FINALES
-- =====================================================

-- Verificar integridad referencial
DO $$
DECLARE
    violation_count INTEGER;
BEGIN
    -- Verificar que todas las propiedades tienen usuario válido
    SELECT COUNT(*) INTO violation_count
    FROM "Property" p
    LEFT JOIN "User" u ON p."userId" = u.id
    WHERE u.id IS NULL;
    
    IF violation_count > 0 THEN
        RAISE WARNING 'Se encontraron % propiedades sin usuario válido', violation_count;
    ELSE
        RAISE NOTICE 'Integridad referencial Property->User: OK';
    END IF;
    
    -- Verificar emails únicos
    SELECT COUNT(*) - COUNT(DISTINCT email) INTO violation_count
    FROM "User" WHERE email IS NOT NULL;
    
    IF violation_count > 0 THEN
        RAISE WARNING 'Se encontraron % emails duplicados', violation_count;
    ELSE
        RAISE NOTICE 'Unicidad de emails: OK';
    END IF;
END $$;

-- Mostrar estadísticas finales
SELECT 
    'User' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'USER' THEN 1 END) as users
FROM "User"
UNION ALL
SELECT 
    'Property' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as disponibles,
    COUNT(CASE WHEN featured = true THEN 1 END) as destacadas
FROM "Property";

-- =====================================================
-- 10. NOTAS FINALES
-- =====================================================

/*
RESUMEN DE CAMBIOS APLICADOS:

1. ✅ Normalización de tabla User:
   - Migración de isAdmin a role
   - Estandarización de user_type
   - Constraints de validación

2. ✅ Normalización de tabla Property:
   - Estandarización de status
   - Normalización de type
   - Constraints de validación

3. ✅ Índices optimizados:
   - Índices simples para consultas frecuentes
   - Índices compuestos para consultas complejas
   - Índices condicionales para campos booleanos

4. ✅ Foreign Keys y Constraints:
   - Integridad referencial
   - Validaciones de datos
   - Cascadas de eliminación

5. ✅ Limpieza de datos:
   - Eliminación de duplicados
   - Normalización de valores
   - Valores por defecto

6. ✅ Funciones de utilidad:
   - Validación de email
   - Limpieza de texto
   - Triggers automáticos

7. ✅ Verificaciones:
   - Integridad referencial
   - Consistencia de datos
   - Estadísticas finales

PRÓXIMOS PASOS:
- Ejecutar tests de validación
- Verificar rendimiento de consultas
- Actualizar código de aplicación si es necesario
- Documentar cambios realizados
*/

COMMIT;
