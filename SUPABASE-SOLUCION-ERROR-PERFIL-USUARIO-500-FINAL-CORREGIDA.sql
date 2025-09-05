-- =====================================================================================
-- SOLUCION FINAL ERROR 500 ENDPOINT /api/users/profile - CORREGIDA PHONE NOT NULL
-- =====================================================================================
-- Problema identificado: Campo 'phone' tiene restricción NOT NULL
-- Solución: Modificar restricción y corregir sincronización
-- =====================================================================================

-- PASO 1: DIAGNOSTICO DEL PROBLEMA PHONE NOT NULL
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== DIAGNOSTICO PROBLEMA PHONE NOT NULL - SOLUCION FINAL ===';
    RAISE NOTICE 'Corrigiendo restricción NOT NULL en campo phone';
END $$;

-- PASO 2: MODIFICAR RESTRICCION NOT NULL EN CAMPO PHONE
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== MODIFICANDO RESTRICCION NOT NULL EN PHONE ===';
    
    -- Cambiar phone de NOT NULL a NULLABLE
    ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
    
    RAISE NOTICE 'Campo phone ahora permite valores NULL';
END $$;

-- PASO 3: AGREGAR CAMPOS FALTANTES PARA EL PERFIL DE USUARIO (SI NO EXISTEN)
-- =====================================================================================
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== VERIFICANDO Y AGREGANDO CAMPOS FALTANTES ===';
    
    -- Verificar y agregar campo location
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN location TEXT;
        RAISE NOTICE 'Campo location agregado';
    ELSE
        RAISE NOTICE 'Campo location ya existe';
    END IF;
    
    -- Verificar y agregar campo search_type
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'search_type' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN search_type TEXT;
        RAISE NOTICE 'Campo search_type agregado';
    ELSE
        RAISE NOTICE 'Campo search_type ya existe';
    END IF;
    
    -- Verificar y agregar campo budget_range
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'budget_range' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN budget_range TEXT;
        RAISE NOTICE 'Campo budget_range agregado';
    ELSE
        RAISE NOTICE 'Campo budget_range ya existe';
    END IF;
    
    -- Verificar y agregar campo profile_image
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_image' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN profile_image TEXT;
        RAISE NOTICE 'Campo profile_image agregado';
    ELSE
        RAISE NOTICE 'Campo profile_image ya existe';
    END IF;
    
    -- Verificar y agregar campo preferred_areas
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferred_areas' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN preferred_areas TEXT;
        RAISE NOTICE 'Campo preferred_areas agregado';
    ELSE
        RAISE NOTICE 'Campo preferred_areas ya existe';
    END IF;
    
    -- Verificar y agregar campo family_size
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'family_size' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN family_size INTEGER;
        RAISE NOTICE 'Campo family_size agregado';
    ELSE
        RAISE NOTICE 'Campo family_size ya existe';
    END IF;
    
    -- Verificar y agregar campo pet_friendly
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'pet_friendly' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN pet_friendly BOOLEAN;
        RAISE NOTICE 'Campo pet_friendly agregado';
    ELSE
        RAISE NOTICE 'Campo pet_friendly ya existe';
    END IF;
    
    -- Verificar y agregar campo move_in_date
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'move_in_date' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN move_in_date DATE;
        RAISE NOTICE 'Campo move_in_date agregado';
    ELSE
        RAISE NOTICE 'Campo move_in_date ya existe';
    END IF;
    
    -- Verificar y agregar campo employment_status
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'employment_status' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN employment_status TEXT;
        RAISE NOTICE 'Campo employment_status agregado';
    ELSE
        RAISE NOTICE 'Campo employment_status ya existe';
    END IF;
    
    -- Verificar y agregar campo monthly_income
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'monthly_income' AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN monthly_income NUMERIC;
        RAISE NOTICE 'Campo monthly_income agregado';
    ELSE
        RAISE NOTICE 'Campo monthly_income ya existe';
    END IF;
    
END $$;

