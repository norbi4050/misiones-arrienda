const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// 🔍 DIAGNÓSTICO SIMPLE DE POLÍTICAS RLS EN SUPABASE
// ============================================================================
// 
// Este script hace un diagnóstico básico de las políticas RLS existentes
// usando métodos alternativos cuando el Service Role Key no funciona
//
// Fecha: 2025-01-04
// Estado: DIAGNÓSTICO BÁSICO
// ============================================================================

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzcyNjQsImV4cCI6MjA1MTUxMzI2NH0.wQFJpHdnYFJJdLJZKJQXJQXJQXJQXJQXJQXJQXJQXJQ';

async function diagnosticoPoliciesSimple() {
    console.log('🔍 INICIANDO DIAGNÓSTICO SIMPLE DE POLÍTICAS RLS');
    console.log('='.repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('='.repeat(60));
    console.log('');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // ====================================================================
        // 🔍 PASO 1: PROBAR ACCESO A TABLAS CRÍTICAS
        // ====================================================================
        console.log('🔍 PASO 1: PROBANDO ACCESO A TABLAS CRÍTICAS');
        console.log('='.repeat(40));

        const tablasCriticas = [
            { nombre: 'users', descripcion: 'Tabla de usuarios' },
            { nombre: 'profiles', descripcion: 'Perfiles de usuarios' },
            { nombre: 'properties', descripcion: 'Propiedades inmobiliarias' },
            { nombre: 'community_profiles', descripcion: 'Perfiles de comunidad' }
        ];

        const resultadosAcceso = [];

        for (const tabla of tablasCriticas) {
            console.log(`🔍 Probando acceso a: ${tabla.nombre}`);
            
            try {
                // Intentar SELECT sin autenticación
                const { data, error, count } = await supabase
                    .from(tabla.nombre)
                    .select('*', { count: 'exact' })
                    .limit(1);

                if (error) {
                    if (error.code === 'PGRST116') {
                        console.log(`   ❌ Tabla ${tabla.nombre} NO EXISTE`);
                        resultadosAcceso.push({
                            tabla: tabla.nombre,
                            existe: false,
                            accesible: false,
                            error: 'Tabla no existe'
                        });
                    } else if (error.code === '42501' || error.message.includes('permission denied')) {
                        console.log(`   🔒 Tabla ${tabla.nombre} EXISTE pero RLS ACTIVO (sin políticas públicas)`);
                        resultadosAcceso.push({
                            tabla: tabla.nombre,
                            existe: true,
                            accesible: false,
                            error: 'RLS activo - sin acceso público'
                        });
                    } else {
                        console.log(`   ⚠️ Error en ${tabla.nombre}: ${error.message}`);
                        resultadosAcceso.push({
                            tabla: tabla.nombre,
                            existe: true,
                            accesible: false,
                            error: error.message
                        });
                    }
                } else {
                    console.log(`   ✅ Tabla ${tabla.nombre} ACCESIBLE - Registros: ${count || 0}`);
                    resultadosAcceso.push({
                        tabla: tabla.nombre,
                        existe: true,
                        accesible: true,
                        registros: count || 0
                    });
                }
            } catch (error) {
                console.log(`   ❌ Error probando ${tabla.nombre}: ${error.message}`);
                resultadosAcceso.push({
                    tabla: tabla.nombre,
                    existe: false,
                    accesible: false,
                    error: error.message
                });
            }

            console.log('');
        }

        // ====================================================================
        // 🔍 PASO 2: PROBAR OPERACIONES DE ESCRITURA
        // ====================================================================
        console.log('🔍 PASO 2: PROBANDO OPERACIONES DE ESCRITURA');
        console.log('='.repeat(40));

        // Probar INSERT en tabla users (común para registro)
        console.log('🔍 Probando INSERT en tabla users...');
        try {
            const { data, error } = await supabase
                .from('users')
                .insert({
                    email: 'test@example.com',
                    name: 'Test User'
                })
                .select();

            if (error) {
                if (error.code === '42501') {
                    console.log('   🔒 INSERT en users BLOQUEADO por RLS (esperado)');
                } else {
                    console.log(`   ⚠️ Error INSERT users: ${error.message}`);
                }
            } else {
                console.log('   ⚠️ INSERT en users PERMITIDO (posible problema de seguridad)');
            }
        } catch (error) {
            console.log(`   ❌ Error probando INSERT: ${error.message}`);
        }

        // ====================================================================
        // 🔍 PASO 3: ANÁLISIS DE RESULTADOS
        // ====================================================================
        console.log('');
        console.log('📊 ANÁLISIS DE RESULTADOS');
        console.log('='.repeat(40));

        const tablasExistentes = resultadosAcceso.filter(r => r.existe);
        const tablasAccesibles = resultadosAcceso.filter(r => r.accesible);
        const tablasBloqueadas = resultadosAcceso.filter(r => r.existe && !r.accesible);

        console.log(`📋 Tablas encontradas: ${tablasExistentes.length}/${tablasCriticas.length}`);
        console.log(`🔓 Tablas accesibles públicamente: ${tablasAccesibles.length}`);
        console.log(`🔒 Tablas con RLS activo: ${tablasBloqueadas.length}`);

        console.log('');
        console.log('📋 DETALLE POR TABLA:');
        resultadosAcceso.forEach(resultado => {
            const status = resultado.existe 
                ? (resultado.accesible ? '🔓 PÚBLICO' : '🔒 RLS ACTIVO')
                : '❌ NO EXISTE';
            
            console.log(`   ${resultado.tabla}: ${status}`);
            if (resultado.error) {
                console.log(`      └─ Error: ${resultado.error}`);
            }
            if (resultado.registros !== undefined) {
                console.log(`      └─ Registros: ${resultado.registros}`);
            }
        });

        // ====================================================================
        // 🔍 PASO 4: RECOMENDACIONES
        // ====================================================================
        console.log('');
        console.log('💡 RECOMENDACIONES BASADAS EN DIAGNÓSTICO');
        console.log('='.repeat(40));

        const problemas = [];
        const soluciones = [];

        // Verificar si las tablas críticas existen
        const tablasNoExisten = tablasCriticas.filter(t => 
            !resultadosAcceso.find(r => r.tabla === t.nombre && r.existe)
        );

        if (tablasNoExisten.length > 0) {
            problemas.push(`❌ Tablas faltantes: ${tablasNoExisten.map(t => t.nombre).join(', ')}`);
            soluciones.push('🔧 Crear las tablas faltantes en Supabase');
        }

        // Verificar tablas públicas (posible problema de seguridad)
        if (tablasAccesibles.length > 0) {
            problemas.push(`⚠️ Tablas accesibles públicamente: ${tablasAccesibles.map(r => r.tabla).join(', ')}`);
            soluciones.push('🔧 Activar RLS y crear políticas apropiadas');
        }

        // Verificar tablas con RLS pero sin políticas
        if (tablasBloqueadas.length > 0) {
            const tablasSinPoliticas = tablasBloqueadas.filter(r => 
                r.error && r.error.includes('permission denied')
            );
            
            if (tablasSinPoliticas.length > 0) {
                problemas.push(`🔒 Tablas con RLS pero sin políticas: ${tablasSinPoliticas.map(r => r.tabla).join(', ')}`);
                soluciones.push('🔧 Crear políticas RLS para permitir acceso autorizado');
            }
        }

        console.log('🚨 PROBLEMAS IDENTIFICADOS:');
        if (problemas.length === 0) {
            console.log('   ✅ No se identificaron problemas críticos');
        } else {
            problemas.forEach(problema => {
                console.log(`   ${problema}`);
            });
        }

        console.log('');
        console.log('🔧 SOLUCIONES RECOMENDADAS:');
        if (soluciones.length === 0) {
            console.log('   ✅ No se requieren acciones inmediatas');
        } else {
            soluciones.forEach(solucion => {
                console.log(`   ${solucion}`);
            });
        }

        // ====================================================================
        // 🔍 PASO 5: PRÓXIMOS PASOS
        // ====================================================================
        console.log('');
        console.log('🎯 PRÓXIMOS PASOS RECOMENDADOS');
        console.log('='.repeat(40));

        console.log('1. 🔑 Verificar Service Role Key en Supabase Dashboard');
        console.log('2. 📋 Revisar esquema de base de datos en Table Editor');
        console.log('3. 🛡️ Configurar políticas RLS según necesidades del proyecto');
        console.log('4. 🧪 Probar registro de usuarios con credenciales reales');
        console.log('5. 📊 Implementar auditoría completa con Service Role Key válido');

        console.log('');
        console.log('✅ DIAGNÓSTICO SIMPLE COMPLETADO');

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error.message);
        console.log('');
        console.log('🔧 POSIBLES SOLUCIONES:');
        console.log('   1. Verificar que Supabase esté configurado correctamente');
        console.log('   2. Comprobar las credenciales en el archivo .env');
        console.log('   3. Revisar la conectividad de red');
        console.log('   4. Verificar que el proyecto Supabase esté activo');
    }
}

// Ejecutar diagnóstico
diagnosticoPoliciesSimple().catch(console.error);
