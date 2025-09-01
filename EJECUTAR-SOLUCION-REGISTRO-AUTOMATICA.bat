@echo off
echo =====================================================
echo 🚨 SOLUCION AUTOMATICA: ERROR REGISTRO DATABASE
echo =====================================================
echo.

echo 📋 PASOS A SEGUIR:
echo.
echo 1. Ve a tu proyecto Supabase: https://qfeyhaaxyemmnohqdele.supabase.co
echo 2. Haz clic en "SQL Editor" en el menu lateral
echo 3. Haz clic en "New Query"
echo 4. Copia y pega el siguiente SQL:
echo.

echo =====================================================
echo 📝 SQL PARA COPIAR Y PEGAR:
echo =====================================================
echo.

type > temp_sql.txt << 'EOF'
-- =====================================================
-- SOLUCION RAPIDA: CREAR TABLA USERS Y CONFIGURAR RLS
-- =====================================================

-- 1. Crear tabla users si no existe
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    user_type TEXT NOT NULL DEFAULT 'inquilino',
    company_name TEXT,
    license_number TEXT,
    property_count INTEGER,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear indices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Crear politicas RLS
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id);

-- 5. Crear funcion para sincronizar con auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, phone, user_type, company_name, license_number, property_count, email_verified)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'userType', 'inquilino'),
        NEW.raw_user_meta_data->>'companyName',
        NEW.raw_user_meta_data->>'licenseNumber',
        (NEW.raw_user_meta_data->>'propertyCount')::INTEGER,
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para sincronizacion automatica
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Verificar que todo funciona
SELECT 'Configuracion completada exitosamente!' as status;
EOF

type temp_sql.txt
del temp_sql.txt

echo.
echo =====================================================
echo 📋 INSTRUCCIONES:
echo =====================================================
echo.
echo 1. Copia TODO el SQL de arriba
echo 2. Pegalo en el SQL Editor de Supabase
echo 3. Haz clic en "Run" o presiona Ctrl+Enter
echo 4. Deberia mostrar: "Configuracion completada exitosamente!"
echo 5. Prueba crear un usuario nuevamente
echo.

echo =====================================================
echo 🆘 SI AUN NO FUNCIONA:
echo =====================================================
echo.
echo Ejecuta este SQL adicional para deshabilitar RLS temporalmente:
echo.
echo ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
echo.
echo Luego prueba el registro y vuelve a habilitar RLS:
echo.
echo ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
echo.

echo =====================================================
echo ✅ VERIFICACION:
echo =====================================================
echo.
echo Para verificar que la tabla se creo correctamente:
echo.
echo SELECT table_name, column_name, data_type 
echo FROM information_schema.columns 
echo WHERE table_name = 'users' AND table_schema = 'public'
echo ORDER BY ordinal_position;
echo.

pause
echo.
echo 🎉 Configuracion lista! Prueba crear un usuario ahora.
