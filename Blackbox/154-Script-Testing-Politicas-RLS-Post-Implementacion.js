/**
 * 🧪 SCRIPT TESTING POLÍTICAS RLS POST-IMPLEMENTACIÓN
 * ===================================================
 * 
 * Este script verifica que las políticas RLS se implementaron
 * correctamente y que la seguridad está funcionando como esperado.
 * 
 * TESTS INCLUIDOS:
 * - Verificación de RLS habilitado en todas las tablas
 * - Testing de acceso no autorizado (debe fallar)
 * - Verificación de políticas implementadas
 * - Testing de casos de uso válidos
 * - Auditoría de seguridad completa
 * 
 * Proyecto: Misiones Arrienda
 * Fecha: 21 Enero 2025
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE'
};

// Tablas críticas que deben tener RLS
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

class TestingRLS {
    constructor() {
        this.supabaseAdmin = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);
        this.supabaseAnon = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.resultados = {
            rls_habilitado: [],
            rls_deshabilitado: [],
            politicas_verificadas: [],
            tests_seguridad: [],
            errores: [],
            resumen: {}
        };
    }

    async ejecutarTestingCompleto() {
        console.log('🧪 INICIANDO TESTING DE POLÍTICAS RLS POST-IMPLEMENTACIÓN...\n');
        
        try {
            // 1. Verificar que RLS está habilitado
            await this.verificarRLSHabilitado();
            
            // 2. Verificar políticas implementadas
            await this.verificarPoliticasImplementadas();
            
            // 3. Testing de seguridad - acceso no autorizado
            await this.testingAccesoNoAutorizado();
            
            // 4. Testing de casos de uso válidos
            await this.testingCasosUsoValidos();
            
            // 5. Testing de Storage (imágenes)
            await this.testingStoragePolicies();
            
            // 6. Verificar funciones de utilidad
            await this.verificarFuncionesUtilidad();
            
            // 7. Generar reporte final
            this.generarReporteFinal();
            
        } catch (error) {
            console.error('❌ ERROR EN TESTING RLS:', error);
            this.resultados.errores.push({
                tipo: 'error_general',
                mensaje: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async verificarRLSHabilitado() {
        console.log('🔍 Verificando que RLS está habilitado en todas las tablas...\n');
        
        try {
            // Usar la función creada en el script SQL
            const { data, error } = await this.supabaseAdmin.rpc('verify_rls_implementation');
            
            if (error) {
                console.log('⚠️  No se pudo usar la función verify_rls_implementation, usando consulta directa...');
                
                // Consulta directa como fallback
                for (const tabla of TABLAS_CRITICAS) {
                    try {
                        const { data: rlsData, error: rlsError } = await this.supabaseAdmin
                            .from('pg_class')
                            .select('relname, relrowsecurity')
                            .eq('relname', tabla)
                            .single();

                        if (rlsError) {
                            console.log(`⚠️  Tabla '${tabla}': No encontrada`);
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
                            this.resultados.rls_habilitado.push(tabla);
                        } else {
                            console.log(`❌ Tabla '${tabla}': RLS DESHABILITADO - CRÍTICO`);
                            this.resultados.rls_deshabilitado.push(tabla);
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
            } else {
                // Procesar resultados de la función
                console.log('📊 Resultados de verificación RLS:');
                data.forEach(row => {
                    console.log(`   ${row.table_name}: RLS=${row.rls_enabled}, Políticas=${row.policies_count}`);
                    
                    if (row.rls_enabled) {
                        this.resultados.rls_habilitado.push(row.table_name);
                    } else {
                        this.resultados.rls_deshabilitado.push(row.table_name);
                    }
                    
                    this.resultados.politicas_verificadas.push({
                        tabla: row.table_name,
                        rls_habilitado: row.rls_enabled,
                        politicas_count: row.policies_count
                    });
                });
            }

        } catch (error) {
            console.log('❌ Error en verificación RLS:', error.message);
            this.resultados.errores.push({
                tipo: 'error_verificacion_rls',
                error: error.message
            });
        }
    }

    async verificarPoliticasImplementadas() {
        console.log('\n📋 Verificando políticas implementadas...\n');
        
        try {
            const { data: politicas, error } = await this.supabaseAdmin
                .from('pg_policies')
                .select('*')
                .in('tablename', TABLAS_CRITICAS);

            if (error) {
                console.log('❌ Error consultando políticas:', error.message);
                return;
            }

            if (politicas && politicas.length > 0) {
                console.log(`📊 Encontradas ${politicas.length} políticas implementadas:`);
                
                const politicasPorTabla = {};
                politicas.forEach(politica => {
                    if (!politicasPorTabla[politica.tablename]) {
                        politicasPorTabla[politica.tablename] = [];
                    }
                    politicasPorTabla[politica.tablename].push(politica);
                });

                Object.keys(politicasPorTabla).forEach(tabla => {
                    const count = politicasPorTabla[tabla].length;
                    console.log(`   ✅ ${tabla}: ${count} políticas`);
                    
                    politicasPorTabla[tabla].forEach(pol => {
                        console.log(`      - ${pol.policyname} (${pol.cmd})`);
                    });
                });

                this.resultados.politicas_verificadas = politicasPorTabla;
            } else {
                console.log('❌ NO SE ENCONTRARON POLÍTICAS - CRÍTICO');
                this.resultados.errores.push({
                    tipo: 'sin_politicas',
                    mensaje: 'No se encontraron políticas implementadas'
                });
            }

        } catch (error) {
            console.log('❌ Error verificando políticas:', error.message);
            this.resultados.errores.push({
                tipo: 'error_verificacion_politicas',
                error: error.message
            });
        }
    }

    async testingAccesoNoAutorizado() {
        console.log('\n🚨 TESTING DE ACCESO NO AUTORIZADO (DEBE FALLAR)...\n');
        
        const tablasProbar = ['users', 'profiles', 'payments', 'messages', 'payment_methods'];
        
        for (const tabla of tablasProbar) {
            try {
                console.log(`🔍 Probando acceso no autorizado a tabla '${tabla}'...`);
                
                const { data, error } = await this.supabaseAnon
                    .from(tabla)
                    .select('*')
                    .limit(1);

                if (error) {
                    if (error.code === 'PGRST116' || error.message.includes('permission denied') || 
                        error.message.includes('RLS') || error.message.includes('policy')) {
                        console.log(`   ✅ CORRECTO: Acceso bloqueado por RLS`);
                        this.resultados.tests_seguridad.push({
                            tabla,
                            test: 'acceso_no_autorizado',
                            resultado: 'BLOQUEADO',
                            estado: 'CORRECTO'
                        });
                    } else {
                        console.log(`   ⚠️  Error inesperado: ${error.message}`);
                        this.resultados.tests_seguridad.push({
                            tabla,
                            test: 'acceso_no_autorizado',
                            resultado: 'ERROR_INESPERADO',
                            estado: 'REVISAR',
                            error: error.message
                        });
                    }
                } else {
                    console.log(`   🚨 CRÍTICO: ACCESO PERMITIDO - DATOS EXPUESTOS`);
                    console.log(`   Registros accesibles: ${data ? data.length : 0}`);
                    
                    this.resultados.tests_seguridad.push({
                        tabla,
                        test: 'acceso_no_autorizado',
                        resultado: 'ACCESO_PERMITIDO',
                        estado: 'CRÍTICO',
                        datos_expuestos: data ? data.length : 0
                    });
                }

            } catch (error) {
                console.log(`   ❌ Error en test de '${tabla}':`, error.message);
                this.resultados.errores.push({
                    tabla,
                    tipo: 'error_test_seguridad',
                    error: error.message
                });
            }
        }
    }

    async testingCasosUsoValidos() {
        console.log('\n✅ TESTING DE CASOS DE USO VÁLIDOS...\n');
        
        try {
            // Test 1: Verificar que propiedades públicas son accesibles
            console.log('🔍 Test 1: Acceso a propiedades públicas...');
            const { data: propiedades, error: errorProps } = await this.supabaseAnon
                .from('properties')
                .select('id, title, status')
                .eq('status', 'AVAILABLE')
                .limit(5);

            if (errorProps) {
                console.log(`   ⚠️  Error accediendo propiedades públicas: ${errorProps.message}`);
                this.resultados.tests_seguridad.push({
                    test: 'propiedades_publicas',
                    resultado: 'ERROR',
                    error: errorProps.message
                });
            } else {
                console.log(`   ✅ Propiedades públicas accesibles: ${propiedades ? propiedades.length : 0} encontradas`);
                this.resultados.tests_seguridad.push({
                    test: 'propiedades_publicas',
                    resultado: 'ACCESIBLE',
                    estado: 'CORRECTO',
                    registros: propiedades ? propiedades.length : 0
                });
            }

            // Test 2: Verificar que perfiles de comunidad activos son accesibles
            console.log('🔍 Test 2: Acceso a perfiles de comunidad activos...');
            const { data: perfiles, error: errorPerfiles } = await this.supabaseAnon
                .from('user_profiles')
                .select('id, role, city')
                .eq('isSuspended', false)
                .limit(5);

            if (errorPerfiles) {
                console.log(`   ⚠️  Error accediendo perfiles de comunidad: ${errorPerfiles.message}`);
                this.resultados.tests_seguridad.push({
                    test: 'perfiles_comunidad_activos',
                    resultado: 'ERROR',
                    error: errorPerfiles.message
                });
            } else {
                console.log(`   ✅ Perfiles de comunidad activos accesibles: ${perfiles ? perfiles.length : 0} encontrados`);
                this.resultados.tests_seguridad.push({
                    test: 'perfiles_comunidad_activos',
                    resultado: 'ACCESIBLE',
                    estado: 'CORRECTO',
                    registros: perfiles ? perfiles.length : 0
                });
            }

            // Test 3: Verificar que reseñas públicas son accesibles
            console.log('🔍 Test 3: Acceso a reseñas públicas verificadas...');
            const { data: reviews, error: errorReviews } = await this.supabaseAnon
                .from('user_reviews')
                .select('id, rating, comment')
                .eq('verified', true)
                .limit(5);

            if (errorReviews) {
                console.log(`   ⚠️  Error accediendo reseñas públicas: ${errorReviews.message}`);
                this.resultados.tests_seguridad.push({
                    test: 'reviews_publicas',
                    resultado: 'ERROR',
                    error: errorReviews.message
                });
            } else {
                console.log(`   ✅ Reseñas públicas accesibles: ${reviews ? reviews.length : 0} encontradas`);
                this.resultados.tests_seguridad.push({
                    test: 'reviews_publicas',
                    resultado: 'ACCESIBLE',
                    estado: 'CORRECTO',
                    registros: reviews ? reviews.length : 0
                });
            }

        } catch (error) {
            console.log('❌ Error en testing de casos válidos:', error.message);
            this.resultados.errores.push({
                tipo: 'error_casos_validos',
                error: error.message
            });
        }
    }

    async testingStoragePolicies() {
        console.log('\n📁 TESTING DE POLÍTICAS DE STORAGE...\n');
        
        try {
            // Verificar buckets creados
            const { data: buckets, error: errorBuckets } = await this.supabaseAdmin.storage.listBuckets();
            
            if (errorBuckets) {
                console.log('❌ Error listando buckets:', errorBuckets.message);
                return;
            }

            const bucketsEsperados = ['property-images', 'avatars'];
            const bucketsEncontrados = buckets.map(b => b.name);
            
            console.log('📊 Buckets de storage encontrados:');
            bucketsEsperados.forEach(bucket => {
                if (bucketsEncontrados.includes(bucket)) {
                    console.log(`   ✅ Bucket '${bucket}': Encontrado`);
                    this.resultados.tests_seguridad.push({
                        test: `bucket_${bucket}`,
                        resultado: 'ENCONTRADO',
                        estado: 'CORRECTO'
                    });
                } else {
                    console.log(`   ❌ Bucket '${bucket}': NO ENCONTRADO`);
                    this.resultados.tests_seguridad.push({
                        test: `bucket_${bucket}`,
                        resultado: 'NO_ENCONTRADO',
                        estado: 'ERROR'
                    });
                }
            });

            // Test de acceso a storage sin autenticación
            console.log('\n🔍 Testing acceso a storage sin autenticación...');
            
            for (const bucket of bucketsEsperados) {
                if (bucketsEncontrados.includes(bucket)) {
                    try {
                        const { data: files, error: errorFiles } = await this.supabaseAnon.storage
                            .from(bucket)
                            .list('', { limit: 1 });

                        if (errorFiles) {
                            if (errorFiles.message.includes('permission') || errorFiles.message.includes('policy')) {
                                console.log(`   ✅ Bucket '${bucket}': Acceso controlado por políticas`);
                                this.resultados.tests_seguridad.push({
                                    test: `storage_access_${bucket}`,
                                    resultado: 'ACCESO_CONTROLADO',
                                    estado: 'CORRECTO'
                                });
                            } else {
                                console.log(`   ⚠️  Bucket '${bucket}': Error inesperado: ${errorFiles.message}`);
                                this.resultados.tests_seguridad.push({
                                    test: `storage_access_${bucket}`,
                                    resultado: 'ERROR_INESPERADO',
                                    estado: 'REVISAR',
                                    error: errorFiles.message
                                });
                            }
                        } else {
                            console.log(`   ✅ Bucket '${bucket}': Acceso público permitido (correcto para imágenes)`);
                            this.resultados.tests_seguridad.push({
                                test: `storage_access_${bucket}`,
                                resultado: 'ACCESO_PUBLICO',
                                estado: 'CORRECTO'
                            });
                        }
                    } catch (error) {
                        console.log(`   ❌ Error testing bucket '${bucket}':`, error.message);
                    }
                }
            }

        } catch (error) {
            console.log('❌ Error en testing de storage:', error.message);
            this.resultados.errores.push({
                tipo: 'error_storage_testing',
                error: error.message
            });
        }
    }

    async verificarFuncionesUtilidad() {
        console.log('\n🔧 VERIFICANDO FUNCIONES DE UTILIDAD...\n');
        
        const funcionesEsperadas = [
            'verify_rls_implementation',
            'is_property_owner',
            'is_conversation_participant'
        ];

        for (const funcion of funcionesEsperadas) {
            try {
                console.log(`🔍 Verificando función '${funcion}'...`);
                
                // Intentar ejecutar la función con parámetros de prueba
                let resultado;
                switch (funcion) {
                    case 'verify_rls_implementation':
                        resultado = await this.supabaseAdmin.rpc(funcion);
                        break;
                    case 'is_property_owner':
                        resultado = await this.supabaseAdmin.rpc(funcion, {
                            property_id: 'test-id',
                            user_id: 'test-user'
                        });
                        break;
                    case 'is_conversation_participant':
                        resultado = await this.supabaseAdmin.rpc(funcion, {
                            conversation_id: 'test-id',
                            user_id: 'test-user'
                        });
                        break;
                }

                if (resultado.error) {
                    if (resultado.error.message.includes('does not exist')) {
                        console.log(`   ❌ Función '${funcion}': NO ENCONTRADA`);
                        this.resultados.tests_seguridad.push({
                            test: `funcion_${funcion}`,
                            resultado: 'NO_ENCONTRADA',
                            estado: 'ERROR'
                        });
                    } else {
                        console.log(`   ✅ Función '${funcion}': Existe (error esperado con datos de prueba)`);
                        this.resultados.tests_seguridad.push({
                            test: `funcion_${funcion}`,
                            resultado: 'ENCONTRADA',
                            estado: 'CORRECTO'
                        });
                    }
                } else {
                    console.log(`   ✅ Función '${funcion}': Ejecutada correctamente`);
                    this.resultados.tests_seguridad.push({
                        test: `funcion_${funcion}`,
                        resultado: 'EJECUTADA',
                        estado: 'CORRECTO'
                    });
                }

            } catch (error) {
                console.log(`   ❌ Error verificando función '${funcion}':`, error.message);
                this.resultados.errores.push({
                    funcion,
                    tipo: 'error_verificacion_funcion',
                    error: error.message
                });
            }
        }
    }

    generarReporteFinal() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 REPORTE FINAL - TESTING POLÍTICAS RLS');
        console.log('='.repeat(80));
        
        // Calcular métricas
        const totalTablas = TABLAS_CRITICAS.length;
        const tablasConRLS = this.resultados.rls_habilitado.length;
        const tablasSinRLS = this.resultados.rls_deshabilitado.length;
        const totalTests = this.resultados.tests_seguridad.length;
        const testsExitosos = this.resultados.tests_seguridad.filter(t => t.estado === 'CORRECTO').length;
        const testsCriticos = this.resultados.tests_seguridad.filter(t => t.estado === 'CRÍTICO').length;
        
        this.resultados.resumen = {
            total_tablas: totalTablas,
            tablas_con_rls: tablasConRLS,
            tablas_sin_rls: tablasSinRLS,
            porcentaje_rls: Math.round((tablasConRLS / totalTablas) * 100),
            total_tests: totalTests,
            tests_exitosos: testsExitosos,
            tests_criticos: testsCriticos,
            porcentaje_exito: Math.round((testsExitosos / totalTests) * 100),
            errores_totales: this.resultados.errores.length
        };

        console.log('\n🎯 RESUMEN EJECUTIVO:');
        console.log(`   📊 Tablas con RLS: ${tablasConRLS}/${totalTablas} (${this.resultados.resumen.porcentaje_rls}%)`);
        console.log(`   🧪 Tests exitosos: ${testsExitosos}/${totalTests} (${this.resultados.resumen.porcentaje_exito}%)`);
        console.log(`   🚨 Tests críticos: ${testsCriticos}`);
        console.log(`   ❌ Errores encontrados: ${this.resultados.resumen.errores_totales}`);

        // Estado general
        let estadoGeneral = 'EXCELENTE';
        if (tablasSinRLS > 0 || testsCriticos > 0) {
            estadoGeneral = 'CRÍTICO';
        } else if (this.resultados.resumen.porcentaje_exito < 90) {
            estadoGeneral = 'NECESITA MEJORAS';
        } else if (this.resultados.resumen.porcentaje_exito < 100) {
            estadoGeneral = 'BUENO';
        }

        console.log(`\n🏆 ESTADO GENERAL DE SEGURIDAD: ${estadoGeneral}`);

        // Detalles críticos
        if (tablasSinRLS > 0) {
            console.log('\n🚨 TABLAS SIN RLS (CRÍTICO):');
            this.resultados.rls_deshabilitado.forEach(tabla => {
                console.log(`   ❌ ${tabla}`);
            });
        }

        if (testsCriticos > 0) {
            console.log('\n🚨 TESTS CRÍTICOS FALLIDOS:');
            this.resultados.tests_seguridad
                .filter(t => t.estado === 'CRÍTICO')
                .forEach(test => {
                    console.log(`   ❌ ${test.test || test.tabla}: ${test.resultado}`);
                    if (test.datos_expuestos) {
                        console.log(`      Datos expuestos: ${test.datos_expuestos} registros`);
                    }
                });
        }

        // Recomendaciones
        console.log('\n💡 RECOMENDACIONES:');
        if (tablasSinRLS > 0) {
            console.log('   1. 🚨 URGENTE: Habilitar RLS en tablas faltantes');
            console.log('   2. 🔒 Crear políticas para tablas sin protección');
        }
        if (testsCriticos > 0) {
            console.log('   3. 🛡️  Revisar políticas que permiten acceso no autorizado');
            console.log('   4. 🔍 Auditar datos expuestos públicamente');
        }
        if (this.resultados.resumen.errores_totales > 0) {
            console.log('   5. 🔧 Corregir errores de configuración encontrados');
        }

        console.log('\n📅 Próximos pasos:');
        if (estadoGeneral === 'CRÍTICO') {
            console.log('   1. Corregir problemas críticos inmediatamente');
            console.log('   2. Re-ejecutar testing después de correcciones');
            console.log('   3. Implementar monitoreo continuo');
        } else {
            console.log('   1. Monitoreo continuo de seguridad');
            console.log('   2. Testing periódico de políticas');
            console.log('   3. Auditorías de seguridad regulares');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log(`✅ Testing completado: ${new Date().toLocaleString()}`);
        console.log('='.repeat(80));

        // Guardar resultados
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
                path.join(__dirname, 'reporte-testing-rls-post-implementacion.json'),
                JSON.stringify(reporte, null, 2)
            );
            console.log('\n💾 Reporte guardado en: reporte-testing-rls-post-implementacion.json');
        } catch (error) {
            console.log('⚠️  No se pudo guardar el reporte:', error.message);
        }
    }

    generarRecomendaciones() {
        const recomendaciones = [];
        
        if (this.resultados.rls_deshabilitado.length > 0) {
            recomendaciones.push({
                prioridad: 'CRÍTICA',
                accion: 'Habilitar RLS en tablas faltantes',
                tablas: this.resultados.rls_deshabilitado,
                comando_sql: 'ALTER TABLE tabla_name ENABLE ROW LEVEL SECURITY;'
            });
        }

        const testsCriticos = this.resultados.tests_seguridad.filter(t => t.estado === 'CRÍTICO');
        if (testsCriticos.length > 0) {
            recomendaciones.push({
                prioridad: 'CRÍTICA',
                accion: 'Revisar políticas que permiten acceso no autorizado',
                tests_fallidos: testsCriticos
            });
        }

        if (this.resultados.resumen.porcentaje_exito < 100) {
            recomendaciones.push({
                prioridad: 'ALTA',
                accion: 'Mejorar configuración de políticas',
                descripcion: 'Revisar y ajustar políticas para casos de uso específicos'
            });
        }

        return recomendaciones;
    }
}

// Función principal
async function ejecutarTestingRLS() {
    console.log('🧪 TESTING DE POLÍTICAS RLS POST-IMPLEMENTACIÓN');
    console.log('='.repeat(50));
    console.log('Proyecto: Misiones Arrienda');
    console.log('Fecha:', new Date().toLocaleString());
    console.log('URL Supabase:', SUPABASE_CONFIG.url);
    console.log('='.repeat(50) + '\n');

    const testing = new TestingRLS();
    await testing.ejecutarTestingCompleto();
}

// Ejecutar si
