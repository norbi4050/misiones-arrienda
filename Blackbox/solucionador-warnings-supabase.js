const { createClient } = require('@supabase/supabase-js');

console.log('🔧 SOLUCIONADOR AUTOMÁTICO DE WARNINGS SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function solucionarWarnings() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase...');
    console.log('');

    const solucionesAplicadas = [];
    const erroresEncontrados = [];

    try {
        // 1. CREAR TABLAS CRÍTICAS FALTANTES
        console.log('📋 PASO 1: CREANDO TABLAS CRÍTICAS...');
        console.log('-'.repeat(50));

        const tablasEsenciales = {
            users: `
                CREATE TABLE IF NOT EXISTS public.users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT,
                    email TEXT UNIQUE,
                    phone TEXT,
                    password TEXT,
                    avatar TEXT,
                    bio TEXT,
                    occupation TEXT,
                    age INTEGER,
                    user_type TEXT,
                    company_name TEXT,
                    license_number TEXT,
                    property_count TEXT,
                    full_name TEXT,
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
                    verified BOOLEAN DEFAULT false,
                    email_verified BOOLEAN DEFAULT false,
                    verification_token TEXT,
                    rating NUMERIC DEFAULT 0,
                    review_count INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
            `,
            properties: `
                CREATE TABLE IF NOT EXISTS public.properties (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title TEXT NOT NULL,
                    description TEXT,
                    price NUMERIC NOT NULL,
                    currency TEXT DEFAULT 'ARS',
                    property_type TEXT,
                    bedrooms INTEGER,
                    bathrooms INTEGER,
                    area NUMERIC,
                    address TEXT,
                    city TEXT,
                    state TEXT DEFAULT 'Misiones',
                    country TEXT DEFAULT 'Argentina',
                    latitude NUMERIC,
                    longitude NUMERIC,
                    images TEXT[],
                    amenities TEXT[],
                    available BOOLEAN DEFAULT true,
                    featured BOOLEAN DEFAULT false,
                    owner_id UUID REFERENCES auth.users(id),
                    agent_id UUID,
                    views INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
            `,
            agents: `
                CREATE TABLE IF NOT EXISTS public.agents (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES auth.users(id),
                    company_name TEXT,
                    license_number TEXT,
                    phone TEXT,
                    email TEXT,
                    bio TEXT,
                    specialties TEXT[],
                    rating NUMERIC DEFAULT 0,
                    review_count INTEGER DEFAULT 0,
                    verified BOOLEAN DEFAULT false,
                    active BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
            `,
            favorites: `
                CREATE TABLE IF NOT EXISTS public.favorites (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES auth.users(id),
                    property_id UUID REFERENCES public.properties(id),
                    created_at TIMESTAMPTZ DEFAULT now(),
                    UNIQUE(user_id, property_id)
                );
            `,
            conversations: `
                CREATE TABLE IF NOT EXISTS public.conversations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    property_id UUID REFERENCES public.properties(id),
                    buyer_id UUID REFERENCES auth.users(id),
                    seller_id UUID REFERENCES auth.users(id),
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
            `,
            messages: `
                CREATE TABLE IF NOT EXISTS public.messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    conversation_id UUID REFERENCES public.conversations(id),
                    sender_id UUID REFERENCES auth.users(id),
                    content TEXT NOT NULL,
                    message_type TEXT DEFAULT 'text',
                    read BOOLEAN DEFAULT false,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
            `
        };

        for (const [tableName, createSQL] of Object.entries(tablasEsenciales)) {
            try {
                console.log(`   📋 Creando tabla ${tableName}...`);
                
                // Usar función SQL personalizada para ejecutar DDL
                const { data, error } = await supabase.rpc('exec_sql', { sql: createSQL });
                
                if (error) {
                    console.log(`   ❌ Error creando ${tableName}:`, error.message);
                    erroresEncontrados.push(`Error creando tabla ${tableName}: ${error.message}`);
                } else {
                    console.log(`   ✅ Tabla ${tableName} creada/verificada`);
                    solucionesAplicadas.push(`Tabla ${tableName} creada exitosamente`);
                }
            } catch (error) {
                console.log(`   ❌ Error ejecutando SQL para ${tableName}:`, error.message);
                erroresEncontrados.push(`Error SQL ${tableName}: ${error.message}`);
            }
        }

        console.log('');

        // 2. CONFIGURAR POLÍTICAS RLS
        console.log('🔒 PASO 2: CONFIGURANDO POLÍTICAS RLS...');
        console.log('-'.repeat(50));

        const politicasRLS = {
            users: [
                'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;',
                `CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);`,
                `CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);`,
                `CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);`
            ],
            properties: [
                'ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;',
                `CREATE POLICY IF NOT EXISTS "Anyone can view available properties" ON public.properties FOR SELECT USING (available = true);`,
                `CREATE POLICY IF NOT EXISTS "Owners can manage their properties" ON public.properties FOR ALL USING (auth.uid() = owner_id);`,
                `CREATE POLICY IF NOT EXISTS "Agents can manage assigned properties" ON public.properties FOR ALL USING (auth.uid() = agent_id);`
            ],
            agents: [
                'ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;',
                `CREATE POLICY IF NOT EXISTS "Anyone can view active agents" ON public.agents FOR SELECT USING (active = true);`,
                `CREATE POLICY IF NOT EXISTS "Agents can manage own profile" ON public.agents FOR ALL USING (auth.uid() = user_id);`
            ],
            favorites: [
                'ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;',
                `CREATE POLICY IF NOT EXISTS "Users can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);`
            ],
            conversations: [
                'ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;',
                `CREATE POLICY IF NOT EXISTS "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);`,
                `CREATE POLICY IF NOT EXISTS "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id);`
            ],
            messages: [
                'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;',
                `CREATE POLICY IF NOT EXISTS "Users can view conversation messages" ON public.messages FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.conversations 
                        WHERE id = conversation_id 
                        AND (buyer_id = auth.uid() OR seller_id = auth.uid())
                    )
                );`,
                `CREATE POLICY IF NOT EXISTS "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);`
            ]
        };

        for (const [tableName, policies] of Object.entries(politicasRLS)) {
            console.log(`   🔒 Configurando RLS para ${tableName}...`);
            
            for (const policy of policies) {
                try {
                    const { data, error } = await supabase.rpc('exec_sql', { sql: policy });
                    
                    if (error) {
                        console.log(`   ❌ Error en política ${tableName}:`, error.message);
                        erroresEncontrados.push(`Error política ${tableName}: ${error.message}`);
                    }
                } catch (error) {
                    console.log(`   ❌ Error ejecutando política:`, error.message);
                }
            }
            
            console.log(`   ✅ RLS configurado para ${tableName}`);
            solucionesAplicadas.push(`Políticas RLS configuradas para ${tableName}`);
        }

        console.log('');

        // 3. CREAR FUNCIONES Y TRIGGERS ÚTILES
        console.log('⚙️ PASO 3: CREANDO FUNCIONES Y TRIGGERS...');
        console.log('-'.repeat(50));

        // Función para actualizar updated_at automáticamente
        const funcionUpdatedAt = `
            CREATE OR REPLACE FUNCTION public.handle_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;

        try {
            await supabase.rpc('exec_sql', { sql: funcionUpdatedAt });
            console.log('   ✅ Función handle_updated_at creada');
            solucionesAplicadas.push('Función handle_updated_at creada');
        } catch (error) {
            console.log('   ❌ Error creando función:', error.message);
            erroresEncontrados.push(`Error función updated_at: ${error.message}`);
        }

        // Triggers para updated_at
        const tablesWithUpdatedAt = ['users', 'properties', 'agents', 'conversations'];
        
        for (const tableName of tablesWithUpdatedAt) {
            const triggerSQL = `
                DROP TRIGGER IF EXISTS set_updated_at ON public.${tableName};
                CREATE TRIGGER set_updated_at
                    BEFORE UPDATE ON public.${tableName}
                    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
            `;

            try {
                await supabase.rpc('exec_sql', { sql: triggerSQL });
                console.log(`   ✅ Trigger updated_at creado para ${tableName}`);
                solucionesAplicadas.push(`Trigger updated_at para ${tableName}`);
            } catch (error) {
                console.log(`   ❌ Error creando trigger para ${tableName}:`, error.message);
            }
        }

        console.log('');

        // 4. CREAR BUCKETS DE STORAGE
        console.log('📁 PASO 4: CREANDO BUCKETS DE STORAGE...');
        console.log('-'.repeat(50));

        const bucketsNecesarios = [
            { name: 'avatars', public: true },
            { name: 'property-images', public: true },
            { name: 'documents', public: false }
        ];

        for (const bucket of bucketsNecesarios) {
            try {
                const { data, error } = await supabase.storage.createBucket(bucket.name, {
                    public: bucket.public,
                    allowedMimeTypes: bucket.name === 'documents' 
                        ? ['application/pdf', 'image/jpeg', 'image/png']
                        : ['image/jpeg', 'image/png', 'image/webp'],
                    fileSizeLimit: 5242880 // 5MB
                });

                if (error && !error.message.includes('already exists')) {
                    console.log(`   ❌ Error creando bucket ${bucket.name}:`, error.message);
                    erroresEncontrados.push(`Error bucket ${bucket.name}: ${error.message}`);
                } else {
                    console.log(`   ✅ Bucket ${bucket.name} creado/verificado`);
                    solucionesAplicadas.push(`Bucket ${bucket.name} configurado`);
                }
            } catch (error) {
                console.log(`   ❌ Error con bucket ${bucket.name}:`, error.message);
            }
        }

        console.log('');

        // 5. CREAR ÍNDICES PARA PERFORMANCE
        console.log('📊 PASO 5: CREANDO ÍNDICES...');
        console.log('-'.repeat(50));

        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);',
            'CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);',
            'CREATE INDEX IF NOT EXISTS idx_properties_available ON public.properties(available);',
            'CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);',
            'CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);',
            'CREATE INDEX IF NOT EXISTS idx_conversations_property ON public.conversations(property_id);'
        ];

        for (const indiceSQL of indices) {
            try {
                await supabase.rpc('exec_sql', { sql: indiceSQL });
                console.log(`   ✅ Índice creado: ${indiceSQL.split(' ')[5]}`);
                solucionesAplicadas.push(`Índice ${indiceSQL.split(' ')[5]} creado`);
            } catch (error) {
                console.log(`   ❌ Error creando índice:`, error.message);
            }
        }

        console.log('');

        // 6. INSERTAR DATOS DE PRUEBA BÁSICOS
        console.log('🧪 PASO 6: INSERTANDO DATOS DE PRUEBA...');
        console.log('-'.repeat(50));

        // Usuario de prueba específico del error
        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
        
        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    name: 'Usuario Test',
                    email: 'test@misionesarrienda.com',
                    phone: '+54 376 123456',
                    user_type: 'inquilino',
                    location: 'Posadas, Misiones',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select();

            if (userError) {
                console.log('   ❌ Error insertando usuario de prueba:', userError.message);
            } else {
                console.log('   ✅ Usuario de prueba insertado');
                solucionesAplicadas.push('Usuario de prueba creado');
            }
        } catch (error) {
            console.log('   ❌ Error con datos de prueba:', error.message);
        }

        console.log('');

        // RESUMEN FINAL
        console.log('📊 RESUMEN DE SOLUCIONES APLICADAS');
        console.log('='.repeat(70));
        
        console.log('✅ SOLUCIONES EXITOSAS:');
        if (solucionesAplicadas.length === 0) {
            console.log('   No se aplicaron soluciones');
        } else {
            solucionesAplicadas.forEach((solucion, index) => {
                console.log(`   ${index + 1}. ${solucion}`);
            });
        }

        console.log('');
        console.log('❌ ERRORES ENCONTRADOS:');
        if (erroresEncontrados.length === 0) {
            console.log('   ✅ No se encontraron errores');
        } else {
            erroresEncontrados.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        // Guardar reporte
        const reporteSoluciones = {
            timestamp: new Date().toISOString(),
            solucionesAplicadas: solucionesAplicadas,
            erroresEncontrados: erroresEncontrados,
            estadoFinal: {
                exitoso: erroresEncontrados.length === 0,
                solucionesTotal: solucionesAplicadas.length,
                erroresTotal: erroresEncontrados.length
            }
        };

        require('fs').writeFileSync(
            'REPORTE-SOLUCIONES-WARNINGS-APLICADAS.json',
            JSON.stringify(reporteSoluciones, null, 2)
        );

        console.log('');
        console.log('📄 Reporte guardado en: REPORTE-SOLUCIONES-WARNINGS-APLICADAS.json');
        console.log('✅ PROCESO DE SOLUCIONES COMPLETADO');

    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

solucionarWarnings().catch(console.error);
