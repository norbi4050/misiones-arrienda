const { createClient } = require('@supabase/supabase-js');

console.log('🔍 ANÁLISIS ESPECÍFICO - POLÍTICAS RLS UPDATE');
console.log('=' .repeat(60));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function analizarPoliticasRLSUpdate() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Objetivo: Identificar problemas en políticas UPDATE');
    console.log('');

    try {
        // =====================================================
        // PASO 1: OBTENER TODAS LAS POLÍTICAS RLS
        // =====================================================
        console.log('🔍 PASO 1: OBTENIENDO POLÍTICAS RLS ACTUALES');
        console.log('-'.repeat(50));

        const { data: todasPoliticas, error: errorPoliticas } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, roles, qual, with_check')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .order('cmd');

        if (errorPoliticas) {
            console.log('❌ ERROR obteniendo políticas:', errorPoliticas.message);
            return;
        }

        console.log(`📋 Total de políticas encontradas: ${todasPoliticas.length}`);
        console.log('');

        // Agrupar por comando
        const politicasPorComando = {};
        todasPoliticas.forEach(p => {
            if (!politicasPorComando[p.cmd]) {
                politicasPorComando[p.cmd] = [];
            }
            politicasPorComando[p.cmd].push(p);
        });

        // =====================================================
        // PASO 2: ANÁLISIS ESPECÍFICO DE POLÍTICAS UPDATE
        // =====================================================
        console.log('🔍 PASO 2: ANÁLISIS DE POLÍTICAS UPDATE');
        console.log('-'.repeat(50));

        const politicasUpdate = politicasPorComando['UPDATE'] || [];
        
        if (politicasUpdate.length === 0) {
            console.log('❌ PROBLEMA CRÍTICO: No hay políticas UPDATE');
            console.log('   └─ Esto impediría cualquier actualización de perfil');
            return;
        }

        console.log(`📊 Políticas UPDATE encontradas: ${politicasUpdate.length}`);
        console.log('');

        politicasUpdate.forEach((politica, index) => {
            console.log(`🛡️ POLÍTICA ${index + 1}: ${politica.policyname}`);
            console.log(`   └─ Roles: ${politica.roles}`);
            console.log(`   └─ USING: ${politica.qual || 'N/A'}`);
            console.log(`   └─ WITH CHECK: ${politica.with_check || 'N/A'}`);
            
            // Análisis de problemas potenciales
            const problemas = [];
            
            // Verificar si usa auth.uid() sin optimizar
            if (politica.qual && politica.qual.includes('auth.uid()') && !politica.qual.includes('( SELECT auth.uid()')) {
                problemas.push('USING no optimizado - puede causar warnings de performance');
            }
            
            if (politica.with_check && politica.with_check.includes('auth.uid()') && !politica.with_check.includes('( SELECT auth.uid()')) {
                problemas.push('WITH CHECK no optimizado - puede causar warnings de performance');
            }
            
            // Verificar conflictos en WITH CHECK
            if (politica.with_check && politica.with_check.includes('auth.uid()')) {
                problemas.push('WITH CHECK podría estar bloqueando updates si el usuario no coincide');
            }
            
            if (problemas.length > 0) {
                console.log('   ⚠️ PROBLEMAS DETECTADOS:');
                problemas.forEach(problema => {
                    console.log(`      └─ ${problema}`);
                });
            } else {
                console.log('   ✅ No se detectaron problemas evidentes');
            }
            
            console.log('');
        });

        // =====================================================
        // PASO 3: TEST DIRECTO DE UPDATE CON POLÍTICAS ACTUALES
        // =====================================================
        console.log('🔍 PASO 3: TEST DIRECTO DE UPDATE');
        console.log('-'.repeat(50));

        // Obtener estado actual
        const { data: estadoAntes, error: errorAntes } = await supabase
            .from('users')
            .select('name, phone, bio, updated_at')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (errorAntes) {
            console.log('❌ ERROR obteniendo estado antes:', errorAntes.message);
            return;
        }

        console.log('📊 Estado antes del update:');
        console.log(`   └─ Nombre: ${estadoAntes.name || 'null'}`);
        console.log(`   └─ Teléfono: ${estadoAntes.phone || 'null'}`);
        console.log(`   └─ Bio: ${estadoAntes.bio || 'null'}`);
        console.log(`   └─ Actualizado: ${estadoAntes.updated_at}`);

        // Intentar update
        const datosUpdate = {
            name: 'Test Análisis RLS',
            phone: '+54 376 123999',
            bio: 'Bio test análisis RLS',
            updated_at: new Date().toISOString()
        };

        console.log('');
        console.log('🔄 Ejecutando UPDATE...');

        const { data: resultadoUpdate, error: errorUpdate } = await supabase
            .from('users')
            .update(datosUpdate)
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .select('name, phone, bio, updated_at')
            .single();

        if (errorUpdate) {
            console.log('❌ ERROR en UPDATE:', errorUpdate.message);
            console.log(`   └─ Código: ${errorUpdate.code}`);
            console.log(`   └─ Detalles: ${errorUpdate.details}`);
            
            // Analizar el tipo de error
            if (errorUpdate.code === 'PGRST301') {
                console.log('   🔍 ANÁLISIS: Error PGRST301 - Política RLS bloqueando UPDATE');
                console.log('   💡 SOLUCIÓN: Revisar condiciones WITH CHECK en políticas UPDATE');
            } else if (errorUpdate.code === 'PGRST116') {
                console.log('   🔍 ANÁLISIS: Error PGRST116 - No se encontraron filas para actualizar');
                console.log('   💡 SOLUCIÓN: Revisar condiciones USING en políticas UPDATE');
            }
        } else {
            console.log('✅ UPDATE exitoso');
            console.log(`   └─ Nombre actualizado: ${resultadoUpdate.name}`);
            console.log(`   └─ Teléfono actualizado: ${resultadoUpdate.phone}`);
            console.log(`   └─ Bio actualizada: ${resultadoUpdate.bio}`);
            console.log(`   └─ Timestamp: ${resultadoUpdate.updated_at}`);
        }

        // =====================================================
        // PASO 4: VERIFICAR PERSISTENCIA
        // =====================================================
        console.log('');
        console.log('🔍 PASO 4: VERIFICANDO PERSISTENCIA');
        console.log('-'.repeat(50));

        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: estadoDespues, error: errorDespues } = await supabase
            .from('users')
            .select('name, phone, bio, updated_at')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (errorDespues) {
            console.log('❌ ERROR verificando persistencia:', errorDespues.message);
        } else {
            console.log('📊 Estado después del update:');
            console.log(`   └─ Nombre: ${estadoDespues.name || 'null'}`);
            console.log(`   └─ Teléfono: ${estadoDespues.phone || 'null'}`);
            console.log(`   └─ Bio: ${estadoDespues.bio || 'null'}`);
            console.log(`   └─ Actualizado: ${estadoDespues.updated_at}`);

            // Comparar con datos enviados
            const persistenciaCorrecta = 
                estadoDespues.name === datosUpdate.name &&
                estadoDespues.phone === datosUpdate.phone &&
                estadoDespues.bio === datosUpdate.bio;

            if (persistenciaCorrecta) {
                console.log('✅ PERSISTENCIA CORRECTA: Los datos se guardaron correctamente');
            } else {
                console.log('❌ PROBLEMA DE PERSISTENCIA: Los datos no se guardaron correctamente');
                
                // Comparación detallada
                console.log('');
                console.log('📊 COMPARACIÓN DETALLADA:');
                Object.keys(datosUpdate).forEach(key => {
                    if (key !== 'updated_at') {
                        const enviado = datosUpdate[key];
                        const guardado = estadoDespues[key];
                        const coincide = enviado === guardado;
                        console.log(`   └─ ${key}: ${coincide ? '✅' : '❌'} (Enviado: "${enviado}", Guardado: "${guardado}")`);
                    }
                });
            }
        }

        // =====================================================
        // PASO 5: RECOMENDACIONES
        // =====================================================
        console.log('');
        console.log('💡 RECOMENDACIONES BASADAS EN ANÁLISIS');
        console.log('='.repeat(60));

        if (politicasUpdate.length > 1) {
            console.log('⚠️ MÚLTIPLES POLÍTICAS UPDATE DETECTADAS');
            console.log('   └─ Esto puede causar conflictos o evaluaciones redundantes');
            console.log('   └─ Recomendación: Consolidar en una sola política optimizada');
        }

        const politicasNoOptimizadas = politicasUpdate.filter(p => 
            (p.qual && p.qual.includes('auth.uid()') && !p.qual.includes('( SELECT auth.uid()')) ||
            (p.with_check && p.with_check.includes('auth.uid()') && !p.with_check.includes('( SELECT auth.uid()'))
        );

        if (politicasNoOptimizadas.length > 0) {
            console.log('⚠️ POLÍTICAS NO OPTIMIZADAS DETECTADAS');
            console.log('   └─ Esto puede causar warnings de performance');
            console.log('   └─ Recomendación: Optimizar usando (select auth.uid())');
        }

        console.log('');
        console.log('✅ ANÁLISIS DE POLÍTICAS RLS COMPLETADO');

    } catch (error) {
        console.error('❌ Error en análisis:', error.message);
    }
}

// Ejecutar análisis
if (require.main === module) {
    analizarPoliticasRLSUpdate().catch(console.error);
}

module.exports = { analizarPoliticasRLSUpdate };
