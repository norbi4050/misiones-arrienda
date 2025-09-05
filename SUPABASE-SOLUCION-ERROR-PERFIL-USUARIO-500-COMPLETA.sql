-- =====================================================================================
-- SOLUCION COMPLETA ERROR 500 ENDPOINT /api/users/profile
-- =====================================================================================
-- Problema: Error 500 en PUT /api/users/profile con status 400 en Supabase
-- Usuario afectado: 6403f9d2-e846-4c70-87e0-e051127d9500
-- Causa: Desalineación entre modelo Prisma y estructura real tabla users
-- =====================================================================================

-- PASO 1: DIAGNOSTICO DE LA TABLA USERS ACTUAL
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== DIAGNOSTICO TABLA USERS ===';
    RAISE NOTICE 'Verificando estructura actual de la tabla users...';
END $$;

-- Verificar si la tabla users existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- Verificar columnas actuales de la tabla users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 2: CREAR/ACTUALIZAR TABLA USERS CON ESTRUCTURA COMPLETA
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== CREANDO/ACTUALIZANDO TABLA USERS ===';
    
    -- Crear tabla users si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Creando tabla users...';
        
        CREATE TABLE public.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password TEXT,
            avatar TEXT,
            bio TEXT,
            occupation TEXT,
            age INTEGER,
            verified BOOLEAN DEFAULT false,
            email_verified BOOLEAN DEFAULT false,
            verification_token TEXT,
            rating REAL DEFAULT 0,
            review_count INTEGER DEFAULT 0,
            
            -- Campos específicos para tipos de usuario
            user_type TEXT, -- inquilino, dueno_directo, inmobiliaria
            company_name TEXT, -- Solo para inmobiliarias
            license_number TEXT, -- Solo para inmobiliarias
            property_count TEXT, -- Solo para dueños directos
            
            -- Campos para perfil de inquilino (mapeo del endpoint)
            location TEXT,
            search_type TEXT,
            budget_range TEXT,
            profile_image TEXT,
            preferred_areas TEXT,
            family_size INTEGER,
            pet_friendly BOOLEAN,
            move_in_date DATE,
            employment_status TEXT,
            monthly_income NUMERIC,
            
            -- Timestamps
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabla users creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla users ya existe, verificando campos faltantes...';
    END IF;
END $$;

-- PASO 3: AGREGAR CAMPOS FALTANTES SI NO EXISTEN
-- =====================================================================================
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== AGREGANDO CAMPOS FALTANTES ===';
    
    -- Verificar y agregar campo location
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN location TEXT;
        RAISE NOTICE 'Campo location agregado';
    END IF;
    
    -- Verificar y agregar campo search_type
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'search_type' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN search_type TEXT;
        RAISE NOTICE 'Campo search_type agregado';
    END IF;
    
    -- Verificar y agregar campo budget_range
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'budget_range' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN budget_range TEXT;
        RAISE NOTICE 'Campo budget_range agregado';
    END IF;
    
    -- Verificar y agregar campo profile_image
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_image' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN profile_image TEXT;
        RAISE NOTICE 'Campo profile_image agregado';
    END IF;
    
    -- Verificar y agregar campo preferred_areas
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferred_areas' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN preferred_areas TEXT;
        RAISE NOTICE 'Campo preferred_areas agregado';
    END IF;
    
    -- Verificar y agregar campo family_size
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'family_size' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN family_size INTEGER;
        RAISE NOTICE 'Campo family_size agregado';
    END IF;
    
    -- Verificar y agregar campo pet_friendly
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'pet_friendly' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN pet_friendly BOOLEAN;
        RAISE NOTICE 'Campo pet_friendly agregado';
    END IF;
    
    -- Verificar y agregar campo move_in_date
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'move_in_date' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN move_in_date DATE;
        RAISE NOTICE 'Campo move_in_date agregado';
    END IF;
    
    -- Verificar y agregar campo employment_status
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'employment_status' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN employment_status TEXT;
        RAISE NOTICE 'Campo employment_status agregado';
    END IF;
    
    -- Verificar y agregar campo monthly_income
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'monthly_income' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN monthly_income NUMERIC;
        RAISE NOTICE 'Campo monthly_income agregado';
    END IF;
    
    -- Verificar y agregar campo user_type
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'user_type' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN user_type TEXT;
        RAISE NOTICE 'Campo user_type agregado';
    END IF;
    
    -- Verificar y agregar campo updated_at si no existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Campo updated_at agregado';
    END IF;
    
