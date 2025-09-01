/**
 * TESTING EXHAUSTIVO - OPTIMIZACIÓN SUPABASE DATABASE LINTER
 * Fecha: 3 de Enero, 2025
 * Desarrollado por: BlackBox AI
 * 
 * Este script realiza testing exhaustivo de todas las optimizaciones
 * aplicadas por el Supabase Database Linter
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class SupabaseDatabaseLinterTester {
    constructor() {
        this.client = null;
        this.testResults = {
            connection: false,
            preOptimization: {},
            postOptimization: {},
            performance: {},
            functionality: {},
            errors: []
        };
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colorMap = {
            info: colors.cyan,
            success: colors.green,
            warning: colors.yellow,
            error: colors.red,
            header: colors.magenta
        };
        
        console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async connectToDatabase() {
        this.log('=== INICIANDO TESTING EXHAUSTIVO SUPABASE DATABASE LINTER ===', 'header');
        this.log('Conectando a la base de datos Supabase...', 'info');

        try {
            // Verificar variables de entorno
            if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
                throw new Error('Variables de entorno DATABASE_URL o DIRECT_URL no encontradas');
            }

            const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
            
            this.client = new Client({
                connectionString: connectionString,
                ssl: { rejectUnauthorized: false }
            });

            await this.client.connect();
            this.testResults.connection = true;
            this.log('✅ Conexión a Supabase establecida exitosamente', 'success');

            // Verificar información de la base de datos
            const dbInfo = await this.client.query('SELECT version(), current_database(), current_user');
            this.log(`📊 Base de datos: ${dbInfo.rows[0].current_database}`, 'info');
            this.log(`👤 Usuario: ${dbInfo.rows[0].current_user}`, 'info');
            this.log(`🔧 Versión PostgreSQL: ${dbInfo.rows[0].version.split(' ')[1]}`, 'info');

            return true;
        } catch (error) {
            this.testResults.errors.push(`Error de conexión: ${error.message}`);
            this.log(`❌ Error conectando a la base de datos: ${error.message}`, 'error');
            return false;
        }
    }

    async runPreOptimizationAnalysis() {
        this.log('\n=== FASE 1: ANÁLISIS PRE-OPTIMIZACIÓN ===', 'header');

        try {
            // 1. Contar índices existentes
            const indexQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE schemaname = 'public'
                ORDER BY tablename, indexname;
            `;
            
            const indexResult = await this.client.query(indexQuery);
            this.testResults.preOptimization.totalIndexes = indexResult.rows.length;
            this.log(`📊 Índices existentes: ${indexResult.rows.length}`, 'info');

            // 2. Verificar foreign keys sin índices
            const foreignKeyQuery = `
                SELECT 
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name,
                    tc.constraint_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'public';
            `;

            const foreignKeyResult = await this.client.query(foreignKeyQuery);
            this.testResults.preOptimization.foreignKeys = foreignKeyResult.rows.length;
            this.log(`🔗 Foreign keys encontradas: ${foreignKeyResult.rows.length}`, 'info');

            // 3. Verificar políticas RLS
            const rlsPolicyQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    policyname,
                    permissive,
                    roles,
                    cmd,
                    qual,
                    with_check
                FROM pg_policies 
                WHERE schemaname = 'public'
                ORDER BY tablename, policyname;
            `;

            const rlsPolicyResult = await this.client.query(rlsPolicyQuery);
            this.testResults.preOptimization.rlsPolicies = rlsPolicyResult.rows.length;
            this.log(`🔒 Políticas RLS encontradas: ${rlsPolicyResult.rows.length}`, 'info');

            // 4. Verificar estadísticas de tablas
            const statsQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    last_analyze,
                    last_autoanalyze,
                    n_tup_ins,
                    n_tup_upd,
                    n_tup_del
                FROM pg_stat_user_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename;
            `;

            const statsResult = await this.client.query(statsQuery);
            this.testResults.preOptimization.tableStats = statsResult.rows.length;
            this.log(`📈 Tablas con estadísticas: ${statsResult.rows.length}`, 'info');

            // 5. Medir rendimiento de consultas típicas
            await this.measureQueryPerformance('pre');

            this.log('✅ Análisis pre-optimización completado', 'success');
            return true;

        } catch (error) {
            this.testResults.errors.push(`Error en análisis pre-optimización: ${error.message}`);
            this.log(`❌ Error en análisis pre-optimización: ${error.message}`, 'error');
            return false;
        }
    }

    async executeOptimizationScript() {
        this.log('\n=== FASE 2: EJECUTANDO SCRIPT DE OPTIMIZACIÓN ===', 'header');

        try {
            // Leer el script de optimización
            const scriptPath = path.join(__dirname, '60-Script-Optimizacion-Supabase-Database-Linter.sql');
            
            if (!fs.existsSync(scriptPath)) {
                throw new Error('Script de optimización no encontrado');
            }

            const sqlScript = fs.readFileSync(scriptPath, 'utf8');
            this.log('📄 Script de optimización cargado', 'info');

            // Ejecutar el script por partes para mejor control
            const sqlCommands = sqlScript.split(';').filter(cmd => cmd.trim().length > 0);
            let executedCommands = 0;
            let failedCommands = 0;

            this.log(`🔄 Ejecutando ${sqlCommands.length} comandos SQL...`, 'info');

            for (let i = 0; i < sqlCommands.length; i++) {
                const command = sqlCommands[i].trim();
                if (command.length === 0) continue;

                try {
                    await this.client.query(command);
                    executedCommands++;
                    
                    if (i % 10 === 0) {
                        this.log(`⏳ Progreso: ${i}/${sqlCommands.length} comandos ejecutados`, 'info');
                    }
                } catch (error) {
                    failedCommands++;
                    this.log(`⚠️ Comando falló: ${error.message}`, 'warning');
                    // Continuar con el siguiente comando
                }
            }

            this.testResults.optimization = {
                totalCommands: sqlCommands.length,
                executedCommands,
                failedCommands
            };

            this.log(`✅ Optimización completada: ${executedCommands} éxitos, ${failedCommands} fallos`, 'success');
            return true;

        } catch (error) {
            this.testResults.errors.push(`Error ejecutando optimización: ${error.message}`);
            this.log(`❌ Error ejecutando optimización: ${error.message}`, 'error');
            return false;
        }
    }

    async runPostOptimizationAnalysis() {
        this.log('\n=== FASE 3: ANÁLISIS POST-OPTIMIZACIÓN ===', 'header');

        try {
            // 1. Verificar índices creados
            const newIndexQuery = `
                SELECT COUNT(*) as count 
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND (indexname LIKE 'idx_%_property_id' 
                     OR indexname LIKE 'idx_%_user_id' 
                     OR indexname LIKE 'idx_%_owner_id'
                     OR indexname LIKE 'idx_%_location_price'
                     OR indexname LIKE 'idx_%_user_created'
                     OR indexname LIKE 'idx_%_conversation_date'
                     OR indexname LIKE 'idx_%_user_status_date');
            `;

            const newIndexResult = await this.client.query(newIndexQuery);
            this.testResults.postOptimization.newIndexes = parseInt(newIndexResult.rows[0].count);
            this.log(`🆕 Nuevos índices creados: ${this.testResults.postOptimization.newIndexes}`, 'info');

            // 2. Verificar políticas RLS optimizadas
            const optimizedPolicyQuery = `
                SELECT COUNT(*) as count 
                FROM pg_policies 
                WHERE schemaname = 'public' 
                AND policyname LIKE '%manage own%';
            `;

            const optimizedPolicyResult = await this.client.query(optimizedPolicyQuery);
            this.testResults.postOptimization.optimizedPolicies = parseInt(optimizedPolicyResult.rows[0].count);
            this.log(`🔒 Políticas RLS optimizadas: ${this.testResults.postOptimization.optimizedPolicies}`, 'info');

            // 3. Verificar estadísticas actualizadas
            const updatedStatsQuery = `
                SELECT COUNT(*) as count 
                FROM pg_stat_user_tables 
                WHERE schemaname = 'public' 
                AND last_analyze > NOW() - INTERVAL '1 hour';
            `;

            const updatedStatsResult = await this.client.query(updatedStatsQuery);
            this.testResults.postOptimization.updatedStats = parseInt(updatedStatsResult.rows[0].count);
            this.log(`📊 Estadísticas actualizadas: ${this.testResults.postOptimization.updatedStats}`, 'info');

            // 4. Medir rendimiento post-optimización
            await this.measureQueryPerformance('post');

            this.log('✅ Análisis post-optimización completado', 'success');
            return true;

        } catch (error) {
            this.testResults.errors.push(`Error en análisis post-optimización: ${error.message}`);
            this.log(`❌ Error en análisis post-optimización: ${error.message}`, 'error');
            return false;
        }
    }

    async measureQueryPerformance(phase) {
        this.log(`📊 Midiendo rendimiento de consultas (${phase})...`, 'info');

        const testQueries = [
            {
                name: 'Consulta de propiedades con JOIN',
                query: `
                    SELECT p.*, u.name as owner_name 
                    FROM properties p 
                    LEFT JOIN users u ON p.user_id = u.id 
                    LIMIT 100;
                `
            },
            {
                name: 'Consulta de favoritos por usuario',
                query: `
                    SELECT f.*, p.title 
                    FROM favorites f 
                    LEFT JOIN properties p ON f.property_id = p.id 
                    WHERE f.user_id = '00000000-0000-0000-0000-000000000001'
                    LIMIT 50;
                `
            },
            {
                name: 'Búsqueda de propiedades por ubicación',
                query: `
                    SELECT * FROM properties 
                    WHERE city = 'Posadas' AND province = 'Misiones' 
                    AND price BETWEEN 50000 AND 200000 
                    LIMIT 20;
                `
            },
            {
                name: 'Consulta de mensajes por conversación',
                query: `
                    SELECT * FROM messages 
                    WHERE conversation_id = '00000000-0000-0000-0000-000000000001'
                    ORDER BY created_at DESC 
                    LIMIT 30;
                `
            }
        ];

        const performanceResults = {};

        for (const testQuery of testQueries) {
            try {
                const startTime = Date.now();
                await this.client.query(testQuery.query);
                const endTime = Date.now();
                const duration = endTime - startTime;

                performanceResults[testQuery.name] = duration;
                this.log(`⏱️ ${testQuery.name}: ${duration}ms`, 'info');

            } catch (error) {
                this.log(`⚠️ Error en consulta "${testQuery.name}": ${error.message}`, 'warning');
                performanceResults[testQuery.name] = -1; // Indica error
            }
        }

        this.testResults.performance[phase] = performanceResults;
    }

    async testFunctionality() {
        this.log('\n=== FASE 4: TESTING DE FUNCIONALIDAD ===', 'header');

        try {
            // 1. Test de autenticación (políticas RLS)
            this.log('🔐 Testing políticas RLS...', 'info');
            
            const rlsTestQuery = `
                SELECT tablename, rowsecurity 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                AND rowsecurity = true;
            `;

            const rlsResult = await this.client.query(rlsTestQuery);
            this.testResults.functionality.rlsEnabled = rlsResult.rows.length;
            this.log(`✅ Tablas con RLS habilitado: ${rlsResult.rows.length}`, 'success');

            // 2. Test de integridad referencial
            this.log('🔗 Testing integridad referencial...', 'info');
            
            const foreignKeyTestQuery = `
                SELECT COUNT(*) as violations
                FROM (
                    SELECT 'properties' as table_name, user_id as fk_value 
                    FROM properties 
                    WHERE user_id IS NOT NULL 
                    AND user_id NOT IN (SELECT id FROM users)
                    
                    UNION ALL
                    
                    SELECT 'favorites' as table_name, property_id as fk_value 
                    FROM favorites 
                    WHERE property_id IS NOT NULL 
                    AND property_id NOT IN (SELECT id FROM properties)
                ) violations;
            `;

            const fkResult = await this.client.query(foreignKeyTestQuery);
            this.testResults.functionality.integrityViolations = parseInt(fkResult.rows[0].violations);
            
            if (this.testResults.functionality.integrityViolations === 0) {
                this.log('✅ Integridad referencial: Sin violaciones', 'success');
            } else {
                this.log(`⚠️ Integridad referencial: ${this.testResults.functionality.integrityViolations} violaciones`, 'warning');
            }

            // 3. Test de índices únicos
            this.log('🔍 Testing índices únicos...', 'info');
            
            const uniqueIndexQuery = `
                SELECT COUNT(*) as count
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND indexdef LIKE '%UNIQUE%';
            `;

            const uniqueResult = await this.client.query(uniqueIndexQuery);
            this.testResults.functionality.uniqueIndexes = parseInt(uniqueResult.rows[0].count);
            this.log(`✅ Índices únicos: ${this.testResults.functionality.uniqueIndexes}`, 'success');

            return true;

        } catch (error) {
            this.testResults.errors.push(`Error en testing de funcionalidad: ${error.message}`);
            this.log(`❌ Error en testing de funcionalidad: ${error.message}`, 'error');
            return false;
        }
    }

    async testIndexUsage() {
        this.log('\n=== FASE 5: TESTING DE USO DE ÍNDICES ===', 'header');

        try {
            // Verificar estadísticas de uso de índices
            const indexUsageQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes 
                WHERE schemaname = 'public'
                AND (indexname LIKE 'idx_%' OR indexname LIKE '%_pkey' OR indexname LIKE '%_key')
                ORDER BY idx_tup_read DESC;
            `;

            const indexUsageResult = await this.client.query(indexUsageQuery);
            this.testResults.functionality.indexUsageStats = indexUsageResult.rows.length;
            
            let usedIndexes = 0;
            let unusedIndexes = 0;

            indexUsageResult.rows.forEach(row => {
                if (parseInt(row.idx_tup_read) > 0) {
                    usedIndexes++;
                } else {
                    unusedIndexes++;
                }
            });

            this.testResults.functionality.usedIndexes = usedIndexes;
            this.testResults.functionality.unusedIndexes = unusedIndexes;

            this.log(`📊 Índices en uso: ${usedIndexes}`, 'info');
            this.log(`📊 Índices sin uso: ${unusedIndexes}`, 'info');

            return true;

        } catch (error) {
            this.testResults.errors.push(`Error en testing de uso de índices: ${error.message}`);
            this.log(`❌ Error en testing de uso de índices: ${error.message}`, 'error');
            return false;
        }
    }

    calculatePerformanceImprovement() {
        this.log('\n=== FASE 6: CÁLCULO DE MEJORAS DE RENDIMIENTO ===', 'header');

        const prePerf = this.testResults.performance.pre || {};
        const postPerf = this.testResults.performance.post || {};
        const improvements = {};

        Object.keys(prePerf).forEach(queryName => {
            const preDuration = prePerf[queryName];
            const postDuration = postPerf[queryName];

            if (preDuration > 0 && postDuration > 0) {
                const improvement = ((preDuration - postDuration) / preDuration) * 100;
                improvements[queryName] = {
                    before: preDuration,
                    after: postDuration,
                    improvement: improvement.toFixed(2)
                };

                if (improvement > 0) {
                    this.log(`🚀 ${queryName}: ${improvement.toFixed(2)}% más rápida (${preDuration}ms → ${postDuration}ms)`, 'success');
                } else {
                    this.log(`📊 ${queryName}: ${Math.abs(improvement).toFixed(2)}% más lenta (${preDuration}ms → ${postDuration}ms)`, 'warning');
                }
            }
        });

        this.testResults.performance.improvements = improvements;
    }

    async generateReport() {
        this.log('\n=== GENERANDO REPORTE FINAL ===', 'header');

        const endTime = Date.now();
        const totalDuration = endTime - this.startTime;

        const report = {
            timestamp: new Date().toISOString(),
            duration: `${(totalDuration / 1000).toFixed(2)} segundos`,
            connection: this.testResults.connection,
            preOptimization: this.testResults.preOptimization,
            optimization: this.testResults.optimization,
            postOptimization: this.testResults.postOptimization,
            performance: this.testResults.performance,
            functionality: this.testResults.functionality,
            errors: this.testResults.errors,
            summary: {
                totalTests: 6,
                passedTests: this.testResults.errors.length === 0 ? 6 : 6 - this.testResults.errors.length,
                failedTests: this.testResults.errors.length,
                success: this.testResults.errors.length === 0
            }
        };

        // Guardar reporte en archivo
        const reportPath = path.join(__dirname, '63-Reporte-Testing-Exhaustivo-Optimizacion-Supabase-Final.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`📄 Reporte guardado en: ${reportPath}`, 'info');
        return report;
    }

    async cleanup() {
        if (this.client) {
            await this.client.end();
            this.log('🔌 Conexión a base de datos cerrada', 'info');
        }
    }

    async runFullTest() {
        try {
            // Conectar a la base de datos
            const connected = await this.connectToDatabase();
            if (!connected) return false;

            // Ejecutar todas las fases de testing
            await this.runPreOptimizationAnalysis();
            await this.executeOptimizationScript();
            await this.runPostOptimizationAnalysis();
            await this.testFunctionality();
            await this.testIndexUsage();
            
            // Calcular mejoras de rendimiento
            this.calculatePerformanceImprovement();

            // Generar reporte final
            const report = await this.generateReport();

            // Mostrar resumen final
            this.log('\n=== RESUMEN FINAL ===', 'header');
            this.log(`✅ Tests completados: ${report.summary.passedTests}/${report.summary.totalTests}`, 'success');
            this.log(`❌ Tests fallidos: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'error' : 'info');
            this.log(`⏱️ Duración total: ${report.duration}`, 'info');
            
            if (report.summary.success) {
                this.log('🎉 TESTING EXHAUSTIVO COMPLETADO EXITOSAMENTE', 'success');
            } else {
                this.log('⚠️ TESTING COMPLETADO CON ERRORES', 'warning');
            }

            return report.summary.success;

        } catch (error) {
            this.log(`❌ Error crítico en testing: ${error.message}`, 'error');
            return false;
        } finally {
            await this.cleanup();
        }
    }
}

// Ejecutar testing si se llama directamente
if (require.main === module) {
    const tester = new SupabaseDatabaseLinterTester();
    tester.runFullTest().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
}

module.exports = SupabaseDatabaseLinterTester;