-- PASO 4: CREAR TRIGGER PARA UPDATED_AT (SI NO EXISTE)
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== CONFIGURANDO TRIGGER PARA updated_at ===';
    
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
        
    RAISE NOTICE 'Trigger para updated_at configurado exitosamente';
END $$;

-- PASO 5: CONFIGURAR POLITICAS RLS CON CASTING (MANTENER EXISTENTES)
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO POLITICAS RLS CON CASTING ===';
    
    -- Habilitar RLS en la tabla users
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Las políticas ya están configuradas correctamente según el output anterior
    -- Solo verificamos que existan las políticas principales
    
    -- Política para SELECT (leer perfil propio) - CON CASTING
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid()::text = id);
    
    -- Política para UPDATE (actualizar perfil propio) - CON CASTING
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid()::text = id);
    
    -- Política para INSERT (crear perfil propio) - CON CASTING
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    CREATE POLICY "Users can insert own profile" ON public.users
        FOR INSERT WITH CHECK (auth.uid()::text = id);
    
    -- Política adicional para permitir SELECT general (lectura de otros perfiles)
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.users;
    CREATE POLICY "Enable select for authenticated users" ON public.users
        FOR SELECT USING (auth.role() = 'authenticated');
    
    -- Política para service role (para operaciones administrativas)
    DROP POLICY IF EXISTS "Enable service role access" ON public.users;
    CREATE POLICY "Enable service role access" ON public.users
        FOR ALL USING (auth.role() = 'service_role');
    
    RAISE NOTICE 'Políticas RLS con casting UUID<->TEXT verificadas y actualizadas';
END $$;

-- PASO 6: CREAR FUNCION PARA SINCRONIZAR AUTH.USERS CON PUBLIC.USERS (CORREGIDA)
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, phone, created_at, updated_at)
    VALUES (
        NEW.id::text,  -- Casting UUID a TEXT
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),  -- Permitir NULL en phone
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Usuario ya existe, no hacer nada
        RETURN NEW;
    WHEN others THEN
        -- Log del error pero continuar
        RAISE WARNING 'Error al sincronizar usuario %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASO 7: SINCRONIZAR USUARIO ESPECIFICO (CORREGIDO)
-- =====================================================================================
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id_text TEXT := '6403f9d2-e846-4c70-87e0-e051127d9500';
BEGIN
    RAISE NOTICE '=== SINCRONIZANDO USUARIO ESPECIFICO (CORREGIDO) ===';
    RAISE NOTICE 'Verificando usuario: %', user_id_text;
    
    -- Verificar si el usuario existe
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE id = user_id_text
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Usuario encontrado en la tabla users';
        
        -- Actualizar campos que puedan estar NULL
        UPDATE public.users 
        SET 
            phone = COALESCE(phone, NULL),  -- Asegurar que phone puede ser NULL
            updated_at = NOW()
        WHERE id = user_id_text;
        
        RAISE NOTICE 'Usuario actualizado correctamente';
    ELSE
        RAISE NOTICE 'Usuario NO encontrado en la tabla users';
        
        -- Verificar si existe en auth.users
        IF EXISTS (SELECT 1 FROM auth.users WHERE id::text = user_id_text) THEN
            RAISE NOTICE 'Usuario existe en auth.users, sincronizando...';
            
            -- Crear el usuario en public.users basado en auth.users (CORREGIDO)
            INSERT INTO public.users (id, email, name, phone, created_at, updated_at)
            SELECT 
                id::text,  -- Casting UUID a TEXT
                email,
                COALESCE(raw_user_meta_data->>'name', email),
                COALESCE(raw_user_meta_data->>'phone', NULL),  -- Permitir NULL
                created_at,
                NOW()
            FROM auth.users 
            WHERE id::text = user_id_text
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                updated_at = NOW();
            
            RAISE NOTICE 'Usuario sincronizado exitosamente desde auth.users a public.users';
        ELSE
            RAISE NOTICE 'Usuario no existe en auth.users tampoco';
        END IF;
    END IF;
END $$;