END $$;

-- PASO 4: CREAR TRIGGER PARA ACTUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== CREANDO TRIGGER PARA updated_at ===';
    
    -- Crear función para actualizar updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    -- Eliminar trigger si existe
    DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
    
    -- Crear trigger
    CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
    RAISE NOTICE 'Trigger para updated_at creado exitosamente';
END $$;

-- PASO 5: CONFIGURAR POLITICAS RLS PARA TABLA USERS
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== CONFIGURANDO POLITICAS RLS ===';
    
    -- Habilitar RLS en la tabla users
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Eliminar políticas existentes si existen
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
    
    -- Política para SELECT (leer perfil propio)
    CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
    
    -- Política para UPDATE (actualizar perfil propio)
    CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);
    
    -- Política para INSERT (crear perfil propio)
    CREATE POLICY "Users can insert own profile" ON public.users
        FOR INSERT WITH CHECK (auth.uid() = id);
    
    RAISE NOTICE 'Políticas RLS configuradas exitosamente';
END $$;

-- PASO 6: VERIFICAR USUARIO ESPECIFICO DEL ERROR
-- =====================================================================================
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID := '6403f9d2-e846-4c70-87e0-e051127d9500';
BEGIN
    RAISE NOTICE '=== VERIFICANDO USUARIO ESPECIFICO ===';
    RAISE NOTICE 'Verificando usuario: %', user_id;
    
    -- Verificar si el usuario existe
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE id = user_id
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Usuario encontrado en la tabla users';
        
        -- Mostrar información del usuario
        PERFORM (
            SELECT RAISE(NOTICE, 'Usuario: % - Email: % - Creado: %', name, email, created_at)
            FROM public.users 
            WHERE id = user_id
        );
    ELSE
        RAISE NOTICE 'Usuario NO encontrado en la tabla users';
        RAISE NOTICE 'Esto podría ser la causa del error 500';
        
        -- Verificar si existe en auth.users
        IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
            RAISE NOTICE 'Usuario existe en auth.users pero no en public.users';
            RAISE NOTICE 'Se necesita crear el registro en public.users';
        ELSE
            RAISE NOTICE 'Usuario no existe en auth.users tampoco';
        END IF;
    END IF;
END $$;

-- PASO 7: CREAR FUNCION PARA SINCRONIZAR AUTH.USERS CON PUBLIC.USERS
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASO 8: VERIFICACION FINAL
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICACION FINAL ===';
    RAISE NOTICE 'Estructura de tabla users actualizada';
    RAISE NOTICE 'Políticas RLS configuradas';
    RAISE NOTICE 'Triggers creados';
    RAISE NOTICE 'Función de sincronización creada';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUCION COMPLETADA - El endpoint /api/users/profile debería funcionar ahora';
    RAISE NOTICE '';
    RAISE NOTICE 'PROXIMOS PASOS:';
    RAISE NOTICE '1. Probar el endpoint PUT /api/users/profile';
    RAISE NOTICE '2. Verificar que no hay más errores 500';
    RAISE NOTICE '3. Confirmar que los datos se actualizan correctamente';
END $$;

-- CONSULTA FINAL PARA VERIFICAR LA ESTRUCTURA
SELECT 
    'ESTRUCTURA FINAL TABLA USERS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
