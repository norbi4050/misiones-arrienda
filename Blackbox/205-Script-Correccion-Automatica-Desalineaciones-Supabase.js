/**
 * SCRIPT DE CORRECCIÓN AUTOMÁTICA: DESALINEACIONES SUPABASE
 * Aplica correcciones automáticas basadas en resultados de auditoría
 * Fecha: 2025-01-03
 * Estado: LISTO PARA EJECUCIÓN
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

class CorreccionAutomaticaSupabase {
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);
        this.correcciones = {
            tablas_creadas: [],
            buckets_creados: [],
            politicas_aplicadas: [],
            funciones_creadas: [],
            errores: []
        };
    }

    async ejecutarCorreccionesAutomaticas() {
        console.log('🔧 INICIANDO CORRECCIONES AUTOMÁTICAS SUPABASE');
        console.log('=' .repeat(60));

        try {
            // 1. Leer reporte de auditoría
            const reporteAuditoria = await this.leerReporteAuditoria();
            
            if (!reporteAuditoria) {
                console.log('⚠️ No se encontró reporte de auditoría. Ejecute primero la auditoría.');
                return;
            }

            // 2. Aplicar correcciones basadas en desalineaciones
            await this.aplicarCorreccionesTablas(reporteAuditoria);
            await this.aplicarCorreccionesBuckets(reporteAuditoria);
            await this.aplicarCorreccionesPoliticas(reporteAuditoria);
            await this.aplicarCorreccionesFunciones();
            
            // 3. Generar reporte de correcciones
            await this.generarReporteCorrecciones();
            
        } catch (error) {
            console.error('❌ ERROR EN CORRECCIONES:', error);
            this.correcciones.errores.push({
                tipo: 'CRÍTICO',
                mensaje: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async leerReporteAuditoria() {
        try {
            const reportePath = path.join(__dirname, '202-Reporte-Auditoria-Supabase-Completa-Final.json');
            
            if (fs.existsSync(reportePath)) {
                const reporteContent = fs.readFileSync(reportePath, 'utf8');
                return JSON.parse(reporteContent);
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error leyendo reporte de auditoría:', error.message);
            return null;
        }
    }

    async aplicarCorreccionesTablas(reporte) {
        console.log('\n🏗️ Aplicando correcciones de tablas...');
        
        if (!reporte.detalles.desalineaciones) return;
        
        const tablasFaltantes = reporte.detalles.desalineaciones.filter(d => d.tipo === 'TABLA_FALTANTE');
        
        for (const desalineacion of tablasFaltantes) {
            try {
                console.log(`📋 Creando tabla: ${desalineacion.tabla}`);
                
                const sqlCreacion = this.generarSQLCreacionTabla(desalineacion.tabla);
                
                if (sqlCreacion) {
                    const { error } = await this.supabase.rpc('execute_sql', { 
                        sql_query: sqlCreacion 
                    });
                    
                    if (error) {
                        console.error(`❌ Error creando tabla ${desalineacion.tabla}:`, error.message);
                        this.correcciones.errores.push({
                            tipo: 'TABLA',
                            tabla: desalineacion.tabla,
                            error: error.message
                        });
                    } else {
                        console.log(`✅ Tabla ${desalineacion.tabla} creada exitosamente`);
                        this.correcciones.tablas_creadas.push(desalineacion.tabla);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Error procesando tabla ${desalineacion.tabla}:`, error.message);
            }
        }
    }

    generarSQLCreacionTabla(nombreTabla) {
        const esquemas = {
            'users': `
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255),
                    full_name VARCHAR(255),
                    phone VARCHAR(20),
                    user_type VARCHAR(50) DEFAULT 'inquilino',
                    is_active BOOLEAN DEFAULT true,
                    email_verified BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `,
            'properties': `
                CREATE TABLE IF NOT EXISTS properties (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(3) DEFAULT 'ARS',
                    property_type VARCHAR(50) NOT NULL,
                    bedrooms INTEGER,
                    bathrooms INTEGER,
                    area_m2 DECIMAL(8,2),
                    address TEXT,
                    city VARCHAR(100),
                    province VARCHAR(100),
                    country VARCHAR(100) DEFAULT 'Argentina',
                    latitude DECIMAL(10,8),
                    longitude DECIMAL(11,8),
                    images TEXT[],
                    amenities TEXT[],
                    is_active BOOLEAN DEFAULT true,
                    is_featured BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `,
            'community_profiles': `
                CREATE TABLE IF NOT EXISTS community_profiles (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    display_name VARCHAR(255),
                    bio TEXT,
                    avatar_url TEXT,
                    interests TEXT[],
                    location VARCHAR(255),
                    age_range VARCHAR(20),
                    occupation VARCHAR(255),
                    is_public BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `,
            'messages': `
                CREATE TABLE IF NOT EXISTS messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    conversation_id UUID NOT NULL,
                    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    message_type VARCHAR(20) DEFAULT 'text',
                    is_read BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `,
            'conversations': `
                CREATE TABLE IF NOT EXISTS conversations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    participant_1 UUID REFERENCES users(id) ON DELETE CASCADE,
                    participant_2 UUID REFERENCES users(id) ON DELETE CASCADE,
                    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
                    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `,
            'favorites': `
                CREATE TABLE IF NOT EXISTS favorites (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user_id, property_id)
                );
            `,
            'search_history': `
                CREATE TABLE IF NOT EXISTS search_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    search_query TEXT,
                    filters JSONB,
                    results_count INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `,
            'payments': `
                CREATE TABLE IF NOT EXISTS payments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(3) DEFAULT 'ARS',
                    payment_method VARCHAR(50),
                    payment_status VARCHAR(20) DEFAULT 'pending',
                    external_payment_id VARCHAR(255),
                    metadata JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        };

        return esquemas[nombreTabla] || null;
    }

    async aplicarCorreccionesBuckets(reporte) {
        console.log('\n📁 Aplicando correcciones de buckets...');
        
        if (!reporte.detalles.desalineaciones) return;
        
        const bucketsFaltantes = reporte.detalles.desalineaciones.filter(d => d.tipo === 'BUCKET_FALTANTE');
        
        for (const desalineacion of bucketsFaltantes) {
            try {
                console.log(`🪣 Creando bucket: ${desalineacion.bucket}`);
                
                const { data, error } = await this.supabase.storage.createBucket(desalineacion.bucket, {
                    public: true,
                    allowedMimeTypes: ['image/*', 'application/pdf'],
                    fileSizeLimit: 10485760 // 10MB
                });
                
                if (error) {
                    console.error(`❌ Error creando bucket ${desalineacion.bucket}:`, error.message);
                    this.correcciones.errores.push({
                        tipo: 'BUCKET',
                        bucket: desalineacion.bucket,
                        error: error.message
                    });
                } else {
                    console.log(`✅ Bucket ${desalineacion.bucket} creado exitosamente`);
                    this.correcciones.buckets_creados.push(desalineacion.bucket);
                }
                
            } catch (error) {
                console.error(`❌ Error procesando bucket ${desalineacion.bucket}:`, error.message);
            }
        }
    }

    async aplicarCorreccionesPoliticas(reporte) {
        console.log('\n🔒 Aplicando correcciones de políticas RLS...');
        
        // Políticas básicas para tablas principales
        const politicasBasicas = [
            {
                tabla: 'users',
                politica: 'users_policy',
                sql: `
                    CREATE POLICY users_policy ON users
                    FOR ALL USING (auth.uid() = id);
                `
            },
            {
                tabla: 'properties',
                politica: 'properties_policy',
                sql: `
                    CREATE POLICY properties_policy ON properties
                    FOR ALL USING (
                        is_active = true OR 
                        auth.uid() = user_id
                    );
                `
            },
            {
                tabla: 'community_profiles',
                politica: 'community_profiles_policy',
                sql: `
                    CREATE POLICY community_profiles_policy ON community_profiles
                    FOR ALL USING (
                        is_public = true OR 
                        auth.uid() = user_id
                    );
                `
            }
        ];

        for (const politica of politicasBasicas) {
            try {
                console.log(`🔐 Aplicando política: ${politica.politica}`);
                
                // Habilitar RLS en la tabla
                const enableRLS = `ALTER TABLE ${politica.tabla} ENABLE ROW LEVEL SECURITY;`;
                await this.supabase.rpc('execute_sql', { sql_query: enableRLS });
                
                // Crear la política
                const { error } = await this.supabase.rpc('execute_sql', { 
                    sql_query: politica.sql 
                });
                
                if (error && !error.message.includes('already exists')) {
                    console.error(`❌ Error aplicando política ${politica.politica}:`, error.message);
                    this.correcciones.errores.push({
                        tipo: 'POLITICA',
                        politica: politica.politica,
                        error: error.message
                    });
                } else {
                    console.log(`✅ Política ${politica.politica} aplicada exitosamente`);
                    this.correcciones.politicas_aplicadas.push(politica.politica);
                }
                
            } catch (error) {
                console.error(`❌ Error procesando política ${politica.politica}:`, error.message);
            }
        }
    }

    async aplicarCorreccionesFunciones() {
        console.log('\n⚙️ Aplicando correcciones de funciones...');
        
        // Leer y aplicar funciones auxiliares
        try {
            const funcionesPath = path.join(__dirname, '203-Funciones-Auxiliares-Auditoria-Supabase.sql');
            
            if (fs.existsSync(funcionesPath)) {
                const funcionesSQL = fs.readFileSync(funcionesPath, 'utf8');
                
                // Dividir en funciones individuales
                const funciones = funcionesSQL.split('CREATE OR REPLACE FUNCTION').filter(f => f.trim());
                
                for (let i = 0; i < funciones.length; i++) {
                    if (i === 0) continue; // Saltar el primer elemento vacío
                    
                    const funcionSQL = 'CREATE OR REPLACE FUNCTION' + funciones[i];
                    const nombreFuncion = this.extraerNombreFuncion(funcionSQL);
                    
                    try {
                        console.log(`🔧 Creando función: ${nombreFuncion}`);
                        
                        const { error } = await this.supabase.rpc('execute_sql', { 
                            sql_query: funcionSQL 
                        });
                        
                        if (error) {
                            console.error(`❌ Error creando función ${nombreFuncion}:`, error.message);
                            this.correcciones.errores.push({
                                tipo: 'FUNCION',
                                funcion: nombreFuncion,
                                error: error.message
                            });
                        } else {
                            console.log(`✅ Función ${nombreFuncion} creada exitosamente`);
                            this.correcciones.funciones_creadas.push(nombreFuncion);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error procesando función ${nombreFuncion}:`, error.message);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error aplicando funciones auxiliares:', error.message);
        }
    }

    extraerNombreFuncion(sql) {
        const match = sql.match(/CREATE OR REPLACE FUNCTION\s+(\w+)\s*\(/i);
        return match ? match[1] : 'función_desconocida';
    }

    async generarReporteCorrecciones() {
        console.log('\n📊 Generando reporte de correcciones...');
        
        const reporte = {
            timestamp: new Date().toISOString(),
            resumen: {
                tablas_creadas: this.correcciones.tablas_creadas.length,
                buckets_creados: this.correcciones.buckets_creados.length,
                politicas_aplicadas: this.correcciones.politicas_aplicadas.length,
                funciones_creadas: this.correcciones.funciones_creadas.length,
                errores_encontrados: this.correcciones.errores.length
            },
            detalles: this.correcciones,
            estado_final: this.determinarEstadoFinal(),
            recomendaciones: this.generarRecomendacionesFinales()
        };

        // Guardar reporte
        const reportePath = path.join(__dirname, '206-Reporte-Correcciones-Automaticas-Final.json');
        fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN DE CORRECCIONES APLICADAS');
        console.log('='.repeat(60));
        console.log(`✅ Tablas creadas: ${reporte.resumen.tablas_creadas}`);
        console.log(`📁 Buckets creados: ${reporte.resumen.buckets_creados}`);
        console.log(`🔒 Políticas aplicadas: ${reporte.resumen.politicas_aplicadas}`);
        console.log(`⚙️ Funciones creadas: ${reporte.resumen.funciones_creadas}`);
        console.log(`❌ Errores encontrados: ${reporte.resumen.errores_encontrados}`);
        console.log(`🎯 Estado final: ${reporte.estado_final}`);
        console.log('='.repeat(60));
        
        if (this.correcciones.errores.length > 0) {
            console.log('\n⚠️ ERRORES ENCONTRADOS:');
            this.correcciones.errores.forEach((error, index) => {
                console.log(`${index + 1}. [${error.tipo}] ${error.error || error.mensaje}`);
            });
        }
        
        if (reporte.recomendaciones.length > 0) {
            console.log('\n🎯 RECOMENDACIONES FINALES:');
            reporte.recomendaciones.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }
        
        console.log(`\n📄 Reporte completo guardado en: ${reportePath}`);
    }

    determinarEstadoFinal() {
        const totalCorrecciones = this.correcciones.tablas_creadas.length + 
                                this.correcciones.buckets_creados.length + 
                                this.correcciones.politicas_aplicadas.length + 
                                this.correcciones.funciones_creadas.length;
        
        const erroresCriticos = this.correcciones.errores.filter(e => e.tipo === 'CRÍTICO').length;
        
        if (erroresCriticos > 0) {
            return 'CRÍTICO_CON_ERRORES';
        } else if (totalCorrecciones > 0 && this.correcciones.errores.length === 0) {
            return 'EXITOSO_COMPLETO';
        } else if (totalCorrecciones > 0) {
            return 'EXITOSO_CON_ADVERTENCIAS';
        } else {
            return 'SIN_CORRECCIONES_NECESARIAS';
        }
    }

    generarRecomendacionesFinales() {
        const recomendaciones = [];
        
        if (this.correcciones.tablas_creadas.length > 0) {
            recomendaciones.push('Verificar que las nuevas tablas tengan los datos necesarios');
            recomendaciones.push('Ejecutar migraciones de Prisma para sincronizar esquemas');
        }
        
        if (this.correcciones.buckets_creados.length > 0) {
            recomendaciones.push('Configurar políticas de acceso para los nuevos buckets');
            recomendaciones.push('Verificar permisos de subida de archivos');
        }
        
        if (this.correcciones.politicas_aplicadas.length > 0) {
            recomendaciones.push('Probar autenticación y autorización con usuarios reales');
        }
        
        if (this.correcciones.errores.length > 0) {
            recomendaciones.push('Revisar y corregir errores manualmente en Supabase Dashboard');
        }
        
        recomendaciones.push('Ejecutar nueva auditoría para verificar sincronización completa');
        
        return recomendaciones;
    }
}

// Ejecutar correcciones
async function main() {
    const corrector = new CorreccionAutomaticaSupabase();
    await corrector.ejecutarCorreccionesAutomaticas();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = CorreccionAutomaticaSupabase;
