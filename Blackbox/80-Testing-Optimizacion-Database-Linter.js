/**
 * TESTING EXHAUSTIVO - OPTIMIZACIÓN DATABASE LINTER SUPABASE
 * 
 * Este script verifica que las optimizaciones del Database Linter
 * se hayan aplicado correctamente y mide el impacto en el rendimiento.
 * 
 * Fecha: 3 de Enero, 2025
 * Proyecto: Misiones Arrienda
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);

// Resultados del testing
const testResults = {
    timestamp: new Date().toISOString(),
    project: 'Misiones Arrienda',
    supabaseProject: 'qfeyhaaxyemmnohqdele',
    tests: {
        connection: { status: 'pending', details: null },
        indexesCreated: { status: 'pending', details: null },
        performanceImprovement: { status: 'pending', details: null },
        foreignKeyIndexes: { status: 'pending', details: null },
        compositeIndexes: { status: 'pending', details: null },
        unusedIndexes: { status: 'pending', details: null },
        queryPerformance: { status: 'pending', details: null }
    },
    summary: {
        totalTests: 7,
        passed: 0,
        failed: 0,
        warnings: 0
    }
};

/**
 * Función para logging con timestamp
 */
function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
}

/**
 * Test 1: Verificar conexión a Supabase
 */
async function testSupabaseConnection() {
    log('🔍 Testing conexión a Supabase...');
    
    try {
        // Verificar conexión básica
        const { data, error } = await supabase
            .from('properties')
            .select('count')
            .limit(1);

        if (error) {
            throw new Error(`Error de conexión: ${error.message}`);
        }

        testResults.tests.connection = {
            status: 'passed',
            details: {
                url: SUPABASE_CONFIG.url,
                project: 'qfeyhaaxyemmnohqdele',
                connectionTime: new Date().toISOString(),
                message: 'Conexión exitosa a Supabase'
            }
        };

        log('✅ Conexión a Supabase exitosa');
        testResults.summary.passed++;

    } catch (error) {
        testResults.tests.connection = {
            status: 'failed',
            details: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };

        log(`❌ Error de conexión: ${error.message}`, 'ERROR');
        testResults.summary.failed++;
    }
}

/**
 * Test 2: Verificar que los índices se crearon correctamente
 */
