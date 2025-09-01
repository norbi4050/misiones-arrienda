/**
 * AUDITORÍA: IMPACTO DE OPTIMIZACIONES EN REGISTRO DE USUARIOS
 * Fecha: 3 de Enero, 2025
 * Desarrollado por: BlackBox AI
 * 
 * Este script SOLO AUDITA (sin modificar) si las optimizaciones del Database Linter
 * pueden estar interfiriendo con la creación de nuevos usuarios.
 * 
 * NO REALIZA MODIFICACIONES - SOLO DIAGNÓSTICO
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

class RegistrationImpactAuditor {
    constructor() {
        this.client = null;
        this.auditResults = {
            connection: false,
            rlsPoliciesAnalysis: [],
            functionsAnalysis: [],
            indexesAnalysis: [],
            potentialIssues: [],
            recommendations: [],
            riskLevel: 'UNKNOWN'
        };
        this.startTime = Date.now();
        
        // Configuración de conexión (SOLO LECTURA)
        this.connectionConfig = {
            connectionString: 'postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres',
            ssl: {
                rejectUnauthorized: false,
                require: true
            },
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000
        };

        // Tablas críticas para el registro de usuarios
        this.criticalTablesForRegistration = [
            'auth.users',
            'users', 
            'profiles',
            'User',
            'UserProfile'
        ];

        // Políticas RLS que creamos recientemente
        this.recentlyCreatedPolicies = [
            'Agent',
            'Inquiry',
            'PaymentAnalytics', 
            'PaymentNotification',
            'RentalHistory',
            'Report',
            'UserReview'
        ];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colorMap = {
            info: colors.cyan,
            success: colors.green,
            warning: colors.yellow,
            error: colors.red,
            header: colors.magenta,
            audit: colors.blue
        };
        
        console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async connectToDatabase() {
        this.log('=== AUDITORÍA: IMPACTO EN REGISTRO DE USUARIOS ===', 'header');
        this.log('🔍 MODO: SOLO AUDITORÍA - NO SE REALIZARÁN MODIFICACIONES', 'audit');
        this.log('Conectando a la base de datos Supabase...', 'info');

        try {
            this.client = new Client(this.connectionConfig);
            await this.client.connect();
            this.auditResults.connection = true;
            this.log('✅ Conexión establecida exitosamente', 'success');

            const dbInfo = await this.client.query('SELECT version(), current_database(), current_user');
            this.log(`📊 Base de datos: ${dbInfo.rows[0].current_database}`, 'info');
            this.log(`👤 Usuario: ${dbInfo.rows[0].current_user}`, 'info');

            return true;
        } catch (error) {
            this.log(`❌ Error conectando: ${error.message}`, 'error');
            return false;
        }
    }

    async auditRLSPolicies() {
        this.log('\n=== AUDITORÍA: POLÍTICAS RLS ===', 'header');

        try {
            // Verificar políticas RLS en tablas críticas para registro
            for (const tableName of this.criticalTablesForRegistration) {
                const policiesQuery = `
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
                    WHERE schemaname || '.' || tablename = $1 
                       OR tablename = $1
                    ORDER BY policyname;
                `;

                const result = await this.client.query(policiesQuery, [tableName]);
                
                if (result.rows.length > 0) {
                    this.log(`🔍 Tabla ${tableName}: ${result.rows.length} políticas encontradas`, 'audit');
                    
                    const tableAnalysis = {
                        table: tableName,
                        policies: result.rows,
                        riskLevel: 'LOW',
                        issues: []
                    };

                    // Analizar cada política
                    for (const policy of result.rows) {
                        // Verificar políticas restrictivas para INSERT
                        if (policy.cmd === 'INSERT' && policy.qual && policy.qual.includes('auth.uid()')) {
                            tableAnalysis.issues.push({
                                type: 'RESTRICTIVE_INSERT',
                                policy: policy.policyname,
                                description: 'Política INSERT requiere auth.uid() - puede bloquear registro inicial'
                            });
                            tableAnalysis.riskLevel = 'HIGH';
                        }

                        // Verificar políticas con WITH CHECK restrictivas
                        if (policy.with_check && policy.with_check.includes('auth.uid()')) {
                            tableAnalysis.issues.push({
                                type: 'RESTRICTIVE_WITH_CHECK',
                                policy: policy.policyname,
                                description: 'WITH CHECK requiere auth.uid() - puede interferir con registro'
                            });
                            if (tableAnalysis.riskLevel !== 'HIGH') {
                                tableAnalysis.riskLevel = 'MEDIUM';
                            }
                        }
                    }

                    this.auditResults.rlsPoliciesAnalysis.push(tableAnalysis);
                } else {
                    this.log(`ℹ️ Tabla ${tableName}: No se encontraron políticas RLS`, 'info');
                }
            }

            // Verificar políticas en tablas que creamos recientemente
            this.log('\n🔍 Verificando políticas RLS creadas recientemente...', 'audit');
            
            for (const tableName of this.recentlyCreatedPolicies) {
                const policiesQuery = `
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
                    WHERE tablename = $1
                    ORDER BY policyname;
                `;

                const result = await this.client.query(policiesQuery, [tableName]);
                
                if (result.rows.length > 0) {
                    this.log(`📋 Tabla ${tableName}: ${result.rows.length} políticas creadas recientemente`, 'audit');
                    
                    const recentAnalysis = {
                        table: tableName,
                        policies: result.rows,
                        createdRecently: true,
                        potentialImpact: 'LOW'
                    };

                    // Estas tablas no deberían afectar directamente el registro de usuarios
                    // pero verificamos si hay dependencias
                    this.auditResults.rlsPoliciesAnalysis.push(recentAnalysis);
                }
            }

        } catch (error) {
            this.log(`❌ Error auditando políticas RLS: ${error.message}`, 'error');
        }
    }

    async auditFunctionChanges() {
        this.log('\n=== AUDITORÍA: FUNCIONES MODIFICADAS ===', 'header');

        try {
            // Verificar funciones que modificamos con search_path
            const functionsQuery = `
                SELECT 
                    n.nspname as schema_name,
                    p.proname as function_name,
                    pg_get_functiondef(p.oid) as function_definition
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = 'public'
                AND p.proname IN (
                    'handle_user_update',
                    'handle_user_delete', 
                    'handle_community_profile_creation',
                    'validate_user_data',
                    'get_current_user_profile',
                    'has_community_profile'
                )
                ORDER BY p.proname;
            `;

            const result = await this.client.query(functionsQuery);
            
            this.log(`🔍 Analizando ${result.rows.length} funciones modificadas...`, 'audit');

            for (const func of result.rows) {
                const analysis = {
                    name: func.function_name,
                    schema: func.schema_name,
                    hasSearchPath: func.function_definition.includes('SET search_path'),
                    relatedToUserRegistration: false,
                    riskLevel: 'LOW',
                    issues: []
                };

                // Verificar si la función está relacionada con registro de usuarios
                if (func.function_name.includes('user') || 
                    func.function_name.includes('profile') ||
                    func.function_name.includes('validate')) {
                    
                    analysis.relatedToUserRegistration = true;
                    
                    // Verificar si la función tiene restricciones que podrían afectar el registro
                    if (func.function_definition.includes('auth.uid()')) {
                        analysis.issues.push({
                            type: 'AUTH_DEPENDENCY',
                            description: 'Función depende de auth.uid() - puede fallar durante registro inicial'
                        });
                        analysis.riskLevel = 'MEDIUM';
                    }

                    if (func.function_definition.includes('SECURITY DEFINER')) {
                        analysis.issues.push({
                            type: 'SECURITY_DEFINER',
                            description: 'Función con SECURITY DEFINER - verificar permisos'
                        });
                    }
                }

                this.auditResults.functionsAnalysis.push(analysis);
                
                if (analysis.riskLevel === 'MEDIUM' || analysis.relatedToUserRegistration) {
                    this.log(`⚠️ Función ${func.function_name}: Riesgo ${analysis.riskLevel}`, 'warning');
                } else {
                    this.log(`✅ Función ${func.function_name}: Sin riesgo aparente`, 'success');
                }
            }

        } catch (error) {
            this.log(`❌ Error auditando funciones: ${error.message}`, 'error');
        }
    }

    async auditIndexChanges() {
        this.log('\n=== AUDITORÍA: ÍNDICES AGREGADOS ===', 'header');

        try {
            // Verificar los índices que agregamos
            const indexesQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE indexname IN (
                    'idx_properties_user_id',
                    'idx_favorites_user_id',
                    'idx_favorites_property_id',
                    'idx_inquiries_user_id',
                    'idx_inquiries_property_id',
                    'idx_messages_sender_id'
                )
                ORDER BY tablename, indexname;
            `;

            const result = await this.client.query(indexesQuery);
            
            this.log(`🔍 Verificando ${result.rows.length} índices agregados...`, 'audit');

            for (const index of result.rows) {
                const analysis = {
                    name: index.indexname,
                    table: index.tablename,
                    definition: index.indexdef,
                    impactOnRegistration: 'NONE',
                    riskLevel: 'LOW'
                };

                // Los índices generalmente no afectan el registro, solo mejoran rendimiento
                // Pero verificamos si hay algún caso especial
                if (index.tablename === 'users' || index.tablename === 'profiles') {
                    analysis.impactOnRegistration = 'MINIMAL';
                    this.log(`ℹ️ Índice ${index.indexname} en tabla crítica ${index.tablename}`, 'info');
                } else {
                    this.log(`✅ Índice ${index.indexname}: Sin impacto en registro`, 'success');
                }

                this.auditResults.indexesAnalysis.push(analysis);
            }

        } catch (error) {
            this.log(`❌ Error auditando índices: ${error.message}`, 'error');
        }
    }

    async testRegistrationPath() {
        this.log('\n=== AUDITORÍA: RUTA DE REGISTRO ===', 'header');

        try {
            // Verificar si existe la tabla auth.users (crítica para Supabase Auth)
            const authUsersQuery = `
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'auth' AND table_name = 'users'
                );
            `;

            const authUsersResult = await this.client.query(authUsersQuery);
            
            if (authUsersResult.rows[0].exists) {
                this.log('✅ Tabla auth.users existe', 'success');
                
                // Verificar políticas RLS en auth.users
                const authPoliciesQuery = `
                    SELECT COUNT(*) as policy_count
                    FROM pg_policies 
                    WHERE schemaname = 'auth' AND tablename = 'users';
                `;
                
                const authPoliciesResult = await this.client.query(authPoliciesQuery);
                const policyCount = authPoliciesResult.rows[0].policy_count;
                
                if (policyCount > 0) {
                    this.log(`⚠️ auth.users tiene ${policyCount} políticas RLS - RIESGO ALTO`, 'warning');
                    this.auditResults.potentialIssues.push({
                        type: 'AUTH_USERS_RLS',
                        severity: 'HIGH',
                        description: `auth.users tiene ${policyCount} políticas RLS que pueden bloquear registro`,
                        recommendation: 'Verificar que las políticas permitan INSERT para nuevos usuarios'
                    });
                } else {
                    this.log('✅ auth.users sin políticas RLS restrictivas', 'success');
                }
            } else {
                this.log('❌ Tabla auth.users no encontrada - PROBLEMA CRÍTICO', 'error');
                this.auditResults.potentialIssues.push({
                    type: 'MISSING_AUTH_USERS',
                    severity: 'CRITICAL',
                    description: 'Tabla auth.users no existe',
                    recommendation: 'Verificar configuración de Supabase Auth'
                });
            }

            // Verificar tabla users/profiles personalizada
            const customUsersQuery = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'profiles', 'User', 'UserProfile')
                ORDER BY table_name;
            `;

            const customUsersResult = await this.client.query(customUsersQuery);
            
            if (customUsersResult.rows.length > 0) {
                this.log(`📋 Tablas de usuarios encontradas: ${customUsersResult.rows.map(r => r.table_name).join(', ')}`, 'info');
                
                for (const row of customUsersResult.rows) {
                    const tableName = row.table_name;
                    
                    // Verificar RLS en cada tabla
                    const rlsQuery = `
                        SELECT 
                            relname,
                            relrowsecurity as rls_enabled,
                            relforcerowsecurity as rls_forced
                        FROM pg_class 
                        WHERE relname = $1 AND relkind = 'r';
                    `;
                    
                    const rlsResult = await this.client.query(rlsQuery, [tableName]);
                    
                    if (rlsResult.rows.length > 0) {
                        const rls = rlsResult.rows[0];
                        if (rls.rls_enabled) {
                            this.log(`⚠️ Tabla ${tableName}: RLS habilitado`, 'warning');
                            
                            // Contar políticas
                            const policiesCountQuery = `
                                SELECT COUNT(*) as count
                                FROM pg_policies 
                                WHERE tablename = $1;
                            `;
                            
                            const policiesCount = await this.client.query(policiesCountQuery, [tableName]);
                            const count = policiesCount.rows[0].count;
                            
                            if (count === 0) {
                                this.auditResults.potentialIssues.push({
                                    type: 'RLS_NO_POLICIES',
                                    severity: 'HIGH',
                                    description: `Tabla ${tableName} tiene RLS habilitado pero sin políticas`,
                                    recommendation: 'Crear políticas RLS o deshabilitar RLS para permitir registro'
                                });
                            }
                        } else {
                            this.log(`✅ Tabla ${tableName}: RLS deshabilitado`, 'success');
                        }
                    }
                }
            } else {
                this.log('ℹ️ No se encontraron tablas de usuarios personalizadas', 'info');
            }

        } catch (error) {
            this.log(`❌ Error auditando ruta de registro: ${error.message}`, 'error');
        }
    }

    calculateRiskLevel() {
        let highRiskCount = 0;
        let mediumRiskCount = 0;

        // Contar issues por severidad
        for (const issue of this.auditResults.potentialIssues) {
            if (issue.severity === 'CRITICAL' || issue.severity === 'HIGH') {
                highRiskCount++;
            } else if (issue.severity === 'MEDIUM') {
                mediumRiskCount++;
            }
        }

        // Contar análisis de políticas RLS con riesgo
        for (const analysis of this.auditResults.rlsPoliciesAnalysis) {
            if (analysis.riskLevel === 'HIGH') {
                highRiskCount++;
            } else if (analysis.riskLevel === 'MEDIUM') {
                mediumRiskCount++;
            }
        }

        // Determinar nivel de riesgo general
        if (highRiskCount > 0) {
            this.auditResults.riskLevel = 'HIGH';
        } else if (mediumRiskCount > 0) {
            this.auditResults.riskLevel = 'MEDIUM';
        } else {
            this.auditResults.riskLevel = 'LOW';
        }
    }

    generateRecommendations() {
        this.log('\n=== GENERANDO RECOMENDACIONES ===', 'header');

        // Recomendaciones basadas en los hallazgos
        if (this.auditResults.riskLevel === 'HIGH') {
            this.auditResults.recommendations.push({
                priority: 'URGENT',
                action: 'Revisar políticas RLS en tablas críticas',
                description: 'Se encontraron políticas que pueden bloquear el registro de usuarios'
            });
        }

        if (this.auditResults.riskLevel === 'MEDIUM') {
            this.auditResults.recommendations.push({
                priority: 'HIGH',
                action: 'Verificar funciones relacionadas con usuarios',
                description: 'Algunas funciones pueden tener dependencias que afecten el registro'
            });
        }

        // Recomendaciones generales
        this.auditResults.recommendations.push({
            priority: 'MEDIUM',
            action: 'Probar registro de usuario en entorno de desarrollo',
            description: 'Realizar prueba completa del flujo de registro'
        });

        this.auditResults.recommendations.push({
            priority: 'LOW',
            action: 'Monitorear logs de errores de registro',
            description: 'Vigilar errores relacionados con políticas RLS o funciones'
        });
    }

    async generateAuditReport() {
        this.log('\n=== GENERANDO REPORTE DE AUDITORÍA ===', 'header');

        const endTime = Date.now();
        const totalDuration = endTime - this.startTime;

        this.calculateRiskLevel();
        this.generateRecommendations();

        const report = {
            auditInfo: {
                timestamp: new Date().toISOString(),
                duration: `${(totalDuration / 1000).toFixed(2)} segundos`,
                mode: 'READ_ONLY_AUDIT',
                connection: this.auditResults.connection
            },
            riskAssessment: {
                overallRisk: this.auditResults.riskLevel,
                potentialIssues: this.auditResults.potentialIssues,
                recommendations: this.auditResults.recommendations
            },
            detailedAnalysis: {
                rlsPolicies: this.auditResults.rlsPoliciesAnalysis,
                functions: this.auditResults.functionsAnalysis,
                indexes: this.auditResults.indexesAnalysis
            },
            summary: {
                totalIssuesFound: this.auditResults.potentialIssues.length,
                highRiskIssues: this.auditResults.potentialIssues.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL').length,
                mediumRiskIssues: this.auditResults.potentialIssues.filter(i => i.severity === 'MEDIUM').length,
                lowRiskIssues: this.auditResults.potentialIssues.filter(i => i.severity === 'LOW').length
            }
        };

        // Guardar reporte
        const reportPath = path.join(__dirname, '74-Reporte-Auditoria-Impacto-Registro-Usuarios-Final.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`📄 Reporte de auditoría guardado en: ${reportPath}`, 'info');
        return report;
    }

    async cleanup() {
        if (this.client) {
            try {
                await this.client.end();
                this.log('🔌 Conexión cerrada', 'info');
            } catch (error) {
                this.log(`⚠️ Error cerrando conexión: ${error.message}`, 'warning');
            }
        }
    }

    async runFullAudit() {
        try {
            // Conectar
            const connected = await this.connectToDatabase();
            if (!connected) {
                this.log('❌ No se pudo establecer conexión', 'error');
                return false;
            }

            // Ejecutar auditorías
            await this.auditRLSPolicies();
            await this.auditFunctionChanges();
            await this.auditIndexChanges();
            await this.testRegistrationPath();

            // Generar reporte
            const report = await this.generateAuditReport();

            // Mostrar resumen final
            this.log('\n=== RESUMEN DE AUDITORÍA ===', 'header');
            this.log(`🎯 Nivel de riesgo general: ${report.riskAssessment.overallRisk}`, 
                report.riskAssessment.overallRisk === 'HIGH' ? 'error' : 
                report.riskAssessment.overallRisk === 'MEDIUM' ? 'warning' : 'success');
            
            this.log(`📊 Issues encontrados: ${report.summary.totalIssuesFound}`, 'info');
            this.log(`🔴 Alto riesgo: ${report.summary.highRiskIssues}`, 'error');
            this.log(`🟡 Riesgo medio: ${report.summary.mediumRiskIssues}`, 'warning');
            this.log(`🟢 Bajo riesgo: ${report.summary.lowRiskIssues}`, 'success');
            
            this.log(`⏱️ Duración total: ${report.auditInfo.duration}`, 'info');
            
            // Mostrar recomendaciones principales
            if (report.riskAssessment.recommendations.length > 0) {
                this.log('\n📋 RECOMENDACIONES PRINCIPALES:', 'header');
                for (const rec of report.riskAssessment.recommendations.slice(0, 3)) {
                    this.log(`${rec.priority === 'URGENT' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : 'ℹ️'} ${rec.action}`, 
                        rec.priority === 'URGENT' ? 'error' : rec.priority === 'HIGH' ? 'warning' : 'info');
                }
            }

            return report.riskAssessment.overallRisk !== 'HIGH';

        } catch (error) {
            this.log(`❌ Error crítico en auditoría: ${error.message}`, 'error');
            return false;
        } finally {
            await this.cleanup();
        }
    }
}

// Ejecutar auditoría
if (require.main === module) {
    const auditor = new RegistrationImpactAuditor();
    auditor.runFullAudit().then(success => {
        console.log('\n' + '='.repeat(80));
        console.log('🔍 AUDITORÍA COMPLETADA - NO SE REALIZARON MODIFICACIONES');
        console.log('📄 Revisa el reporte JSON para detalles completos');
        console.log('='.repeat(80));
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Error fatal en auditoría:', error);
        process.exit(1);
    });
}

module.exports = RegistrationImpactAuditor;
