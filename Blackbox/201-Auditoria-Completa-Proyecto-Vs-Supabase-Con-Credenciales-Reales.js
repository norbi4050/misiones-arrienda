/**
 * AUDITORÍA COMPLETA: PROYECTO VS SUPABASE
 * Verificación exhaustiva de sincronización entre código y base de datos
 * Fecha: 2025-01-03
 * Estado: CRÍTICO - VERIFICACIÓN CON CREDENCIALES REALES
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

class AuditoriaSupabaseCompleta {
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);
        this.resultados = {
            tablas: {},
            politicas: {},
            funciones: {},
            triggers: {},
            buckets: {},
            desalineaciones: [],
            errores: [],
            recomendaciones: []
        };
    }

    async ejecutarAuditoriaCompleta() {
        console.log('🔍 INICIANDO AUDITORÍA COMPLETA PROYECTO VS SUPABASE');
        console.log('=' .repeat(60));

        try {
            // 1. Verificar conexión
            await this.verificarConexion();
            
            // 2. Auditar estructura de tablas
            await this.auditarEstructuraTablas();
            
            // 3. Verificar políticas RLS
            await this.verificarPoliticasRLS();
            
            // 4. Auditar funciones y triggers
            await this.auditarFuncionesTriggers();
            
            // 5. Verificar storage y buckets
            await this.verificarStorage();
            
            // 6. Comparar con esquema Prisma
            await this.compararConPrisma();
            
            // 7. Verificar datos de prueba
            await this.verificarDatosPrueba();
            
            // 8. Generar reporte final
            await this.generarReporteFinal();
            
        } catch (error) {
            console.error('❌ ERROR EN AUDITORÍA:', error);
            this.resultados.errores.push({
                tipo: 'CRÍTICO',
                mensaje: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async verificarConexion() {
        console.log('\n📡 Verificando conexión a Supabase...');
        
        try {
            const { data, error } = await this.supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .limit(1);

            if (error) throw error;
            
            console.log('✅ Conexión exitosa a Supabase');
            return true;
        } catch (error) {
            console.error('❌ Error de conexión:', error.message);
            throw error;
        }
    }

    async auditarEstructuraTablas() {
        console.log('\n🏗️ Auditando estructura de tablas...');
        
        const tablasEsperadas = [
            'users', 'properties', 'community_profiles', 'messages', 
            'conversations', 'favorites', 'search_history', 'payments'
        ];

        for (const tabla of tablasEsperadas) {
            try {
                console.log(`\n📋 Verificando tabla: ${tabla}`);
                
                // Verificar existencia de tabla
                const { data: tablaInfo, error: tablaError } = await this.supabase
                    .rpc('get_table_info', { table_name: tabla });

                if (tablaError) {
                    this.resultados.desalineaciones.push({
                        tipo: 'TABLA_FALTANTE',
                        tabla: tabla,
                        descripcion: `Tabla ${tabla} no existe en Supabase`,
                        severidad: 'CRÍTICA'
                    });
                    continue;
                }

                // Verificar columnas
                const { data: columnas, error: columnasError } = await this.supabase
                    .rpc('get_table_columns', { table_name: tabla });

                if (!columnasError && columnas) {
                    this.resultados.tablas[tabla] = {
                        existe: true,
                        columnas: columnas,
                        timestamp: new Date().toISOString()
                    };
                    console.log(`✅ Tabla ${tabla}: ${columnas.length} columnas encontradas`);
                } else {
                    console.log(`⚠️ No se pudieron obtener columnas de ${tabla}`);
                }

            } catch (error) {
                console.error(`❌ Error auditando tabla ${tabla}:`, error.message);
                this.resultados.errores.push({
                    tabla: tabla,
                    error: error.message,
                    tipo: 'ESTRUCTURA'
                });
            }
        }
    }

    async verificarPoliticasRLS() {
        console.log('\n🔒 Verificando políticas RLS...');
        
        try {
            const { data: politicas, error } = await this.supabase
                .rpc('get_rls_policies');

            if (error) {
                console.error('❌ Error obteniendo políticas RLS:', error.message);
                return;
            }

            if (politicas && politicas.length > 0) {
                console.log(`✅ Encontradas ${politicas.length} políticas RLS`);
                this.resultados.politicas = {
                    total: politicas.length,
                    politicas: politicas,
                    timestamp: new Date().toISOString()
                };
            } else {
                console.log('⚠️ No se encontraron políticas RLS');
                this.resultados.desalineaciones.push({
                    tipo: 'POLITICAS_FALTANTES',
                    descripcion: 'No hay políticas RLS configuradas',
                    severidad: 'ALTA'
                });
            }

        } catch (error) {
            console.error('❌ Error verificando políticas RLS:', error.message);
        }
    }

    async auditarFuncionesTriggers() {
        console.log('\n⚙️ Auditando funciones y triggers...');
        
        try {
            // Verificar funciones
            const { data: funciones, error: funcionesError } = await this.supabase
                .rpc('get_functions_list');

            if (!funcionesError && funciones) {
                console.log(`✅ Encontradas ${funciones.length} funciones`);
                this.resultados.funciones = {
                    total: funciones.length,
                    funciones: funciones
                };
            }

            // Verificar triggers
            const { data: triggers, error: triggersError } = await this.supabase
                .rpc('get_triggers_list');

            if (!triggersError && triggers) {
                console.log(`✅ Encontrados ${triggers.length} triggers`);
                this.resultados.triggers = {
                    total: triggers.length,
                    triggers: triggers
                };
            }

        } catch (error) {
            console.error('❌ Error auditando funciones/triggers:', error.message);
        }
    }

    async verificarStorage() {
        console.log('\n📁 Verificando storage y buckets...');
        
        try {
            const { data: buckets, error } = await this.supabase.storage.listBuckets();

            if (error) {
                console.error('❌ Error obteniendo buckets:', error.message);
                return;
            }

            const bucketsEsperados = ['property-images', 'profile-images', 'documents'];
            
            for (const bucketEsperado of bucketsEsperados) {
                const bucketExiste = buckets.find(b => b.name === bucketEsperado);
                
                if (bucketExiste) {
                    console.log(`✅ Bucket ${bucketEsperado}: Existe`);
                    this.resultados.buckets[bucketEsperado] = {
                        existe: true,
                        publico: bucketExiste.public,
                        creado: bucketExiste.created_at
                    };
                } else {
                    console.log(`❌ Bucket ${bucketEsperado}: NO EXISTE`);
                    this.resultados.desalineaciones.push({
                        tipo: 'BUCKET_FALTANTE',
                        bucket: bucketEsperado,
                        descripcion: `Bucket ${bucketEsperado} no existe`,
                        severidad: 'MEDIA'
                    });
                }
            }

        } catch (error) {
            console.error('❌ Error verificando storage:', error.message);
        }
    }

    async compararConPrisma() {
        console.log('\n🔄 Comparando con esquema Prisma...');
        
        try {
            const prismaPath = path.join(__dirname, '../Backend/prisma/schema.prisma');
            
            if (fs.existsSync(prismaPath)) {
                const prismaContent = fs.readFileSync(prismaPath, 'utf8');
                
                // Extraer modelos de Prisma
                const modelos = this.extraerModelosPrisma(prismaContent);
                console.log(`📋 Encontrados ${modelos.length} modelos en Prisma`);
                
                // Comparar con tablas de Supabase
                for (const modelo of modelos) {
                    if (!this.resultados.tablas[modelo.toLowerCase()]) {
                        this.resultados.desalineaciones.push({
                            tipo: 'MODELO_SIN_TABLA',
                            modelo: modelo,
                            descripcion: `Modelo ${modelo} en Prisma pero no hay tabla en Supabase`,
                            severidad: 'ALTA'
                        });
                    }
                }
                
            } else {
                console.log('⚠️ No se encontró archivo schema.prisma');
            }
            
        } catch (error) {
            console.error('❌ Error comparando con Prisma:', error.message);
        }
    }

    extraerModelosPrisma(content) {
        const modelRegex = /model\s+(\w+)\s*{/g;
        const modelos = [];
        let match;
        
        while ((match = modelRegex.exec(content)) !== null) {
            modelos.push(match[1]);
        }
        
        return modelos;
    }

    async verificarDatosPrueba() {
        console.log('\n🧪 Verificando datos de prueba...');
        
        const tablasConDatos = ['users', 'properties', 'community_profiles'];
        
        for (const tabla of tablasConDatos) {
            try {
                const { data, error, count } = await this.supabase
                    .from(tabla)
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    console.log(`📊 Tabla ${tabla}: ${count || 0} registros`);
                    
                    if (count === 0) {
                        this.resultados.recomendaciones.push({
                            tipo: 'DATOS_PRUEBA',
                            tabla: tabla,
                            descripcion: `Considerar agregar datos de prueba a ${tabla}`,
                            prioridad: 'BAJA'
                        });
                    }
                } else {
                    console.log(`❌ Error verificando datos en ${tabla}:`, error.message);
                }
                
            } catch (error) {
                console.error(`❌ Error verificando datos en ${tabla}:`, error.message);
            }
        }
    }

    async generarReporteFinal() {
        console.log('\n📊 Generando reporte final...');
        
        const reporte = {
            timestamp: new Date().toISOString(),
            resumen: {
                tablas_auditadas: Object.keys(this.resultados.tablas).length,
                desalineaciones_encontradas: this.resultados.desalineaciones.length,
                errores_criticos: this.resultados.errores.length,
                politicas_rls: this.resultados.politicas.total || 0,
                buckets_storage: Object.keys(this.resultados.buckets).length
            },
            detalles: this.resultados,
            estado_general: this.determinarEstadoGeneral(),
            proximos_pasos: this.generarProximosPasos()
        };

        // Guardar reporte
        const reportePath = path.join(__dirname, '202-Reporte-Auditoria-Supabase-Completa-Final.json');
        fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN DE AUDITORÍA COMPLETA');
        console.log('='.repeat(60));
        console.log(`✅ Tablas auditadas: ${reporte.resumen.tablas_auditadas}`);
        console.log(`⚠️ Desalineaciones: ${reporte.resumen.desalineaciones_encontradas}`);
        console.log(`❌ Errores críticos: ${reporte.resumen.errores_criticos}`);
        console.log(`🔒 Políticas RLS: ${reporte.resumen.politicas_rls}`);
        console.log(`📁 Buckets storage: ${reporte.resumen.buckets_storage}`);
        console.log(`🎯 Estado general: ${reporte.estado_general}`);
        console.log('='.repeat(60));
        
        if (reporte.resumen.desalineaciones_encontradas > 0) {
            console.log('\n⚠️ DESALINEACIONES ENCONTRADAS:');
            this.resultados.desalineaciones.forEach((des, index) => {
                console.log(`${index + 1}. [${des.severidad}] ${des.tipo}: ${des.descripcion}`);
            });
        }
        
        if (reporte.proximos_pasos.length > 0) {
            console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS:');
            reporte.proximos_pasos.forEach((paso, index) => {
                console.log(`${index + 1}. ${paso}`);
            });
        }
        
        console.log(`\n📄 Reporte completo guardado en: ${reportePath}`);
    }

    determinarEstadoGeneral() {
        const erroresCriticos = this.resultados.errores.length;
        const desalineacionesCriticas = this.resultados.desalineaciones.filter(d => d.severidad === 'CRÍTICA').length;
        
        if (erroresCriticos > 0 || desalineacionesCriticas > 0) {
            return 'CRÍTICO';
        } else if (this.resultados.desalineaciones.length > 0) {
            return 'REQUIERE_ATENCIÓN';
        } else {
            return 'ÓPTIMO';
        }
    }

    generarProximosPasos() {
        const pasos = [];
        
        // Basado en desalineaciones encontradas
        const tablasFaltantes = this.resultados.desalineaciones.filter(d => d.tipo === 'TABLA_FALTANTE');
        if (tablasFaltantes.length > 0) {
            pasos.push(`Crear ${tablasFaltantes.length} tabla(s) faltante(s) en Supabase`);
        }
        
        const bucketsFaltantes = this.resultados.desalineaciones.filter(d => d.tipo === 'BUCKET_FALTANTE');
        if (bucketsFaltantes.length > 0) {
            pasos.push(`Crear ${bucketsFaltantes.length} bucket(s) de storage faltante(s)`);
        }
        
        if (!this.resultados.politicas.total || this.resultados.politicas.total === 0) {
            pasos.push('Implementar políticas RLS para seguridad de datos');
        }
        
        if (this.resultados.errores.length > 0) {
            pasos.push('Resolver errores críticos de conexión/configuración');
        }
        
        return pasos;
    }
}

// Ejecutar auditoría
async function main() {
    const auditoria = new AuditoriaSupabaseCompleta();
    await auditoria.ejecutarAuditoriaCompleta();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AuditoriaSupabaseCompleta;
