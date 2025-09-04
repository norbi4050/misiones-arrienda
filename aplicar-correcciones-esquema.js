const { supabase } = require('./supabase-connection-alternativo');

async function aplicarCorreccionesEsquema() {
    console.log('🔧 APLICANDO CORRECCIONES DE ESQUEMA');
    console.log('====================================\n');
    
    const correcciones = [
        {
            nombre: 'Crear tabla properties si no existe',
            sql: `
                CREATE TABLE IF NOT EXISTS public.properties (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    location VARCHAR(255) NOT NULL,
                    property_type VARCHAR(100) NOT NULL,
                    bedrooms INTEGER DEFAULT 0,
                    bathrooms INTEGER DEFAULT 0,
                    area DECIMAL(10,2),
                    images TEXT[],
                    contact_phone VARCHAR(20),
                    contact_email VARCHAR(255),
                    user_id UUID REFERENCES auth.users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            nombre: 'Crear tabla profiles si no existe',
            sql: `
                CREATE TABLE IF NOT EXISTS public.profiles (
                    id UUID REFERENCES auth.users(id) PRIMARY KEY,
                    full_name VARCHAR(255),
                    phone VARCHAR(20),
                    user_type VARCHAR(50) DEFAULT 'inquilino',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            nombre: 'Habilitar RLS en properties',
            sql: `
                ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
            `
        },
        {
            nombre: 'Habilitar RLS en profiles',
            sql: `
                ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            `
        },
        {
            nombre: 'Política de lectura para properties',
            sql: `
                CREATE POLICY IF NOT EXISTS "Properties are viewable by everyone" 
                ON public.properties FOR SELECT 
                USING (true);
            `
        },
        {
            nombre: 'Política de inserción para properties',
            sql: `
                CREATE POLICY IF NOT EXISTS "Users can insert their own properties" 
                ON public.properties FOR INSERT 
                WITH CHECK (auth.uid() = user_id);
            `
        },
        {
            nombre: 'Política de actualización para properties',
            sql: `
                CREATE POLICY IF NOT EXISTS "Users can update their own properties" 
                ON public.properties FOR UPDATE 
                USING (auth.uid() = user_id);
            `
        },
        {
            nombre: 'Política de lectura para profiles',
            sql: `
                CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone" 
                ON public.profiles FOR SELECT 
                USING (true);
            `
        },
        {
            nombre: 'Política de inserción para profiles',
            sql: `
                CREATE POLICY IF NOT EXISTS "Users can insert their own profile" 
                ON public.profiles FOR INSERT 
                WITH CHECK (auth.uid() = id);
            `
        },
        {
            nombre: 'Política de actualización para profiles',
            sql: `
                CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
                ON public.profiles FOR UPDATE 
                USING (auth.uid() = id);
            `
        }
    ];
    
    let correccionesAplicadas = 0;
    
    for (const correccion of correcciones) {
        try {
            console.log(`🔄 Aplicando: ${correccion.nombre}`);
            
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql_query: correccion.sql 
            });
            
            if (error) {
                console.log(`⚠️  ${correccion.nombre}: ${error.message}`);
                // Continuar con las siguientes correcciones
            } else {
                console.log(`✅ ${correccion.nombre}: Aplicado exitosamente`);
                correccionesAplicadas++;
            }
        } catch (err) {
            console.log(`❌ Error aplicando ${correccion.nombre}:`, err.message);
        }
        
        // Pequeña pausa entre correcciones
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 RESUMEN DE CORRECCIONES:`);
    console.log(`✅ Correcciones aplicadas: ${correccionesAplicadas}/${correcciones.length}`);
    
    return correccionesAplicadas;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    aplicarCorreccionesEsquema()
        .then(correcciones => {
            if (correcciones > 0) {
                console.log('🎉 Correcciones de esquema aplicadas exitosamente');
                process.exit(0);
            } else {
                console.log('⚠️  No se pudieron aplicar correcciones');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error aplicando correcciones:', error.message);
            process.exit(1);
        });
}

module.exports = { aplicarCorreccionesEsquema };