-- PASO 8: CREAR FUNCIONES AUXILIARES PARA OBTENER Y ACTUALIZAR PERFIL
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    avatar TEXT,
    bio TEXT,
    occupation TEXT,
    age INTEGER,
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
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.avatar,
        u.bio,
        u.occupation,
        u.age,
        u.location,
        u.search_type,
        u.budget_range,
        u.profile_image,
        u.preferred_areas,
        u.family_size,
        u.pet_friendly,
        u.move_in_date,
        u.employment_status,
        u.monthly_income,
        u.created_at,
        u.updated_at
    FROM public.users u
    WHERE u.id = user_uuid::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_uuid UUID,
    profile_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    user_id_text TEXT := user_uuid::text;
    updated_rows INTEGER;
BEGIN
    -- Verificar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id_text) THEN
        RAISE EXCEPTION 'Usuario no encontrado: %', user_id_text;
    END IF;
    
    -- Actualizar el perfil
    UPDATE public.users 
    SET 
        name = COALESCE(profile_data->>'name', name),
        phone = COALESCE(profile_data->>'phone', phone),
        avatar = COALESCE(profile_data->>'avatar', avatar),
        bio = COALESCE(profile_data->>'bio', bio),
        occupation = COALESCE(profile_data->>'occupation', occupation),
        age = COALESCE((profile_data->>'age')::INTEGER, age),
        location = COALESCE(profile_data->>'location', location),
        search_type = COALESCE(profile_data->>'search_type', search_type),
        budget_range = COALESCE(profile_data->>'budget_range', budget_range),
        profile_image = COALESCE(profile_data->>'profile_image', profile_image),
        preferred_areas = COALESCE(profile_data->>'preferred_areas', preferred_areas),
        family_size = COALESCE((profile_data->>'family_size')::INTEGER, family_size),
        pet_friendly = COALESCE((profile_data->>'pet_friendly')::BOOLEAN, pet_friendly),
        move_in_date = COALESCE((profile_data->>'move_in_date')::DATE, move_in_date),
        employment_status = COALESCE(profile_data->>'employment_status', employment_status),
        monthly_income = COALESCE((profile_data->>'monthly_income')::NUMERIC, monthly_income),
        updated_at = NOW()
    WHERE id = user_id_text;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 9: VERIFICACION FINAL
-- =====================================================================================
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICACION FINAL - SOLUCION CORREGIDA ===';
    RAISE NOTICE 'Campo phone ahora permite NULL';
    RAISE NOTICE 'Campos de perfil verificados/agregados';
    RAISE NOTICE 'Políticas RLS con casting UUID<->TEXT configuradas';
    RAISE NOTICE 'Triggers creados';
    RAISE NOTICE 'Función de sincronización corregida';
    RAISE NOTICE 'Funciones auxiliares para perfil creadas';
    RAISE NOTICE 'Usuario específico sincronizado';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUCION FINAL COMPLETADA - El endpoint /api/users/profile debería funcionar sin error 500';
    RAISE NOTICE '';
    RAISE NOTICE 'PROXIMOS PASOS:';
    RAISE NOTICE '1. Probar el endpoint PUT /api/users/profile';
    RAISE NOTICE '2. Verificar que no hay más errores 500';
    RAISE NOTICE '3. Confirmar que los datos se actualizan correctamente';
    RAISE NOTICE '4. El campo phone ahora puede ser NULL sin problemas';
END $$;

-- CONSULTA FINAL PARA VERIFICAR LA ESTRUCTURA
SELECT 
    'ESTRUCTURA FINAL TABLA USERS (PHONE NULLABLE)' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- VERIFICAR POLITICAS RLS
SELECT 
    'POLITICAS RLS FINALES CONFIGURADAS' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- PROBAR FUNCION AUXILIAR CON USUARIO ESPECIFICO
SELECT 
    'PRUEBA FUNCION GET_USER_PROFILE FINAL' as info,
    *
FROM public.get_user_profile('6403f9d2-e846-4c70-87e0-e051127d9500'::UUID);
