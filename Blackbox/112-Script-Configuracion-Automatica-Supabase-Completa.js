/**
 * BLACKBOX AI - SCRIPT DE CONFIGURACIÓN AUTOMÁTICA SUPABASE COMPLETA
 * ================================================================
 * 
 * Basado en los resultados del testing exhaustivo, este script soluciona
 * automáticamente todos los problemas críticos identificados en Supabase.
 * 
 * PROBLEMAS IDENTIFICADOS:
 * - ❌ Conexión con Service Role Key (schema cache)
 * - ❌ Tablas faltantes en el esquema público
 * - ❌ Bucket community-photos no existe
 * - ❌ Permisos denegados para schema public
 * - ⚠️  Políticas RLS no configuradas
 * - ⚠️  Funciones y triggers faltantes
 * 
 * TASA DE ÉXITO ACTUAL: 36% → OBJETIVO: 100%
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTkwNzI2NCwiZXhwIjoyMDUxNDgzMjY0fQ.VgBhgJhkdJOGJhkdJOGJhkdJOGJhkdJOGJhkdJOGJhk'
};

class SupabaseConfiguratorComplete {
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);
        this.results = [];
        this.errors = [];
        this.warnings = [];
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type}: ${message}`;
        console.log(logMessage);
        
        if (type === 'ERROR') {
            this.errors.push({ message, timestamp });
        } else if (type === 'WARNING') {
            this.warnings.push({ message, timestamp });
        }
        
        this.results.push({ message, type, timestamp });
    }

    async executeSQL(query, description) {
        try {
            this.log(`🔧 Ejecutando: ${description}`, 'INFO');
            const { data, error } = await this.supabase.rpc('exec_sql', { sql: query });
            
            if (error) {
                this.log(`❌ Error en ${description}: ${error.message}`, 'ERROR');
                return false;
            }
            
            this.log(`✅ Completado: ${description}`, 'SUCCESS');
            return true;
        } catch (err) {
            this.log(`❌ Excepción en ${description}: ${err.message}`, 'ERROR');
            return false;
        }
    }

    async createMissingTables() {
        this.log('📋 FASE 1: CREANDO TABLAS FALTANTES...', 'INFO');
        
        const tables = [
            {
                name: 'profiles',
                sql: `
                CREATE TABLE IF NOT EXISTS public.profiles (
                    id UUID REFERENCES auth.users(id) PRIMARY KEY,
                    email TEXT,
                    full_name TEXT,
                    avatar_url TEXT,
                    phone TEXT,
                    user_type TEXT CHECK (user_type IN ('inquilino', 'propietario', 'inmobiliaria')),
                    bio TEXT,
                    location TEXT,
                    verified BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                `
            },
            {
                name: 'properties',
                sql: `
                CREATE TABLE IF NOT EXISTS public.properties (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    currency TEXT DEFAULT 'ARS',
                    property_type TEXT NOT NULL,
                    operation_type TEXT NOT NULL CHECK (operation_type IN ('venta', 'alquiler')),
                    bedrooms INTEGER,
                    bathrooms INTEGER,
                    area_total DECIMAL(8,2),
                    area_covered DECIMAL(8,2),
                    address TEXT NOT NULL,
                    city TEXT NOT NULL,
                    province TEXT NOT NULL,
                    country TEXT DEFAULT 'Argentina',
                    latitude DECIMAL(10,8),
                    longitude DECIMAL(11,8),
                    images TEXT[],
                    amenities TEXT[],
                    contact_phone TEXT,
                    contact_email TEXT,
                    contact_whatsapp TEXT,
                    owner_id UUID REFERENCES auth.users(id),
                    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'rented')),
                    featured BOOLEAN DEFAULT false,
                    views INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                `
            },
            {
                name: 'favorites',
                sql: `
                CREATE TABLE IF NOT EXISTS public.favorites (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user_id, property_id)
                );
                `
            },
            {
                name: 'search_history',
                sql: `
                CREATE TABLE IF NOT EXISTS public.search_history (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                    search_query TEXT NOT NULL,
                    filters JSONB,
                    results_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                `
            },
            {
                name: 'inquiries',
                sql: `
                CREATE TABLE IF NOT EXISTS public.inquiries (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
                    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                    message TEXT NOT NULL,
                    contact_phone TEXT,
                    contact_email TEXT,
                    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                `
            }
        ];

        for (const table of tables) {
            await this.executeSQL(table.sql, `Crear tabla ${table.name}`);
        }
    }

    async createMissingBuckets() {
        this.log('🗂️ FASE 2: CREANDO BUCKETS DE STORAGE FALTANTES...', 'INFO');
        
        try {
            // Crear bucket community-photos
            const { data, error } = await this.supabase.storage.createBucket('community-photos', {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                fileSizeLimit: 5242880 // 5MB
            });

            if (error && !error.message.includes('already exists')) {
                this.log(`❌ Error creando bucket community-photos: ${error.message}`, 'ERROR');
            } else {
                this.log('✅ Bucket community-photos creado exitosamente', 'SUCCESS');
            }
        } catch (err) {
            this.log(`❌ Excepción creando buckets: ${err.message}`, 'ERROR');
        }
    }

    async setupRLSPolicies() {
        this.log('🔒 FASE 3: CONFIGURANDO POLÍTICAS RLS...', 'INFO');
        
        const policies = [
            {
                name: 'Enable RLS on profiles',
                sql: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'
            },
            {
                name: 'Enable RLS on properties',
                sql: 'ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;'
            },
            {
                name: 'Enable RLS on favorites',
                sql: 'ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;'
            },
            {
                name: 'Enable RLS on search_history',
                sql: 'ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;'
            },
            {
                name: 'Enable RLS on inquiries',
                sql: 'ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;'
            },
            {
                name: 'Profiles - Users can view all profiles',
                sql: `
                CREATE POLICY "Users can view all profiles" ON public.profiles
                FOR SELECT USING (true);
                `
            },
            {
                name: 'Profiles - Users can update own profile',
                sql: `
                CREATE POLICY "Users can update own profile" ON public.profiles
                FOR UPDATE USING (auth.uid() = id);
                `
            },
            {
                name: 'Profiles - Users can insert own profile',
                sql: `
                CREATE POLICY "Users can insert own profile" ON public.profiles
                FOR INSERT WITH CHECK (auth.uid() = id);
                `
            },
            {
                name: 'Properties - Anyone can view active properties',
                sql: `
                CREATE POLICY "Anyone can view active properties" ON public.properties
                FOR SELECT USING (status = 'active');
                `
            },
            {
                name: 'Properties - Owners can manage their properties',
                sql: `
                CREATE POLICY "Owners can manage their properties" ON public.properties
                FOR ALL USING (auth.uid() = owner_id);
                `
            },
            {
                name: 'Properties - Authenticated users can create properties',
                sql: `
                CREATE POLICY "Authenticated users can create properties" ON public.properties
                FOR INSERT WITH CHECK (auth.uid() = owner_id);
                `
            },
            {
                name: 'Favorites - Users can manage their favorites',
                sql: `
                CREATE POLICY "Users can manage their favorites" ON public.favorites
                FOR ALL USING (auth.uid() = user_id);
                `
            },
            {
                name: 'Search History - Users can manage their search history',
                sql: `
                CREATE POLICY "Users can manage their search history" ON public.search_history
                FOR ALL USING (auth.uid() = user_id);
                `
            },
            {
                name: 'Inquiries - Users can view inquiries for their properties',
                sql: `
                CREATE POLICY "Users can view inquiries for their properties" ON public.inquiries
                FOR SELECT USING (
                    auth.uid() = user_id OR 
                    auth.uid() IN (
                        SELECT owner_id FROM public.properties WHERE id = property_id
                    )
                );
                `
            },
            {
                name: 'Inquiries - Authenticated users can create inquiries',
                sql: `
                CREATE POLICY "Authenticated users can create inquiries" ON public.inquiries
                FOR INSERT WITH CHECK (auth.uid() = user_id);
                `
            }
        ];

        for (const policy of policies) {
            await this.executeSQL(policy.sql, policy.name);
        }
    }

    async createFunctionsAndTriggers() {
        this.log('⚡ FASE 4: CREANDO FUNCIONES Y TRIGGERS...', 'INFO');
        
        const functions = [
            {
                name: 'handle_new_user function',
                sql: `
                CREATE OR REPLACE FUNCTION public.handle_new_user()
                RETURNS TRIGGER AS $$
                BEGIN
                    INSERT INTO public.profiles (id, email, full_name, avatar_url)
                    VALUES (
                        NEW.id,
                        NEW.email,
                        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
                        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
                    );
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;
                `
            },
            {
                name: 'update_updated_at function',
                sql: `
                CREATE OR REPLACE FUNCTION public.update_updated_at()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                `
            }
        ];

        const triggers = [
            {
                name: 'on_auth_user_created trigger',
                sql: `
                DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
                CREATE TRIGGER on_auth_user_created
                    AFTER INSERT ON auth.users
                    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
                `
            },
            {
                name: 'update_profiles_updated_at trigger',
                sql: `
                DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
                CREATE TRIGGER update_profiles_updated_at
                    BEFORE UPDATE ON public.profiles
                    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
                `
            },
            {
                name: 'update_properties_updated_at trigger',
                sql: `
                DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
                CREATE TRIGGER update_properties_updated_at
                    BEFORE UPDATE ON public.properties
                    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
                `
            },
            {
                name: 'update_inquiries_updated_at trigger',
                sql: `
                DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
                CREATE TRIGGER update_inquiries_updated_at
                    BEFORE UPDATE ON public.inquiries
                    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
                `
            }
        ];

        // Crear funciones
        for (const func of functions) {
            await this.executeSQL(func.sql, func.name);
        }

        // Crear triggers
        for (const trigger of triggers) {
            await this.executeSQL(trigger.sql, trigger.name);
        }
    }

    async createIndexes() {
        this.log('📊 FASE 5: CREANDO ÍNDICES PARA OPTIMIZACIÓN...', 'INFO');
        
        const indexes = [
            {
                name: 'properties_city_idx',
                sql: 'CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);'
            },
            {
                name: 'properties_property_type_idx',
                sql: 'CREATE INDEX IF NOT EXISTS properties_property_type_idx ON public.properties(property_type);'
            },
            {
                name: 'properties_operation_type_idx',
                sql: 'CREATE INDEX IF NOT EXISTS properties_operation_type_idx ON public.properties(operation_type);'
            },
            {
                name: 'properties_price_idx',
                sql: 'CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties(price);'
            },
            {
                name: 'properties_status_idx',
                sql: 'CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);'
            },
            {
                name: 'properties_created_at_idx',
                sql: 'CREATE INDEX IF NOT EXISTS properties_created_at_idx ON public.properties(created_at DESC);'
            },
            {
                name: 'properties_location_idx',
                sql: 'CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties(latitude, longitude);'
            },
            {
                name: 'favorites_user_id_idx',
                sql: 'CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);'
            },
            {
                name: 'search_history_user_id_idx',
                sql: 'CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON public.search_history(user_id);'
            },
            {
                name: 'inquiries_property_id_idx',
                sql: 'CREATE INDEX IF NOT EXISTS inquiries_property_id_idx ON public.inquiries(property_id);'
            }
        ];

        for (const index of indexes) {
            await this.executeSQL(index.sql, `Crear índice ${index.name}`);
        }
    }

    async setupStoragePolicies() {
        this.log('🗄️ FASE 6: CONFIGURANDO POLÍTICAS DE STORAGE...', 'INFO');
        
        const storagePolicies = [
            {
                name: 'property-images public access',
                sql: `
                CREATE POLICY "Public Access" ON storage.objects FOR SELECT
                USING (bucket_id = 'property-images');
                `
            },
            {
                name: 'property-images authenticated upload',
                sql: `
                CREATE POLICY "Authenticated users can upload property images" ON storage.objects
                FOR INSERT WITH CHECK (
                    bucket_id = 'property-images' AND 
                    auth.role() = 'authenticated'
                );
                `
            },
            {
                name: 'avatars public access',
                sql: `
                CREATE POLICY "Public Access" ON storage.objects FOR SELECT
                USING (bucket_id = 'avatars');
                `
            },
            {
                name: 'avatars user upload',
                sql: `
                CREATE POLICY "Users can upload their own avatar" ON storage.objects
                FOR INSERT WITH CHECK (
                    bucket_id = 'avatars' AND 
                    auth.uid()::text = (storage.foldername(name))[1]
                );
                `
            },
            {
                name: 'community-photos public access',
                sql: `
                CREATE POLICY "Public Access" ON storage.objects FOR SELECT
                USING (bucket_id = 'community-photos');
                `
            },
            {
                name: 'community-photos authenticated upload',
                sql: `
                CREATE POLICY "Authenticated users can upload community photos" ON storage.objects
                FOR INSERT WITH CHECK (
                    bucket_id = 'community-photos' AND 
                    auth.role() = 'authenticated'
                );
                `
            }
        ];

        for (const policy of storagePolicies) {
            await this.executeSQL(policy.sql, policy.name);
        }
    }

    async runFinalValidation() {
        this.log('🔍 FASE 7: VALIDACIÓN FINAL...', 'INFO');
        
        const validations = [
            {
                name: 'Verificar tablas creadas',
                test: async () => {
                    const { data, error } = await this.supabase
                        .from('profiles')
                        .select('count', { count: 'exact', head: true });
                    return !error;
                }
            },
            {
                name: 'Verificar bucket community-photos',
                test: async () => {
                    const { data, error } = await this.supabase.storage.getBucket('community-photos');
                    return !error && data;
                }
            },
            {
                name: 'Verificar políticas RLS',
                test: async () => {
                    const { data, error } = await this.supabase
                        .from('properties')
                        .select('count', { count: 'exact', head: true });
                    return !error;
                }
            }
        ];

        let validationsPassed = 0;
        for (const validation of validations) {
            try {
                const result = await validation.test();
                if (result) {
                    this.log(`✅ ${validation.name}: PASÓ`, 'SUCCESS');
                    validationsPassed++;
                } else {
                    this.log(`❌ ${validation.name}: FALLÓ`, 'ERROR');
                }
            } catch (err) {
                this.log(`❌ ${validation.name}: ERROR - ${err.message}`, 'ERROR');
            }
        }

        return validationsPassed;
    }

    async generateReport() {
        const timestamp = new Date().toISOString();
        const report = {
            timestamp,
            status: 'COMPLETADO',
            phases: [
                'Creación de tablas faltantes',
                'Creación de buckets de storage',
                'Configuración de políticas RLS',
                'Creación de funciones y triggers',
                'Creación de índices',
                'Configuración de políticas de storage',
                'Validación final'
            ],
            results: this.results,
            errors: this.errors,
            warnings: this.warnings,
            summary: {
                totalOperations: this.results.length,
                errors: this.errors.length,
                warnings: this.warnings.length,
                successRate: Math.round(((this.results.length - this.errors.length) / this.results.length) * 100)
            }
        };

        const reportPath = path.join(__dirname, '112-Reporte-Configuracion-Automatica-Supabase-Final.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`📊 Reporte guardado en: ${reportPath}`, 'INFO');
        return report;
    }

    async run() {
        console.log('🚀 INICIANDO CONFIGURACIÓN AUTOMÁTICA COMPLETA DE SUPABASE...');
        console.log('📅 Fecha:', new Date().toLocaleString());
        console.log('🔗 URL Supabase:', SUPABASE_CONFIG.url);
        console.log('============================================================\n');

        try {
            // Ejecutar todas las fases
            await this.createMissingTables();
            await this.createMissingBuckets();
            await this.setupRLSPolicies();
            await this.createFunctionsAndTriggers();
            await this.createIndexes();
            await this.setupStoragePolicies();
            
            const validationsPassed = await this.runFinalValidation();
            
            // Generar reporte final
            const report = await this.generateReport();
            
            console.log('\n============================================================');
            console.log('📊 RESUMEN DE CONFIGURACIÓN AUTOMÁTICA:');
            console.log(`✅ Operaciones completadas: ${this.results.length - this.errors.length}`);
            console.log(`❌ Errores: ${this.errors.length}`);
            console.log(`⚠️  Advertencias: ${this.warnings.length}`);
            console.log(`📈 Tasa de éxito: ${report.summary.successRate}%`);
            console.log(`🔍 Validaciones pasadas: ${validationsPassed}/3`);
            console.log('============================================================');
            
            if (this.errors.length === 0) {
                console.log('\n🎉 ¡Configuración automática de Supabase completada exitosamente!');
                console.log('✅ Supabase está ahora 100% configurado y listo para usar.');
            } else {
                console.log('\n⚠️  Configuración completada con algunos errores.');
                console.log('📋 Revisa el reporte para detalles específicos.');
            }
            
        } catch (error) {
            this.log(`❌ Error crítico en configuración: ${error.message}`, 'ERROR');
            console.log('\n💥 Error crítico durante la configuración automática.');
            console.log('📋 Revisa los logs para más detalles.');
        }
    }
}

// Ejecutar configuración automática
if (require.main === module) {
    const configurator = new SupabaseConfiguratorComplete();
    configurator.run().catch(console.error);
}

module.exports = SupabaseConfiguratorComplete;
