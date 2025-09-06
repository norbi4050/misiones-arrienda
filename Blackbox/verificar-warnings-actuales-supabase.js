// =====================================================
// VERIFICACIÓN DIRECTA: WARNINGS ACTUALES EN SUPABASE
// =====================================================
// Fecha: 2025-01-27
// Objetivo: Verificar exactamente qué warnings están presentes
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verificarWarningsActuales() {
    console.log('🔍 VERIFICANDO WARNINGS ACTUALES EN SUPABASE');
    console.log('=' .repeat(50));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('=' .repeat(50));
    console.log('');

    try {
        // ====================================================================
        console.log('📋 PASO 1: VERIFICAR POLÍTICAS MÚLTIPLES ACTUALES');
        console.log('-'.repeat(40));

        const { data: politicasMultiples, error: politicasError } = await supabase.rpc('sql', {
            query: `
                SELECT 
                    schemaname,
                    tablename,
                    cmd,
                    COUNT(*) as policy_count,
                    array_agg(policyname) as policy_names,
                    array_agg(roles) as all_roles
                FROM pg_policies 
                WHERE schemaname = 'public'
                GROUP BY schemaname, tablename, cmd
                ORDER BY tablename, cmd;
            `
        });

        if (politicasError) {
            console.log('❌ Error obteniendo políticas:', politicasError.message);
        } else {
            console.log(`📊 Total de grupos de políticas: ${politicasMultiples.length}`);
            
            let warningsMultiples = 0;
            politicasMultiples.forEach(pol => {
                if (pol.policy_count > 1) {
                    warningsMultiples++;
                    console.log(`⚠️ MÚLTIPLES POLÍTICAS DETECTADAS:`);
                    console.log(`   📋 Tabla: ${pol.tablename}`);
                    console.log(`   🔧 Acción: ${pol.cmd}`);
                    console.log(`   📊 Cantidad: ${pol.policy_count}`);
                    console.log(`   📝 Políticas: ${pol.policy_names.join(', ')}`);
                    console.log(`   👥 Roles: ${pol.all_roles.join(', ')}`);
                    console.log('');
                }
            });

            if (warningsMultiples === 0) {
                console.log('✅ No se encontraron políticas múltiples');
            } else {
                console.log(`🚨 TOTAL WARNINGS MÚLTIPLES: ${warningsMultiples}`);
            }
        }

        console.log('');

        // ====================================================================
        console.log('📋 PASO 2: VERIFICAR ÍNDICES DUPLICADOS ACTUALES');
        console.log('-'.repeat(40));

        const { data: indicesDuplicados, error: indicesError } = await supabase.rpc('sql', {
            query: `
                SELECT 
                    schemaname,
                    tablename,
                    indexdef,
                    COUNT(*) as index_count,
                    array_agg(indexname) as index_names
                FROM pg_indexes 
                WHERE schemaname = 'public'
                GROUP BY schemaname, tablename, indexdef
                HAVING COUNT(*) > 1
                ORDER BY tablename;
            `
        });

        if (indicesError) {
            console.log('❌ Error obteniendo índices:', indicesError.message);
        } else {
            if (indicesDuplicados.length === 0) {
                console.log('✅ No se encontraron índices duplicados');
            } else {
                console.log(`🚨 ÍNDICES DUPLICADOS ENCONTRADOS: ${indicesDuplicados.length}`);
                indicesDuplicados.forEach(idx => {
                    console.log(`⚠️ ÍNDICES DUPLICADOS:`);
                    console.log(`   📋 Tabla: ${idx.tablename}`);
                    console.log(`   📊 Cantidad: ${idx.index_count}`);
                    console.log(`   📝 Índices: ${idx.index_names.join(', ')}`);
                    console.log(`   🔧 Definición: ${idx.indexdef}`);
                    console.log('');
                });
            }
        }

        console.log('');

        // ====================================================================
        console.log('📋 PASO 3: VERIFICAR TABLAS EXISTENTES');
        console.log('-'.repeat(40));

        const tablasVerificar = ['users', 'favorites', 'properties', 'property_inquiries'];
        
        for (const tabla of tablasVerificar) {
            const { data: existeTabla, error: tablaError } = await supabase.rpc('sql', {
                query: `
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '${tabla}'
                    ) as existe;
                `
            });

            if (tablaError) {
                console.log(`❌ Error verificando tabla ${tabla}:`, tablaError.message);
            } else {
                const existe = existeTabla[0].existe;
                console.log(`${existe ? '✅' : '❌'} Tabla ${tabla}: ${existe ? 'EXISTE' : 'NO EXISTE'}`);
                
                if (existe) {
                    // Contar políticas de esta tabla
                    const { data: politicasTabla, error: polError } = await supabase.rpc('sql', {
                        query: `
                            SELECT COUNT(*) as total_policies
                            FROM pg_policies 
                            WHERE schemaname = 'public' AND tablename = '${tabla}';
                        `
                    });

                    if (!polError) {
                        console.log(`   📊 Políticas: ${politicasTabla[0].total_policies}`);
                    }
                }
            }
        }

        console.log('');

        // ====================================================================
        console.log('📋 PASO 4: RESUMEN DE WARNINGS ACTUALES');
        console.log('-'.repeat(40));

        const totalWarnings = warningsMultiples + (indicesDuplicados ? indicesDuplicados.length : 0);
        
        console.log(`🚨 RESUMEN FINAL:`);
        console.log(`   ⚠️ Políticas múltiples: ${warningsMultiples}`);
        console.log(`   ⚠️ Índices duplicados: ${indicesDuplicados ? indicesDuplicados.length : 0}`);
        console.log(`   📊 Total warnings: ${totalWarnings}`);

        if (totalWarnings > 0) {
            console.log('');
            console.log('🔧 ACCIÓN REQUERIDA: Los warnings aún están presentes');
            console.log('💡 Necesitamos aplicar una solución más específica');
        } else {
            console.log('');
            console.log('✅ ÉXITO: No se encontraron warnings');
        }

        console.log('');
        console.log('✅ VERIFICACIÓN COMPLETADA');

        // Guardar resultados
        const fs = require('fs');
        const resultado = {
            timestamp: new Date().toISOString(),
            warningsMultiples: warningsMultiples,
            indicesDuplicados: indicesDuplicados ? indicesDuplicados.length : 0,
            totalWarnings: totalWarnings,
            detalles: {
                politicasMultiples: politicasMultiples,
                indicesDuplicados: indicesDuplicados
            }
        };

        fs.writeFileSync('Blackbox/WARNINGS-ACTUALES-SUPABASE.json', JSON.stringify(resultado, null, 2));
        console.log('📄 Reporte guardado en: Blackbox/WARNINGS-ACTUALES-SUPABASE.json');

        return resultado;

    } catch (error) {
        console.log('❌ ERROR DURANTE LA VERIFICACIÓN:', error.message);
        return null;
    }
}

// Ejecutar verificación
if (require.main === module) {
    verificarWarningsActuales().catch(console.error);
}

module.exports = { verificarWarningsActuales };
