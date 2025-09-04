/**
 * 🔒 SCRIPT VERIFICACIÓN POLÍTICAS RLS - SUPABASE
 * ================================================
 * 
 * PROBLEMA CRÍTICO IDENTIFICADO:
 * - Todas las tablas están sin políticas RLS
 * - Datos sensibles expuestos públicamente
 * - Riesgo de seguridad ALTO
 * 
 * Este script verifica el estado actual de RLS en Supabase
 * y genera un reporte detallado de políticas faltantes.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

// Tablas críticas que requieren RLS
const TABLAS_CRITICAS = [
    'profiles',
    'users', 
    'properties',
    'payments',
    'user_profiles',
    'messages',
    'conversations',
    'favorites',
    'user_reviews',
    'rental_history',
    'search_history',
    'payment_methods',
    'subscriptions'
];

class VerificadorRLS {
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);
        this.resultados = {
            tablas_sin_rls: [],
            tablas_con_rls: [],
            politicas_encontradas: [],
            errores: [],
            resumen: {}
        };
    }

    async verificarRLSCompleto() {
        console.log('🔒 INICIANDO VERIFICACIÓN DE POLÍTICAS RLS...\n');
        
        try {
            // 1. Verificar estado RLS de cada tabla
            await this.verificarEstadoRLS();
            
            // 2. Verificar políticas existentes
            await this.verificarPoliticasExistentes();
            
            // 3. Probar acceso público (CRÍTICO)
            await this.probarAccesoPublico();
            
            // 4. Generar reporte
            this.generarReporte();
            
        } catch (error) {
            console.error('❌ ERROR EN VERIFICACIÓN RLS:', error);
            this.resultados.errores.push({
                tipo: 'error_general',
                mensaje: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async verificarEstadoRLS() {
        console.log('📋 Verificando estado RLS de tablas críticas...\n');
        
        for (const tabla of TABLAS_CRITICAS) {
            try {
                // Consulta para verificar si RLS está habilitado
                const { data, error } = await this.supabase.rpc('verificar_rls_tabla', {
                    nombre_tabla: tabla
                });

                if (error) {
                    // Si la función no existe, usar consulta directa
                    const { data: rlsData, error: rlsError } = await this.supabase
                        .from('pg_class')
                        .select('relname, relrowsecurity')
                        .eq('relname', tabla)
                        .single();

                    if (rlsError) {
                        console.log(`⚠️  Tabla '${tabla}': No encontrada o sin acceso`);
                        this.resultados.errores.push({
                            tabla,
                            tipo: 'tabla_no_encontrada',
                            error: rlsError.message
                        });
                        continue;
                    }

                    const rlsHabilitado = rlsData?.relrowsecurity || false;
                    
                    if (rlsHabilitado) {
                        console.log(`✅ Tabla '${tabla}': RLS HABILITADO`);
                        this.resultados.tablas_con_rls.push(tabla);
                    } else {
                        console.log(`❌ Tabla '${tabla}': RLS DESHABILITADO - CRÍTICO`);
                        this.resultados.tablas_sin_rls.push(tabla);
                    }
                } else {
                    // Procesar resultado de la función personalizada
                    console.log(`✅ Tabla '${tabla}': Verificación exitosa`);
                }

            } catch (error) {
                console.log(`❌ Error verificando tabla '${tabla}':`, error.message);
                this.resultados.errores.push({
                    tabla,
                    tipo: 'error_verificacion',
                    error: error.message
                });
            }
        }
    }

    async verificarPoliticasExistentes() {
        console.log('\n🔍 Verificando políticas existentes...\n');
        
        try {
            // Consultar políticas existentes en pg_policies
            const { data: politicas, error } = await this.supabase
                .from('pg_policies')
                .select('*');

            if (error) {
                console.log('⚠️  No se pudieron consultar las políticas:', error.message);
                return;
            }

            if (politicas && politicas.length > 0) {
                console.log(`📊 Encontradas ${politicas.length} políticas:`);
                politicas.forEach(politica => {
                    console.log(`   - ${politica.tablename}: ${politica.policyname} (${politica.cmd})`);
                    this.resultados.politicas_encontradas.push({
                        tabla: politica.tablename,
                        nombre: politica.policyname,
                        comando: politica.cmd,
                        definicion: politica.definition
                    });
                });
            } else {
                console.log('❌ NO SE ENCONTRARON POLÍTICAS - CRÍTICO');
            }

        } catch (error) {
            console.log('❌ Error consultando políticas:', error.message);
            this.resultados.errores.push({
                tipo: 'error_consulta_politicas',
                error: error.message
            });
        }
    }

    async probarAccesoPublico() {
        console.log('\n🚨 PROBANDO ACCESO PÚBLICO (SIN AUTENTICACIÓN)...\n');
        
        // Crear cliente sin autenticación (anon)
        const clientePublico = createClient(
            SUPABASE_CONFIG.url, 
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE'
        );

        const tablasProbar = ['users', 'profiles', 'payments', 'messages'];
        
        for (const tabla of tablasProbar) {
            try {
                const { data, error } = await clientePublico
                    .from(tabla)
                    .select('*')
                    .limit(1);

                if (error) {
                    if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
                        console.log(`✅ Tabla '${tabla}': Acceso público BLOQUEADO (Correcto)`);
                    } else {
                        console.log(`⚠️  Tabla '${tabla}': Error inesperado:`, error.message);
                    }
                } else {
                    console.log(`🚨 CRÍTICO - Tabla '${tabla}': ACCESO PÚBLICO PERMITIDO`);
                    console.log(`   Datos expuestos: ${data ? data.length : 0} registros`);
                    
                    this.resultados.errores.push({
                        tabla,
                        tipo: 'acceso_publico_permitido',
                        gravedad: 'CRITICO',
                        datos_expuestos: data ? data.length : 0
                    });
                }

            } catch (error) {
                console.log(`❌ Error probando acceso público en '${tabla}':`, error.message);
            }
        }
    }

    generarReporte() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 REPORTE FINAL - VERIFICACIÓN RLS');
        console.log('='.repeat(80));
        
        // Resumen general
        const totalTablas = TABLAS_CRITICAS.length;
        const tablasConRLS = this.resultados.tablas_con_rls.length;
        const tablasSinRLS = this.resultados.tablas_sin_rls.length;
        const politicasTotal = this.resultados.politicas_encontradas.length;
        
        this.resultados.resumen = {
            total_tablas: totalTablas,
            tablas_con_rls: tablasConRLS,
            tablas_sin_rls: tablasSinRLS,
            politicas_encontradas: politicasTotal,
            porcentaje_seguridad: Math.round((tablasConRLS / totalTablas) * 100),
            errores_criticos: this.resultados.errores.filter(e => e.gravedad === 'CRITICO').length
        };

        console.log('\n🎯 RESUMEN EJECUTIVO:');
        console.log(`   📊 Total tablas analizadas: ${totalTablas}`);
        console.log(`   ✅ Tablas con RLS: ${tablasConRLS}`);
        console.log(`   ❌ Tablas sin RLS: ${tablasSinRLS}`);
        console.log(`   📋 Políticas encontradas: ${politicasTotal}`);
        console.log(`   🔒 Nivel de seguridad: ${this.resultados.resumen.porcentaje_seguridad}%`);
        
        // Estado crítico
        if (tablasSinRLS > 0) {
            console.log('\n🚨 ESTADO CRÍTICO DE SEGURIDAD:');
            console.log('   ❌ TABLAS SIN PROTECCIÓN RLS:');
            this.resultados.tablas_sin_rls.forEach(tabla => {
                console.log(`      - ${tabla} (DATOS EXPUESTOS PÚBLICAMENTE)`);
            });
        }

        // Errores críticos
        const erroresCriticos = this.resultados.errores.filter(e => e.gravedad === 'CRITICO');
        if (erroresCriticos.length > 0) {
            console.log('\n🚨 ERRORES CRÍTICOS DETECTADOS:');
            erroresCriticos.forEach(error => {
                console.log(`   ❌ ${error.tabla}: ${error.tipo}`);
                if (error.datos_expuestos) {
                    console.log(`      Registros expuestos: ${error.datos_expuestos}`);
                }
            });
        }

        // Recomendaciones
        console.log('\n💡 RECOMENDACIONES INMEDIATAS:');
        if (tablasSinRLS > 0) {
            console.log('   1. 🚨 URGENTE: Habilitar RLS en todas las tablas');
            console.log('   2. 🔒 Crear políticas de seguridad por fila');
            console.log('   3. 🧪 Testing exhaustivo de políticas');
        }
        
        if (politicasTotal === 0) {
            console.log('   4. 📝 Crear políticas básicas de acceso');
            console.log('   5. 👤 Implementar autenticación obligatoria');
        }

        console.log('\n📅 Próximos pasos:');
        console.log('   1. Ejecutar script de implementación RLS');
        console.log('   2. Verificar políticas implementadas');
        console.log('   3. Testing de seguridad completo');
        
        console.log('\n' + '='.repeat(80));
        console.log(`✅ Verificación completada: ${new Date().toLocaleString()}`);
        console.log('='.repeat(80));

        // Guardar resultados para el siguiente script
        this.guardarResultados();
    }

    guardarResultados() {
        const fs = require('fs');
        const path = require('path');
        
        const reporte = {
            timestamp: new Date().toISOString(),
            configuracion: SUPABASE_CONFIG.url,
            resultados: this.resultados,
            recomendaciones: this.generarRecomendaciones()
        };

        try {
            fs.writeFileSync(
                path.join(__dirname, 'reporte-rls-verificacion.json'),
                JSON.stringify(reporte, null, 2)
            );
            console.log('\n💾 Reporte guardado en: reporte-rls-verificacion.json');
        } catch (error) {
            console.log('⚠️  No se pudo guardar el reporte:', error.message);
        }
    }

    generarRecomendaciones() {
        const recomendaciones = [];
        
        if (this.resultados.tablas_sin_rls.length > 0) {
            recomendaciones.push({
                prioridad: 'CRITICA',
                accion: 'Habilitar RLS',
                tablas: this.resultados.tablas_sin_rls,
                comando_sql: 'ALTER TABLE tabla_name ENABLE ROW LEVEL SECURITY;'
            });
        }

        if (this.resultados.politicas_encontradas.length === 0) {
            recomendaciones.push({
                prioridad: 'ALTA',
                accion: 'Crear políticas básicas',
                descripcion: 'Implementar políticas de acceso por usuario'
            });
        }

        return recomendaciones;
    }
}

// Función principal
async function ejecutarVerificacionRLS() {
    console.log('🔒 VERIFICACIÓN DE POLÍTICAS RLS - SUPABASE');
    console.log('='.repeat(50));
    console.log('Proyecto: Misiones Arrienda');
    console.log('Fecha:', new Date().toLocaleString());
    console.log('URL Supabase:', SUPABASE_CONFIG.url);
    console.log('='.repeat(50) + '\n');

    const verificador = new VerificadorRLS();
    await verificador.verificarRLSCompleto();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    ejecutarVerificacionRLS().catch(console.error);
}

module.exports = { VerificadorRLS, ejecutarVerificacionRLS };