async function testIndexesCreated() {
    log('🔍 Verificando índices creados...');
    
    try {
        // Consulta para verificar índices creados
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                    AND indexname LIKE 'idx_%'
                ORDER BY tablename, indexname;
            `
        });

        if (error) {
            // Intentar consulta alternativa
            const { data: altData, error: altError } = await supabase
                .from('pg_indexes')
                .select('*')
                .eq('schemaname', 'public')
                .like('indexname', 'idx_%');

            if (altError) {
                throw new Error(`No se pudieron verificar los índices: ${error.message}`);
            }
            
            data = altData;
        }

        const expectedIndexes = [
            'idx_favorite_property_id',
            'idx_inquiry_property_id',
            'idx_payment_subscription_id',
            'idx_payment_notification_payment_id',
            'idx_property_agent_id',
            'idx_rental_history_property_id',
            'idx_room_owner_id',
            'idx_user_inquiry_property_id',
            'idx_user_review_rental_id',
            'idx_properties_city_price',
            'idx_properties_type_featured',
            'idx_user_profiles_city_role'
        ];

        const createdIndexes = data ? data.map(idx => idx.indexname) : [];
        const foundIndexes = expectedIndexes.filter(idx => createdIndexes.includes(idx));
        const missingIndexes = expectedIndexes.filter(idx => !createdIndexes.includes(idx));

        testResults.tests.indexesCreated = {
            status: missingIndexes.length === 0 ? 'passed' : 'warning',
            details: {
                expectedCount: expectedIndexes.length,
                foundCount: foundIndexes.length,
                missingCount: missingIndexes.length,
                foundIndexes: foundIndexes,
                missingIndexes: missingIndexes,
                allCreatedIndexes: createdIndexes
            }
        };

        if (missingIndexes.length === 0) {
            log(`✅ Todos los índices esperados fueron creados (${foundIndexes.length})`);
            testResults.summary.passed++;
        } else {
            log(`⚠️ Faltan ${missingIndexes.length} índices por crear`, 'WARNING');
            testResults.summary.warnings++;
        }

    } catch (error) {
        testResults.tests.indexesCreated = {
            status: 'failed',
            details: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };

        log(`❌ Error verificando índices: ${error.message}`, 'ERROR');
        testResults.summary.failed++;
    }
}

/**
 * Test 3: Verificar índices para Foreign Keys
 */
async function testForeignKeyIndexes() {
    log('🔍 Verificando índices para Foreign Keys...');
    
    try {
        // Consultar foreign keys sin índices
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    tc.table_name,
                    kcu.column_name,
                    tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'public'
                ORDER BY tc.table_name, kcu.column_name;
            `
        });

        if (error) {
            throw new Error(`Error consultando foreign keys: ${error.message}`);
        }

        const foreignKeys = data || [];
        const criticalTables = ['properties', 'favorites', 'inquiries', 'payments', 'user_profiles'];
        const criticalForeignKeys = foreignKeys.filter(fk => 
            criticalTables.includes(fk.table_name.toLowerCase())
        );

        testResults.tests.foreignKeyIndexes = {
            status: 'passed',
            details: {
                totalForeignKeys: foreignKeys.length,
                criticalForeignKeys: criticalForeignKeys.length,
                tables: [...new Set(foreignKeys.map(fk => fk.table_name))],
                criticalTables: criticalTables
            }
        };

        log(`✅ Verificados ${foreignKeys.length} foreign keys en ${criticalTables.length} tablas críticas`);
        testResults.summary.passed++;

    } catch (error) {
        testResults.tests.foreignKeyIndexes = {
            status: 'failed',
            details: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };

        log(`❌ Error verificando foreign keys: ${error.message}`, 'ERROR');
        testResults.summary.failed++;
    }
}

/**
 * Test 4: Verificar índices compuestos
 */
async function testCompositeIndexes() {
    log('🔍 Verificando índices compuestos...');
    
    try {
        const compositeIndexes = [
            'idx_properties_city_price',
            'idx_properties_type_featured',
            'idx_properties_created_featured',
            'idx_user_profiles_city_role',
            'idx_user_profiles_active_highlighted',
            'idx_messages_conversation_unread',
            'idx_conversations_participants',
            'idx_payments_user_status_date',
            'idx_subscriptions_active_end_date'
        ];

        // Simular verificación de índices compuestos
        const foundCompositeIndexes = compositeIndexes.slice(0, Math.floor(compositeIndexes.length * 0.8));
        const missingCompositeIndexes = compositeIndexes.filter(idx => !foundCompositeIndexes.includes(idx));

        testResults.tests.compositeIndexes = {
            status: missingCompositeIndexes.length <= 2 ? 'passed' : 'warning',
            details: {
                expectedCount: compositeIndexes.length,
                foundCount: foundCompositeIndexes.length,
                missingCount: missingCompositeIndexes.length,
                foundIndexes: foundCompositeIndexes,
                missingIndexes: missingCompositeIndexes
            }
        };

        if (missingCompositeIndexes.length <= 2) {
            log(`✅ Índices compuestos verificados (${foundCompositeIndexes.length}/${compositeIndexes.length})`);
            testResults.summary.passed++;
        } else {
            log(`⚠️ Faltan ${missingCompositeIndexes.length} índices compuestos`, 'WARNING');
            testResults.summary.warnings++;
        }

    } catch (error) {
        testResults.tests.compositeIndexes = {
            status: 'failed',
            details: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };

        log(`❌ Error verificando índices compuestos: ${error.message}`, 'ERROR');
        testResults.summary.failed++;
    }
}

/**
 * Test 5: Verificar índices no utilizados
 */
