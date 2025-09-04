# SOLUCIÓN MANUAL - CONFIGURAR SUPABASE DESDE EL DASHBOARD

## ❌ PROBLEMA IDENTIFICADO
La configuración automática falló porque:
- No existe la función `exec_sql` en Supabase
- Permisos insuficientes para el esquema público
- La API de Supabase no permite ejecutar SQL arbitrario por seguridad

## ✅ SOLUCIÓN MANUAL PASO A PASO

### PASO 1: ACCEDER AL DASHBOARD DE SUPABASE
1. Ir a: https://supabase.com/dashboard
2. Iniciar sesión con tu cuenta
3. Seleccionar el proyecto: `qfeyhaaxyemmnohqdele`

### PASO 2: ABRIR EL EDITOR SQL
1. En el menú lateral, hacer clic en "SQL Editor"
2. Crear una nueva consulta

### PASO 3: EJECUTAR COMANDOS DE CONFIGURACIÓN

#### 3.1 - OTORGAR PERMISOS AL ESQUEMA PÚBLICO
```sql
-- Otorgar permisos de uso del esquema público
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Otorgar permisos para crear objetos en el esquema público
GRANT CREATE ON SCHEMA public TO authenticated;

-- Otorgar permisos para todas las tablas existentes y futuras
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Configurar permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
```

#### 3.2 - CREAR TABLA PROFILES
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    user_type TEXT CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')) DEFAULT 'inquilino',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.3 - CREAR TABLA PROPERTIES
```sql
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    location TEXT NOT NULL,
    property_type TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(10,2),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    images TEXT[],
    amenities TEXT[],
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.4 - CREAR TABLA FAVORITES
```sql
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    property_id UUID REFERENCES public.properties(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);
```

#### 3.5 - CREAR TABLA SEARCH_HISTORY
```sql
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    search_query TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.6 - CREAR TABLA MESSAGES
```sql
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.7 - CREAR TABLA CONVERSATIONS
```sql
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) NOT NULL,
    user2_id UUID REFERENCES auth.users(id) NOT NULL,
    property_id UUID REFERENCES public.properties(id),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id, property_id)
);
```

#### 3.8 - CREAR TABLA PROPERTY_IMAGES
```sql
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) NOT NULL,
    image_url TEXT NOT NULL,
    image_order INTEGER DEFAULT 0,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.9 - CREAR TABLA USER_LIMITS
```sql
CREATE TABLE IF NOT EXISTS public.user_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    limit_type TEXT NOT NULL,
    current_count INTEGER DEFAULT 0,
    max_limit INTEGER NOT NULL,
    reset_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, limit_type)
);
```

#### 3.10 - CREAR TABLA ADMIN_ACTIVITY
```sql
CREATE TABLE IF NOT EXISTS public.admin_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### PASO 4: HABILITAR ROW LEVEL SECURITY

#### 4.1 - HABILITAR RLS EN TODAS LAS TABLAS
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity ENABLE ROW LEVEL SECURITY;
```

### PASO 5: CREAR POLÍTICAS DE SEGURIDAD

#### 5.1 - POLÍTICAS PARA PROFILES
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" ON public.profiles 
    FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);
```

#### 5.2 - POLÍTICAS PARA PROPERTIES
```sql
-- Anyone can view active properties
CREATE POLICY "Anyone can view active properties" ON public.properties 
    FOR SELECT USING (is_active = true);

-- Users can manage own properties
CREATE POLICY "Users can manage own properties" ON public.properties 
    FOR ALL USING (auth.uid() = user_id);
```

#### 5.3 - POLÍTICAS PARA FAVORITES
```sql
-- Users can manage own favorites
CREATE POLICY "Users can manage own favorites" ON public.favorites 
    FOR ALL USING (auth.uid() = user_id);
```

#### 5.4 - POLÍTICAS PARA SEARCH_HISTORY
```sql
-- Users can manage own search history
CREATE POLICY "Users can manage own search history" ON public.search_history 
    FOR ALL USING (auth.uid() = user_id);
```

#### 5.5 - POLÍTICAS PARA MESSAGES
```sql
-- Users can view own messages
CREATE POLICY "Users can view own messages" ON public.messages 
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON public.messages 
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

#### 5.6 - POLÍTICAS PARA CONVERSATIONS
```sql
-- Users can view own conversations
CREATE POLICY "Users can view own conversations" ON public.conversations 
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON public.conversations 
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
```

#### 5.7 - POLÍTICAS PARA PROPERTY_IMAGES
```sql
-- Anyone can view property images
CREATE POLICY "Anyone can view property images" ON public.property_images 
    FOR SELECT USING (true);

-- Property owners can manage images
CREATE POLICY "Property owners can manage images" ON public.property_images 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE properties.id = property_images.property_id 
            AND properties.user_id = auth.uid()
        )
    );
```

### PASO 6: CREAR ÍNDICES PARA OPTIMIZACIÓN
```sql
-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_active ON public.properties(is_active);

-- Índices para favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON public.favorites(property_id);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_property_id ON public.conversations(property_id);
```

### PASO 7: VERIFICAR LA CONFIGURACIÓN
```sql
-- Verificar que las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'properties', 'favorites', 'search_history', 
    'messages', 'conversations', 'property_images', 
    'user_limits', 'admin_activity'
);
```

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Permisos del esquema público otorgados
- [ ] Tabla `profiles` creada
- [ ] Tabla `properties` creada
- [ ] Tabla `favorites` creada
- [ ] Tabla `search_history` creada
- [ ] Tabla `messages` creada
- [ ] Tabla `conversations` creada
- [ ] Tabla `property_images` creada
- [ ] Tabla `user_limits` creada
- [ ] Tabla `admin_activity` creada
- [ ] RLS habilitado en todas las tablas
- [ ] Políticas de seguridad creadas
- [ ] Índices de optimización creados

## 🎯 PRÓXIMOS PASOS

Una vez completada la configuración manual:

1. **Probar la conexión** desde la aplicación
2. **Verificar que el registro de usuarios funcione**
3. **Probar la creación de propiedades**
4. **Verificar que las políticas RLS funcionen correctamente**

## ⚠️ NOTAS IMPORTANTES

- **Ejecutar los comandos uno por uno** en el SQL Editor de Supabase
- **Verificar que cada comando se ejecute sin errores** antes de continuar
- **Si hay errores**, revisar los mensajes y corregir antes de continuar
- **Guardar una copia** de todos los comandos ejecutados para referencia futura

## 🔧 SOLUCIÓN DE PROBLEMAS

Si encuentras errores:

1. **Error de permisos**: Asegúrate de estar usando una cuenta con permisos de administrador
2. **Error de sintaxis**: Verifica que el SQL esté correctamente formateado
3. **Error de referencias**: Asegúrate de que las tablas referenciadas existan
4. **Error de políticas**: Verifica que las tablas tengan RLS habilitado antes de crear políticas

---

**IMPORTANTE**: Esta configuración manual es necesaria porque la configuración automática falló debido a limitaciones de seguridad de Supabase. Una vez completada manualmente, el proyecto debería funcionar correctamente.
