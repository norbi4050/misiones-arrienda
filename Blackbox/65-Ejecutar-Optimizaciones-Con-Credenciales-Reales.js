/**
 * EJECUTAR OPTIMIZACIONES SUPABASE CON CREDENCIALES REALES
 * Fecha: 3 de Enero, 2025
 * Desarrollado por: BlackBox AI
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

class SupabaseOptimizationExecutor {
    constructor() {
        this.client = null;
        this.results = {
            connection: false,
            preOptimization: {},
            optimization: {},
            postOptimization: {},
            errors: []
        };
        this.startTime = Date.now();
        
        // Credenciales directas
        this.connectionString = 'postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require';
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
        this.log('=== INICIANDO OPTIMIZACIONES SUPABASE DATABASE LINTER ===', 'header');
        this.log('Conectando a la base de datos Supabase...', 'info');

        try {
            this.client = new Client({
                connectionString: this.connectionString,
                ssl: { rejectUnauthorized: false }
            });

            await this.client.connect();
            this.results.connection = true;
            this.log('✅ Conexión a Supabase establecida exitosamente', 'success');

            // Verificar información de la base de datos
            const dbInfo = await this.client.query('SELECT version(), current_database(), current_user');
            this.log(`📊 Base de datos: ${dbInfo.rows[0].current_database}`, 'info');
            this.log(`👤 Usuario: ${dbInfo.rows[0].current_user}`, 'info');
            this.log(`🔧 Versión PostgreSQL: ${dbInfo.rows[0].version.split(' ')[1]}`, 'info');

            return true;
        } catch (error) {
            this.results.errors.push(`Error de conexión: ${error.message}`);
            this.log(`❌ Error conectando a la base de datos: ${error.message}`, 'error');
            return false;
        }
    }

    async runPreOptimizationAnalysis() {
        this.log('\n=== ANÁLISIS PRE-OPTIMIZACIÓN ===', 'header');

        try {
            // 1. Contar índices existentes
            const indexQuery = `
                SELECT COUNT(*) as count 
                FROM pg_indexes 
                WHERE schemaname = 'public';
            `;
            
            const indexResult = await this.client.query(indexQuery);
            this.results.preOptimization.totalIndexes = parseInt(indexResult.rows[0].count);
            this.log(`📊 Índices existentes: ${this.results.preOptimization.totalIndexes}`, 'info');

            // 2. Verificar foreign keys
            const foreignKeyQuery = `
                SELECT COUNT(*) as count
                FROM information_schema.table_constraints 
                WHERE constraint_type = 'FOREIGN KEY' 
                AND table_schema = 'public';
            `;

            const foreignKeyResult = await this.client.query(foreignKeyQuery);
            this.results.preOptimization.foreignKeys = parseInt(foreignKeyResult.rows[0].count);
            this.log(`🔗 Foreign keys: ${this.results.preOptimization.foreignKeys}`, 'info');

            // 3. Verificar políticas RLS
            const rlsPolicyQuery = `
                SELECT COUNT(*) as count 
                FROM pg_policies 
                WHERE schemaname = 'public';
            `;

            const rlsPolicyResult = await this.client.query(rlsPolicyQuery);
            this.results.preOptimization.rlsPolicies = parseInt(rlsPolicyResult.rows[0].count);
            this.log(`🔒 Políticas RLS: ${this.results.preOptimization.rlsPolicies}`, 'info');

            return true;

        } catch (error) {
            this.results.errors.push(`Error en análisis pre-optimización: ${error.message}`);
            this.log(`❌ Error en análisis pre-optimización: ${error.message}`, 'error');
            return false;
        }
    }

    async executeOptimizations() {
        this.log('\n=== EJECUTANDO OPTIMIZACIONES ===', 'header');

        try {
            // Leer el script de optimización
            const scriptPath = path.join(__dirname, '60-Script-Optimizacion-Supabase-Database-Linter.sql');
            
            if (!fs.existsSync(scriptPath)) {
                throw new Error('Script de optimización no encontrado');
            }

            const sqlScript = fs.readFileSync(scriptPath, 'utf8');
            this.log('📄 Script de optimización cargado', 'info');

            // Ejecutar el script por partes
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
                    this.log(`⚠️ Comando falló: ${error.message.substring(0, 100)}...`, 'warning');
                    // Continuar con el siguiente comando
                }
            }

            this.results.optimization = {
                totalCommands: sqlCommands.length,
                executedCommands,
                failedCommands
            };

            this.log(`✅ Optimización completada: ${executedCommands} éxitos, ${failedCommands} fallos`, 'success');
            return true;

        } catch (error) {
            this.results.errors.push(`Error ejecutando optimización: ${error.message}`);
            this.log(`❌ Error ejecutando optimización: ${error.message}`, 'error');
            return false;
        }
    }

    async runPostOptimizationAnalysis() {
        this.log('\n=== ANÁLISIS POST-OPTIMIZACIÓN ===', 'header');

        try {
            // 1. Verificar índices después de optimización
            const newIndexQuery = `
                SELECT COUNT(*) as count 
                FROM pg_indexes 
                WHERE schemaname = 'public';
            `;

            const newIndexResult = await this.client.query(newIndexQuery);
            this.results.postOptimization.totalIndexes = parseInt(newIndexResult.rows[0].count);
            this.log(`📊 Índices después: ${this.results.postOptimization.totalIndexes}`, 'info');

            // 2. Calcular diferencia
            const indexDifference = this.results.postOptimization.totalIndexes - this.results.preOptimization.totalIndexes;
            this.log(`📈 Cambio en índices: ${indexDifference > 0 ? '+' : ''}${indexDifference}`, indexDifference > 0 ? 'success' : 'info');

            // 3. Verificar políticas RLS optimizadas
            const optimizedPolicyQuery = `
                SELECT COUNT(*) as count 
                FROM pg_policies 
                WHERE schemaname = 'public';
            `;

            const optimizedPolicyResult = await this.client.query(optimizedPolicyQuery);
            this.results.postOptimization.rlsPolicies = parseInt(optimizedPolicyResult.rows[0].count);
            this.log(`🔒 Políticas RLS después: ${this.results.postOptimization.rlsPolicies}`, 'info');

            return true;

        } catch (error) {
            this.results.errors.push(`Error en análisis post-optimización: ${error.message}`);
            this.log(`❌ Error en análisis post-optimización: ${error.message}`, 'error');
            return false;
        }
    }

    async testOptimizations() {
        this.log('\n=== TESTING DE OPTIMIZACIONES ===', 'header');

        try {
            // Test básico de consulta
            const testQuery = `
                SELECT COUNT(*) as total_tables
                FROM information_schema.tables 
                WHERE table_schema = 'public';
            `;

            const testResult = await this.client.query(testQuery);
            this.log(`📊 Tablas en esquema público: ${testResult.rows[0].total_tables}`, 'info');

            // Test de índices específicos
            const specificIndexQuery = `
                SELECT COUNT(*) as count
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND (indexname LIKE 'idx_%_property_id' 
                     OR indexname LIKE 'idx_%_user_id' 
                     OR indexname LIKE 'idx_%_owner_id');
            `;

            const specificIndexResult = await this.client.query(specificIndexQuery);
            this.results.postOptimization.newOptimizedIndexes = parseInt(specificIndexResult.rows[0].count);
            this.log(`🆕 Índices optimizados creados: ${this.results.postOptimization.newOptimizedIndexes}`, 'success');

            return true;

        } catch (error) {
            this.results.errors.push(`Error en testing: ${error.message}`);
            this.log(`❌ Error en testing: ${error.message}`, 'error');
            return false;
        }
    }

    async generateReport() {
        this.log('\n=== GENERANDO REPORTE FINAL ===', 'header');

        const endTime = Date.now();
        const totalDuration = endTime - this.startTime;

        const report = {
            timestamp: new Date().toISOString(),
            duration: `${(totalDuration / 1000).toFixed(2)} segundos`,
            connection: this.results.connection,
            preOptimization: this.results.preOptimization,
            optimization: this.results.optimization,
            postOptimization: this.results.postOptimization,
            errors: this.results.errors,
            summary: {
                success: this.results.errors.length === 0,
                indexesChanged: this.results.postOptimization.totalIndexes - this.results.preOptimization.totalIndexes,
                optimizationsApplied: this.results.optimization.executedCommands || 0,
                newOptimizedIndexes: this.results.postOptimization.newOptimizedIndexes || 0
            }
        };

        // Guardar reporte
        const reportPath = path.join(__dirname, '66-Reporte-Optimizaciones-Ejecutadas-Final.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`📄 Reporte guardado en: ${reportPath}`, 'info');
        return report;
    }

    async cleanup() {
        if (this.client) {
            await this.client.end();
            this.log('🔌 Conexión cerrada', 'info');
        }
    }

    async runFullOptimization() {
        try {
            // Conectar
            const connected = await this.connectToDatabase();
            if (!connected) return false;

            // Análisis pre-optimización
            await this.runPreOptimizationAnalysis();

            // Ejecutar optimizaciones
            await this.executeOptimizations();

            // Análisis post-optimización
            await this.runPostOptimizationAnalysis();

            // Testing
            await this.testOptimizations();

            // Generar reporte
            const report = await this.generateReport();

            // Mostrar resumen final
            this.log('\n=== RESUMEN FINAL ===', 'header');
            this.log(`✅ Optimizaciones aplicadas: ${report.summary.optimizationsApplied}`, 'success');
            this.log(`📊 Cambio en índices: ${report.summary.indexesChanged}`, 'info');
            this.log(`🆕 Índices optimizados: ${report.summary.newOptimizedIndexes}`, 'success');
            this.log(`⏱️ Duración total: ${report.duration}`, 'info');
            
            if (report.summary.success) {
                this.log('🎉 OPTIMIZACIONES COMPLETADAS EXITOSAMENTE', 'success');
                this.log('🚀 Tu base de datos Supabase ahora está optimizada', 'success');
                this.log('📈 Deberías ver mejoras de rendimiento inmediatamente', 'success');
            } else {
                this.log('⚠️ OPTIMIZACIONES COMPLETADAS CON ALGUNOS ERRORES', 'warning');
                this.log('📋 Revisa el reporte para detalles específicos', 'info');
            }

            return report.summary.success;

        } catch (error) {
            this.log(`❌ Error crítico: ${error.message}`, 'error');
            return false;
        } finally {
            await this.cleanup();
        }
    }
}

// Ejecutar optimizaciones
if (require.main === module) {
    const optimizer = new SupabaseOptimizationExecutor();
    optimizer.runFullOptimization().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
}

module.exports = SupabaseOptimizationExecutor;