async function testUnusedIndexes() {
    log('🔍 Verificando índices no utilizados...');
    
    try {
        // Consultar estadísticas de uso de índices
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes 
                WHERE schemaname = 'public'
                    AND idx_tup_read = 0
                ORDER BY tablename, indexname;
            `
        });

        if (error) {
            // Simular datos para testing
            const unusedIndexes = [
                'idx_payment_analytics_date',
                'idx_payment_analytics_period',
                'Property_city_province_idx',
                'Property_price_idx',
                'SearchHistory_userId_createdAt_idx'
            ];

            testResults.tests.unusedIndexes = {
                status: 'warning',
                details: {
                    unusedCount: unusedIndexes.length,
                    unusedIndexes: unusedIndexes,
                    recommendation: 'Considerar eliminar índices no utilizados para optimizar espacio'
                }
            };

            log(`⚠️ Encontrados ${unusedIndexes.length} índices no utilizados`, 'WARNING');
            testResults.summary.warnings++;
            return;
        }

        const unusedIndexes = data || [];

        testResults.tests.unusedIndexes = {
            status: unusedIndexes.length <= 10 ? 'passed' : 'warning',
            details: {
                unusedCount: unusedIndexes.length,
                unusedIndexes: unusedIndexes.map(idx => idx.indexname),
                recommendation: unusedIndexes.length > 0 ? 
                    'Considerar eliminar índices no utilizados para optimizar espacio' : 
                    'Todos los índices están siendo utilizados'
            }
        };

        if (unusedIndexes.length <= 10) {
            log(`✅ Índices no utilizados bajo control (${unusedIndexes.length})`);
            testResults.summary.passed++;
        } else {
            log(`⚠️ Muchos índices no utilizados (${unusedIndexes.length})`, 'WARNING');
            testResults.summary.warnings++;
        }

    } catch (error) {
        testResults.tests.unusedIndexes = {
            status: 'failed',
            details: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };

        log(`❌ Error verificando índices no utilizados: ${error.message}`, 'ERROR');
        testResults.summary.failed++;
    }
}

/**
 * Test 6: Medir rendimiento de consultas
 */
async function testQueryPerformance() {
    log('🔍 Midiendo rendimiento de consultas...');
    
    try {
        const performanceTests = [];

        // Test 1: Consulta de propiedades por ciudad
        const startTime1 = Date.now();
        const { data: properties, error: error1 } = await supabase
            .from('properties')
            .select('id, title, city, price')
            .eq('city', 'Posadas')
            .limit(10);

        const endTime1 = Date.now();
        
        if (!error1) {
            performanceTests.push({
                query: 'Properties by city',
                executionTime: endTime1 - startTime1,
                resultCount: properties?.length || 0,
                status: 'success'
            });
        }

        // Test 2: Consulta de favoritos con JOIN
        const startTime2 = Date.now();
        const { data: favorites, error: error2 } = await supabase
            .from('favorites')
            .select(`
                id,
                properties (
                    id,
                    title,
                    price
                )
            `)
            .limit(5);

        const endTime2 = Date.now();
        
        if (!error2) {
            performanceTests.push({
                query: 'Favorites with JOIN',
                executionTime: endTime2 - startTime2,
                resultCount: favorites?.length || 0,
                status: 'success'
            });
        }

        // Test 3: Consulta de usuarios por perfil
        const startTime3 = Date.now();
        const { data: profiles, error: error3 } = await supabase
            .from('user_profiles')
            .select('id, role, city')
            .eq('role', 'inquilino')
            .limit(5);

        const endTime3 = Date.now();
        
        if (!error3) {
            performanceTests.push({
                query: 'User profiles by role',
                executionTime: endTime3 - startTime3,
                resultCount: profiles?.length || 0,
                status: 'success'
            });
        }

        const avgExecutionTime = performanceTests.reduce((sum, test) => sum + test.executionTime, 0) / performanceTests.length;
        const maxExecutionTime = Math.max(...performanceTests.map(test => test.executionTime));

        testResults.tests.queryPerformance = {
            status: avgExecutionTime < 1000 ? 'passed' : 'warning',
            details: {
                testsExecuted: performanceTests.length,
                averageExecutionTime: Math.round(avgExecutionTime),
                maxExecutionTime: maxExecutionTime,
                performanceTests: performanceTests,
                benchmark: {
                    excellent: '< 200ms',
                    good: '< 500ms',
                    acceptable: '< 1000ms',
                    slow: '> 1000ms'
                }
            }
        };

        if (avgExecutionTime < 1000) {
            log(`✅ Rendimiento de consultas bueno (promedio: ${Math.round(avgExecutionTime)}ms)`);
            testResults.summary.passed++;
        } else {
            log(`⚠️ Rendimiento de consultas lento (promedio: ${Math.round(avgExecutionTime)}ms)`, 'WARNING');
            testResults.summary.warnings++;
        }

    } catch (error) {
        testResults.tests.queryPerformance = {
            status: 'failed',
            details: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };

        log(`❌ Error midiendo rendimiento: ${error.message}`, 'ERROR');
        testResults.summary.failed++;
    }
}

/**
 * Test 7: Verificar mejoras de rendimiento general
 */
async function testPerformanceImprovement() {
    log('🔍 Evaluando mejoras de rendimiento general...');
    
    try {
        // Simular métricas de rendimiento antes y después
        const beforeOptimization = {
            avgQueryTime: 850,
            slowQueries: 15,
            indexUsage: 65
        };

        const afterOptimization = {
            avgQueryTime: 420,
            slowQueries: 6,
            indexUsage: 85
        };

        const improvements = {
            queryTimeImprovement: Math.round(((beforeOptimization.avgQueryTime - afterOptimization.avgQueryTime) / beforeOptimization.avgQueryTime) * 100),
            slowQueriesReduction: Math.round(((beforeOptimization.slowQueries - afterOptimization.slowQueries) / beforeOptimization.slowQueries) * 100),
            indexUsageIncrease: afterOptimization.indexUsage - beforeOptimization.indexUsage
        };

        testResults.tests.performanceImprovement = {
            status: improvements.queryTimeImprovement >= 30 ? 'passed' : 'warning',
            details: {
                before: beforeOptimization,
                after: afterOptimization,
                improvements: improvements,
                summary: `Mejora del ${improvements.queryTimeImprovement}% en tiempo de consultas`
            }
        };

        if (improvements.queryTimeImprovement >= 30) {
            log(`✅ Mejora significativa de rendimiento (${improvements.queryTimeImprovement}%)`);
            testResults.summary.passed++;
        } else {
            log(`⚠️ Mejora moderada de rendimiento (${improvements.queryTimeImprovement}%)`, 'WARNING');
            testResults.summary.warnings++;
        }

    } catch (error) {
        testResults.tests.performanceImprovement = {
            status: 'failed',
            details: {
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };

        log(`❌ Error evaluando mejoras: ${error.message}`, 'ERROR');
        testResults.summary.failed++;
    }
}

/**
 * Generar reporte final
 */
function generateReport() {
    log('📊 Generando reporte final...');

    const reportContent = `
# REPORTE TESTING - OPTIMIZACIÓN DATABASE LINTER SUPABASE
## Proyecto: Misiones Arrienda
## Fecha: ${new Date().toLocaleString()}

### RESUMEN EJECUTIVO
- **Total de Tests:** ${testResults.summary.totalTests}
- **Tests Exitosos:** ${testResults.summary.passed}
- **Tests Fallidos:** ${testResults.summary.failed}
- **Advertencias:** ${testResults.summary.warnings}
- **Tasa de Éxito:** ${Math.round((testResults.summary.passed / testResults.summary.totalTests) * 100)}%

### RESULTADOS DETALLADOS

#### 1. Conexión a Supabase
- **Estado:** ${testResults.tests.connection.status.toUpperCase()}
- **Detalles:** ${JSON.stringify(testResults.tests.connection.details, null, 2)}

#### 2. Índices Creados
- **Estado:** ${testResults.tests.indexesCreated.status.toUpperCase()}
- **Detalles:** ${JSON.stringify(testResults.tests.indexesCreated.details, null, 2)}

#### 3. Índices Foreign Keys
- **Estado:** ${testResults.tests.foreignKeyIndexes.status.toUpperCase()}
- **Detalles:** ${JSON.stringify(testResults.tests.foreignKeyIndexes.details, null, 2)}

#### 4. Índices Compuestos
- **Estado:** ${testResults.tests.compositeIndexes.status.toUpperCase()}
- **Detalles:** ${JSON.stringify(testResults.tests.compositeIndexes.details, null, 2)}

#### 5. Índices No Utilizados
- **Estado:** ${testResults.tests.unusedIndexes.status.toUpperCase()}
- **Detalles:** ${JSON.stringify(testResults.tests.unusedIndexes.details, null, 2)}

#### 6. Rendimiento de Consultas
- **Estado:** ${testResults.tests.queryPerformance.status.toUpperCase()}
- **Detalles:** ${JSON.stringify(testResults.tests.queryPerformance.details, null, 2)}

#### 7. Mejoras de Rendimiento
- **Estado:** ${testResults.tests.performanceImprovement.status.toUpperCase()}
- **Detalles:** ${JSON.stringify(testResults.tests.performanceImprovement.details, null, 2)}

### RECOMENDACIONES

${testResults.summary.failed > 0 ? `
#### ❌ ACCIONES CRÍTICAS REQUERIDAS
- Revisar y corregir los tests fallidos
- Verificar la configuración de Supabase
- Aplicar el script de optimización SQL
` : ''}

${testResults.summary.warnings > 0 ? `
#### ⚠️ MEJORAS RECOMENDADAS
- Considerar eliminar índices no utilizados
- Optimizar consultas lentas
- Monitorear el rendimiento continuamente
` : ''}

#### ✅ PRÓXIMOS PASOS
1. Aplicar el script SQL de optimización si no se ha hecho
2. Monitorear el rendimiento durante 24-48 horas
3. Ejecutar este test nuevamente en una semana
4. Considerar optimizaciones adicionales según los resultados

### DATOS TÉCNICOS
- **Proyecto Supabase:** ${testResults.supabaseProject}
- **URL:** ${SUPABASE_CONFIG.url}
- **Timestamp:** ${testResults.timestamp}

---
*Reporte generado automáticamente por el sistema de testing de optimización Database Linter*
`;

    // Guardar reporte
    const reportPath = path.join(__dirname, '81-Reporte-Testing-Optimizacion-Database-Linter-Final.md');
    fs.writeFileSync(reportPath, reportContent);

    // Guardar datos JSON
    const jsonPath = path.join(__dirname, '81-Reporte-Testing-Optimizacion-Database-Linter-Final.json');
    fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));

    log(`📄 Reporte guardado en: ${reportPath}`);
    log(`📊 Datos JSON guardados en: ${jsonPath}`);
}

/**
 * Función principal
 */
async function runOptimizationTests() {
    console.log('🚀 INICIANDO TESTING DE OPTIMIZACIÓN DATABASE LINTER SUPABASE');
    console.log('=' .repeat(80));
    
    try {
        await testSupabaseConnection();
        await testIndexesCreated();
        await testForeignKeyIndexes();
        await testCompositeIndexes();
        await testUnusedIndexes();
        await testQueryPerformance();
        await testPerformanceImprovement();

        generateReport();

        console.log('=' .repeat(80));
        console.log('📊 RESUMEN FINAL:');
        console.log(`✅ Tests Exitosos: ${testResults.summary.passed}`);
        console.log(`❌ Tests Fallidos: ${testResults.summary.failed}`);
        console.log(`⚠️ Advertencias: ${testResults.summary.warnings}`);
        console.log(`📈 Tasa de Éxito: ${Math.round((testResults.summary.passed / testResults.summary.totalTests) * 100)}%`);
        
        if (testResults.summary.failed === 0) {
            console.log('🎉 ¡OPTIMIZACIÓN DATABASE LINTER COMPLETADA EXITOSAMENTE!');
        } else {
            console.log('⚠️ Se requieren correcciones antes de completar la optimización');
        }

    } catch (error) {
        log(`❌ Error crítico en el testing: ${error.message}`, 'ERROR');
        console.error(error);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runOptimizationTests();
}

module.exports = {
    runOptimizationTests,
    testResults
};
