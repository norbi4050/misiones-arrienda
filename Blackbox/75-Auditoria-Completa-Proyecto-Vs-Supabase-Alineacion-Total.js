/**
 * AUDITORÍA COMPLETA: PROYECTO VS SUPABASE - ALINEACIÓN TOTAL
 * Fecha: 3 de Enero, 2025
 * Desarrollado por: BlackBox AI
 * 
 * Esta auditoría verifica que el proyecto y Supabase estén perfectamente alineados:
 * - Esquemas de base de datos
 * - Modelos Prisma vs Tablas Supabase
 * - Políticas RLS
 * - Funciones y triggers
 * - Configuración de autenticación
 * - Storage y buckets
 * - Variables de entorno
 * - APIs y endpoints
 * 
 * MODO: AUDITORÍA EXHAUSTIVA - COMPARACIÓN COMPLETA
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

class ProyectoSupabaseAuditor {
    constructor() {
        this.client = null;
        this.auditResults = {
            connection: false,
            schemaComparison: {
                prismaModels: [],
                supabaseTables: [],
                missingInSupabase: [],
                missingInPrisma: [],
                fieldMismatches: []
            },
            authConfiguration: {
                supabaseAuth: null,
                projectAuth: null,
                alignment: 'UNKNOWN'
            },
            rlsPolicies: {
                total: 0,
                byTable: {},
                issues: []
            },
            functions: {
                total: 0,
                list: [],
                issues: []
            },
            storage: {
                buckets: [],
                policies: [],
                issues: []
            },
            apis: {
                projectEndpoints: [],
                supabaseCompatibility: [],
                issues: []
            },
            environmentVariables: {
                required: [],
                configured: [],
                missing: [],
                issues: []
            },
            overallAlignment: 'UNKNOWN',
            criticalIssues: [],
            recommendations: []
        };
        this.startTime = Date.now();
        
        // Configuración de conexión con credenciales reales
        this.connectionConfig = {
            connectionString: 'postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require',
            ssl: {
                rejectUnauthorized: false,
                require: true
            },
            connectionTimeoutMillis: 15000,
            idleTimeoutMillis: 30000
        };

        // Variables de entorno esperadas
        this.expectedEnvVars = [
            'DATABASE_URL',
            'DIRECT_URL',
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'NEXTAUTH_URL',
            'NEXTAUTH_SECRET',
            'JWT_SECRET'
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
        this.log('=== AUDITORÍA COMPLETA: PROYECTO VS SUPABASE ===', 'header');
        this.log('🔍 VERIFICANDO ALINEACIÓN TOTAL ENTRE PROYECTO Y SUPABASE', 'audit');
        this.log('Conectando a Supabase con credenciales reales...', 'info');

        try {
            this.client = new Client(this.connectionConfig);
            await this.client.connect();
            this.auditResults.connection = true;
            this.log('✅ Conexión a Supabase establecida exitosamente', 'success');

            // Verificar información de la base de datos
            const dbInfo = await this.client.query(`
                SELECT 
                    version() as version,
                    current_database() as database,
                    current_user as user,
                    current_setting('server_version') as server_version
            `);
            
            this.log(`📊 Base de datos: ${dbInfo.rows[0].database}`, 'info');
            this.log(`👤 Usuario: ${dbInfo.rows[0].user}`, 'info');
            this.log(`🔧 Versión PostgreSQL: ${dbInfo.rows[0].server_version}`, 'info');

            return true;
        } catch (error) {
            this.log(`❌ Error conectando a Supabase: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'CONNECTION_FAILED',
                severity: 'CRITICAL',
                description: `No se pudo conectar a Supabase: ${error.message}`,
                impact: 'No se puede realizar la auditoría completa'
            });
            return false;
        }
    }

    async auditPrismaSchema() {
        this.log('\n=== AUDITORÍA: ESQUEMA PRISMA ===', 'header');

        try {
            const prismaSchemaPath = path.join(process.cwd(), 'Backend', 'prisma', 'schema.prisma');
            
            if (!fs.existsSync(prismaSchemaPath)) {
                this.log('❌ Archivo schema.prisma no encontrado', 'error');
                this.auditResults.criticalIssues.push({
                    type: 'PRISMA_SCHEMA_MISSING',
                    severity: 'CRITICAL',
                    description: 'Archivo schema.prisma no encontrado',
                    impact: 'No se puede comparar modelos con Supabase'
                });
                return;
            }

            const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
            this.log('✅ Archivo schema.prisma encontrado', 'success');

            // Extraer modelos de Prisma
            const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
            let match;
            
            while ((match = modelRegex.exec(schemaContent)) !== null) {
                const modelName = match[1];
                const modelContent = match[2];
                
                // Extraer campos del modelo
                const fieldRegex = /(\w+)\s+(\w+(?:\[\])?(?:\?)?)\s*(?:@[^\n]*)?/g;
                const fields = [];
                let fieldMatch;
                
                while ((fieldMatch = fieldRegex.exec(modelContent)) !== null) {
                    if (!fieldMatch[0].includes('@@') && !fieldMatch[0].includes('//')) {
                        fields.push({
                            name: fieldMatch[1],
                            type: fieldMatch[2],
                            raw: fieldMatch[0].trim()
                        });
                    }
                }

                this.auditResults.schemaComparison.prismaModels.push({
                    name: modelName,
                    fields: fields,
                    fieldCount: fields.length
                });

                this.log(`📋 Modelo Prisma encontrado: ${modelName} (${fields.length} campos)`, 'info');
            }

            this.log(`✅ Total modelos Prisma: ${this.auditResults.schemaComparison.prismaModels.length}`, 'success');

        } catch (error) {
            this.log(`❌ Error auditando esquema Prisma: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'PRISMA_AUDIT_ERROR',
                severity: 'HIGH',
                description: `Error auditando esquema Prisma: ${error.message}`,
                impact: 'Comparación incompleta con Supabase'
            });
        }
    }

    async auditSupabaseTables() {
        this.log('\n=== AUDITORÍA: TABLAS SUPABASE ===', 'header');

        try {
            // Obtener todas las tablas del esquema public
            const tablesQuery = `
                SELECT 
                    table_name,
                    table_type
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            `;

            const tablesResult = await this.client.query(tablesQuery);
            this.log(`🔍 Encontradas ${tablesResult.rows.length} tablas en Supabase`, 'info');

            for (const table of tablesResult.rows) {
                const tableName = table.table_name;
                
                // Obtener columnas de cada tabla
                const columnsQuery = `
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length,
                        numeric_precision,
                        numeric_scale
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                    ORDER BY ordinal_position;
                `;

                const columnsResult = await this.client.query(columnsQuery, [tableName]);
                
                const columns = columnsResult.rows.map(col => ({
                    name: col.column_name,
                    type: col.data_type,
                    nullable: col.is_nullable === 'YES',
                    default: col.column_default,
                    maxLength: col.character_maximum_length,
                    precision: col.numeric_precision,
                    scale: col.numeric_scale
                }));

                this.auditResults.schemaComparison.supabaseTables.push({
                    name: tableName,
                    columns: columns,
                    columnCount: columns.length
                });

                this.log(`📋 Tabla Supabase: ${tableName} (${columns.length} columnas)`, 'info');
            }

            this.log(`✅ Total tablas Supabase: ${this.auditResults.schemaComparison.supabaseTables.length}`, 'success');

        } catch (error) {
            this.log(`❌ Error auditando tablas Supabase: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'SUPABASE_TABLES_AUDIT_ERROR',
                severity: 'HIGH',
                description: `Error auditando tablas Supabase: ${error.message}`,
                impact: 'Comparación incompleta con Prisma'
            });
        }
    }

    async compareSchemas() {
        this.log('\n=== COMPARACIÓN: PRISMA VS SUPABASE ===', 'header');

        try {
            const prismaModels = this.auditResults.schemaComparison.prismaModels;
            const supabaseTables = this.auditResults.schemaComparison.supabaseTables;

            // Encontrar modelos que faltan en Supabase
            for (const model of prismaModels) {
                const correspondingTable = supabaseTables.find(table => 
                    table.name.toLowerCase() === model.name.toLowerCase()
                );

                if (!correspondingTable) {
                    this.auditResults.schemaComparison.missingInSupabase.push(model.name);
                    this.log(`⚠️ Modelo Prisma '${model.name}' no encontrado en Supabase`, 'warning');
                }
            }

            // Encontrar tablas que faltan en Prisma
            for (const table of supabaseTables) {
                const correspondingModel = prismaModels.find(model => 
                    model.name.toLowerCase() === table.name.toLowerCase()
                );

                if (!correspondingModel) {
                    this.auditResults.schemaComparison.missingInPrisma.push(table.name);
                    this.log(`⚠️ Tabla Supabase '${table.name}' no encontrada en Prisma`, 'warning');
                }
            }

            // Comparar campos/columnas de tablas que existen en ambos
            for (const model of prismaModels) {
                const correspondingTable = supabaseTables.find(table => 
                    table.name.toLowerCase() === model.name.toLowerCase()
                );

                if (correspondingTable) {
                    const fieldMismatches = [];

                    // Verificar campos de Prisma que faltan en Supabase
                    for (const field of model.fields) {
                        const correspondingColumn = correspondingTable.columns.find(col => 
                            col.name.toLowerCase() === field.name.toLowerCase()
                        );

                        if (!correspondingColumn) {
                            fieldMismatches.push({
                                type: 'MISSING_IN_SUPABASE',
                                field: field.name,
                                prismaType: field.type
                            });
                        }
                    }

                    // Verificar columnas de Supabase que faltan en Prisma
                    for (const column of correspondingTable.columns) {
                        const correspondingField = model.fields.find(field => 
                            field.name.toLowerCase() === column.name.toLowerCase()
                        );

                        if (!correspondingField) {
                            fieldMismatches.push({
                                type: 'MISSING_IN_PRISMA',
                                column: column.name,
                                supabaseType: column.type
                            });
                        }
                    }

                    if (fieldMismatches.length > 0) {
                        this.auditResults.schemaComparison.fieldMismatches.push({
                            table: model.name,
                            mismatches: fieldMismatches
                        });

                        this.log(`⚠️ Desalineaciones en ${model.name}: ${fieldMismatches.length} diferencias`, 'warning');
                    } else {
                        this.log(`✅ ${model.name}: Perfectamente alineado`, 'success');
                    }
                }
            }

            // Resumen de comparación
            const totalMissing = this.auditResults.schemaComparison.missingInSupabase.length + 
                               this.auditResults.schemaComparison.missingInPrisma.length;
            const totalMismatches = this.auditResults.schemaComparison.fieldMismatches.reduce(
                (sum, item) => sum + item.mismatches.length, 0
            );

            if (totalMissing === 0 && totalMismatches === 0) {
                this.log('🎉 ESQUEMAS PERFECTAMENTE ALINEADOS', 'success');
            } else {
                this.log(`⚠️ Encontradas ${totalMissing} tablas faltantes y ${totalMismatches} desalineaciones de campos`, 'warning');
            }

        } catch (error) {
            this.log(`❌ Error comparando esquemas: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'SCHEMA_COMPARISON_ERROR',
                severity: 'HIGH',
                description: `Error comparando esquemas: ${error.message}`,
                impact: 'No se pudo determinar alineación'
            });
        }
    }

    async auditRLSPolicies() {
        this.log('\n=== AUDITORÍA: POLÍTICAS RLS ===', 'header');

        try {
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
                WHERE schemaname = 'public'
                ORDER BY tablename, policyname;
            `;

            const result = await this.client.query(policiesQuery);
            this.auditResults.rlsPolicies.total = result.rows.length;

            this.log(`🔍 Encontradas ${result.rows.length} políticas RLS`, 'info');

            // Agrupar por tabla
            const policiesByTable = {};
            for (const policy of result.rows) {
                if (!policiesByTable[policy.tablename]) {
                    policiesByTable[policy.tablename] = [];
                }
                policiesByTable[policy.tablename].push(policy);
            }

            this.auditResults.rlsPolicies.byTable = policiesByTable;

            // Verificar que cada tabla tenga políticas adecuadas
            for (const table of this.auditResults.schemaComparison.supabaseTables) {
                const tablePolicies = policiesByTable[table.name] || [];
                
                if (tablePolicies.length === 0) {
                    this.auditResults.rlsPolicies.issues.push({
                        type: 'NO_POLICIES',
                        table: table.name,
                        severity: 'MEDIUM',
                        description: `Tabla ${table.name} no tiene políticas RLS`
                    });
                    this.log(`⚠️ Tabla ${table.name}: Sin políticas RLS`, 'warning');
                } else {
                    this.log(`✅ Tabla ${table.name}: ${tablePolicies.length} políticas RLS`, 'success');
                }
            }

        } catch (error) {
            this.log(`❌ Error auditando políticas RLS: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'RLS_AUDIT_ERROR',
                severity: 'MEDIUM',
                description: `Error auditando políticas RLS: ${error.message}`,
                impact: 'No se pudo verificar seguridad RLS'
            });
        }
    }

    async auditSupabaseFunctions() {
        this.log('\n=== AUDITORÍA: FUNCIONES SUPABASE ===', 'header');

        try {
            const functionsQuery = `
                SELECT 
                    n.nspname as schema_name,
                    p.proname as function_name,
                    pg_get_function_result(p.oid) as return_type,
                    pg_get_function_arguments(p.oid) as arguments,
                    l.lanname as language
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                JOIN pg_language l ON p.prolang = l.oid
                WHERE n.nspname = 'public'
                AND p.prokind = 'f'
                ORDER BY p.proname;
            `;

            const result = await this.client.query(functionsQuery);
            this.auditResults.functions.total = result.rows.length;
            this.auditResults.functions.list = result.rows;

            this.log(`🔍 Encontradas ${result.rows.length} funciones personalizadas`, 'info');

            for (const func of result.rows) {
                this.log(`📋 Función: ${func.function_name} (${func.language})`, 'info');
            }

            if (result.rows.length === 0) {
                this.auditResults.functions.issues.push({
                    type: 'NO_CUSTOM_FUNCTIONS',
                    severity: 'LOW',
                    description: 'No se encontraron funciones personalizadas'
                });
            }

        } catch (error) {
            this.log(`❌ Error auditando funciones: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'FUNCTIONS_AUDIT_ERROR',
                severity: 'MEDIUM',
                description: `Error auditando funciones: ${error.message}`,
                impact: 'No se pudo verificar funciones personalizadas'
            });
        }
    }

    async auditSupabaseStorage() {
        this.log('\n=== AUDITORÍA: STORAGE SUPABASE ===', 'header');

        try {
            // Verificar buckets
            const bucketsQuery = `
                SELECT 
                    id,
                    name,
                    owner,
                    created_at,
                    updated_at,
                    public,
                    avif_autodetection,
                    file_size_limit,
                    allowed_mime_types
                FROM storage.buckets
                ORDER BY name;
            `;

            const bucketsResult = await this.client.query(bucketsQuery);
            this.auditResults.storage.buckets = bucketsResult.rows;

            this.log(`🔍 Encontrados ${bucketsResult.rows.length} buckets de storage`, 'info');

            for (const bucket of bucketsResult.rows) {
                this.log(`📁 Bucket: ${bucket.name} (${bucket.public ? 'público' : 'privado'})`, 'info');
            }

            // Verificar políticas de storage
            const storagePoliciesQuery = `
                SELECT 
                    policyname,
                    roles,
                    cmd,
                    qual
                FROM pg_policies 
                WHERE schemaname = 'storage'
                ORDER BY policyname;
            `;

            const policiesResult = await this.client.query(storagePoliciesQuery);
            this.auditResults.storage.policies = policiesResult.rows;

            this.log(`🔍 Encontradas ${policiesResult.rows.length} políticas de storage`, 'info');

            // Verificar buckets esperados para el proyecto
            const expectedBuckets = ['property-images', 'user-avatars', 'documents'];
            for (const expectedBucket of expectedBuckets) {
                const bucketExists = bucketsResult.rows.some(bucket => bucket.name === expectedBucket);
                if (!bucketExists) {
                    this.auditResults.storage.issues.push({
                        type: 'MISSING_BUCKET',
                        bucket: expectedBucket,
                        severity: 'MEDIUM',
                        description: `Bucket esperado '${expectedBucket}' no encontrado`
                    });
                    this.log(`⚠️ Bucket esperado '${expectedBucket}' no encontrado`, 'warning');
                }
            }

        } catch (error) {
            this.log(`❌ Error auditando storage: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'STORAGE_AUDIT_ERROR',
                severity: 'MEDIUM',
                description: `Error auditando storage: ${error.message}`,
                impact: 'No se pudo verificar configuración de storage'
            });
        }
    }

    async auditAuthConfiguration() {
        this.log('\n=== AUDITORÍA: CONFIGURACIÓN DE AUTENTICACIÓN ===', 'header');

        try {
            // Verificar configuración de auth en Supabase
            const authQuery = `
                SELECT 
                    table_name,
                    column_name,
                    data_type
                FROM information_schema.columns 
                WHERE table_schema = 'auth'
                AND table_name IN ('users', 'sessions', 'refresh_tokens')
                ORDER BY table_name, ordinal_position;
            `;

            const authResult = await this.client.query(authQuery);
            this.auditResults.authConfiguration.supabaseAuth = authResult.rows;

            this.log(`🔍 Configuración auth Supabase: ${authResult.rows.length} campos verificados`, 'info');

            // Verificar que auth.users existe y tiene los campos necesarios
            const authUsersFields = authResult.rows.filter(row => row.table_name === 'users');
            const requiredAuthFields = ['id', 'email', 'encrypted_password', 'created_at', 'updated_at'];
            
            let authAlignment = 'PERFECT';
            for (const requiredField of requiredAuthFields) {
                const fieldExists = authUsersFields.some(field => field.column_name === requiredField);
                if (!fieldExists) {
                    authAlignment = 'MISALIGNED';
                    this.auditResults.authConfiguration.issues = this.auditResults.authConfiguration.issues || [];
                    this.auditResults.authConfiguration.issues.push({
                        type: 'MISSING_AUTH_FIELD',
                        field: requiredField,
                        severity: 'HIGH',
                        description: `Campo requerido '${requiredField}' no encontrado en auth.users`
                    });
                    this.log(`❌ Campo auth requerido '${requiredField}' no encontrado`, 'error');
                }
            }

            this.auditResults.authConfiguration.alignment = authAlignment;

            if (authAlignment === 'PERFECT') {
                this.log('✅ Configuración de autenticación perfectamente alineada', 'success');
            } else {
                this.log('⚠️ Problemas encontrados en configuración de autenticación', 'warning');
            }

        } catch (error) {
            this.log(`❌ Error auditando configuración auth: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'AUTH_AUDIT_ERROR',
                severity: 'HIGH',
                description: `Error auditando configuración auth: ${error.message}`,
                impact: 'No se pudo verificar configuración de autenticación'
            });
        }
    }

    async auditProjectAPIs() {
        this.log('\n=== AUDITORÍA: APIs DEL PROYECTO ===', 'header');

        try {
            const apiPath = path.join(process.cwd(), 'Backend', 'src', 'app', 'api');
            
            if (!fs.existsSync(apiPath)) {
                this.log('❌ Directorio de APIs no encontrado', 'error');
                return;
            }

            // Función recursiva para encontrar archivos route.ts
            const findRouteFiles = (dir, routes = []) => {
                const files = fs.readdirSync(dir);
                
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        findRouteFiles(fullPath, routes);
                    } else if (file === 'route.ts' || file === 'route.js') {
                        const relativePath = path.relative(apiPath, fullPath);
                        const endpoint = '/' + path.dirname(relativePath).replace(/\\/g, '/');
                        routes.push({
                            endpoint: endpoint,
                            file: fullPath,
                            relativePath: relativePath
                        });
                    }
                }
                
                return routes;
            };

            const apiRoutes = findRouteFiles(apiPath);
            this.auditResults.apis.projectEndpoints = apiRoutes;

            this.log(`🔍 Encontrados ${apiRoutes.length} endpoints de API`, 'info');

            for (const route of apiRoutes) {
                this.log(`📋 API Endpoint: ${route.endpoint}`, 'info');
                
                // Verificar si el endpoint usa Supabase
                try {
                    const routeContent = fs.readFileSync(route.file, 'utf8');
                    const usesSupabase = routeContent.includes('supabase') || 
                                       routeContent.includes('createClient') ||
                                       routeContent.includes('@supabase');
                    
                    this.auditResults.apis.supabaseCompatibility.push({
                        endpoint: route.endpoint,
                        usesSupabase: usesSupabase,
                        file: route.relativePath
                    });

                    if (!usesSupabase) {
                        this.auditResults.apis.issues.push({
                            type: 'NO_SUPABASE_INTEGRATION',
                            endpoint: route.endpoint,
                            severity: 'LOW',
                            description: `Endpoint ${route.endpoint} no parece usar Supabase`
                        });
                    }
                } catch (readError) {
                    this.log(`⚠️ No se pudo leer ${route.file}: ${readError.message}`, 'warning');
                }
            }

            // Verificar endpoints críticos
            const criticalEndpoints = ['/auth/register', '/auth/login', '/properties', '/users'];
            for (const criticalEndpoint of criticalEndpoints) {
                const endpointExists = apiRoutes.some(route => 
                    route.endpoint.includes(criticalEndpoint.replace('/', ''))
                );
                
                if (!endpointExists) {
                    this.auditResults.apis.issues.push({
                        type: 'MISSING_CRITICAL_ENDPOINT',
                        endpoint: criticalEndpoint,
                        severity: 'HIGH',
                        description: `Endpoint crítico '${criticalEndpoint}' no encontrado`
                    });
                    this.log(`❌ Endpoint crítico '${criticalEndpoint}' no encontrado`, 'error');
                }
            }

        } catch (error) {
            this.log(`❌ Error auditando APIs: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'API_AUDIT_ERROR',
                severity: 'MEDIUM',
                description: `Error auditando APIs: ${error.message}`,
                impact: 'No se pudo verificar integración con Supabase'
            });
        }
    }

    async auditEnvironmentVariables() {
        this.log('\n=== AUDITORÍA: VARIABLES DE ENTORNO ===', 'header');

        try {
            // Verificar archivo .env
            const envPath = path.join(process.cwd(), 'Backend', '.env');
            
            if (!fs.existsSync(envPath)) {
                this.log('❌ Archivo .env no encontrado', 'error');
                this.auditResults.criticalIssues.push({
                    type: 'ENV_FILE_MISSING',
                    severity: 'CRITICAL',
                    description: 'Archivo .env no encontrado',
                    impact: 'Configuración de Supabase no disponible'
                });
                return;
            }

            const envContent = fs.readFileSync(envPath, 'utf8');
            const envLines = envContent.split('\n').filter(line => 
                line.trim() && !line.trim().startsWith('#')
            );

            // Extraer variables configuradas
            const configuredVars = {};
            for (const line of envLines) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    configuredVars[key.trim()] = valueParts.join('=').trim();
                }
            }

            this.auditResults.environmentVariables.configured = Object.keys(configuredVars);
            this.log(`🔍 Variables de entorno configuradas: ${Object.keys(configuredVars).length}`, 'info');

            // Verificar variables requeridas
            for (const requiredVar of this.expectedEnvVars) {
                if (configuredVars[requiredVar]) {
                    this.auditResults.environmentVariables.required.push({
                        name: requiredVar,
                        configured: true,
                        hasValue: configuredVars[requiredVar] !== ''
                    });
                    this.log(`✅ Variable ${requiredVar}: Configurada`, 'success');
                } else {
                    this.auditResults.environmentVariables.missing.push(requiredVar);
                    this.auditResults.environmentVariables.issues.push({
                        type: 'MISSING_ENV_VAR',
                        variable: requiredVar,
                        severity: 'HIGH',
                        description: `Variable de entorno requerida '${requiredVar}' no encontrada`
                    });
                    this.log(`❌ Variable ${requiredVar}: No configurada`, 'error');
                }
            }

            // Verificar URLs de Supabase
            const supabaseUrl = configuredVars['NEXT_PUBLIC_SUPABASE_URL'];
            const supabaseKey = configuredVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
            
            if (supabaseUrl && supabaseKey) {
                this.log('✅ Credenciales de Supabase configuradas', 'success');
            } else {
                this.auditResults.environmentVariables.issues.push({
                    type: 'INCOMPLETE_SUPABASE_CONFIG',
                    severity: 'CRITICAL',
                    description: 'Configuración de Supabase incompleta'
                });
                this.log('❌ Configuración de Supabase incompleta', 'error');
            }

        } catch (error) {
            this.log(`❌ Error auditando variables de entorno: ${error.message}`, 'error');
            this.auditResults.criticalIssues.push({
                type: 'ENV_AUDIT_ERROR',
                severity: 'HIGH',
                description: `Error auditando variables de entorno: ${error.message}`,
                impact: 'No se pudo verificar configuración'
            });
        }
    }

    calculateOverallAlignment() {
        this.log('\n=== CALCULANDO ALINEACIÓN GENERAL ===', 'header');

        try {
            let alignmentScore = 100;
            let criticalIssues = 0;
            let highIssues = 0;
            let mediumIssues = 0;

            // Penalizar por issues críticos
            for (const issue of this.auditResults.criticalIssues) {
                if (issue.severity === 'CRITICAL') {
                    alignmentScore -= 25;
                    criticalIssues++;
                } else if (issue.severity === 'HIGH') {
                    alignmentScore -= 15;
                    highIssues++;
                } else if (issue.severity === 'MEDIUM') {
                    alignmentScore -= 10;
                    mediumIssues++;
                }
            }

            // Penalizar por desalineaciones de esquema
            const schemaMismatches = this.auditResults.schemaComparison.missingInSupabase.length +
                                   this.auditResults.schemaComparison.missingInPrisma.length +
                                   this.auditResults.schemaComparison.fieldMismatches.reduce(
                                       (sum, item) => sum + item.mismatches.length, 0
                                   );
            
            alignmentScore -= schemaMismatches * 5;

            // Penalizar por variables de entorno faltantes
            alignmentScore -= this.auditResults.environmentVariables.missing.length * 10;

            // Penalizar por problemas de RLS
            alignmentScore -= this.auditResults.rlsPolicies.issues.length * 5;

            // Penalizar por problemas de storage
            alignmentScore -= this.auditResults.storage.issues.length * 5;

            // Penalizar por problemas de APIs
            alignmentScore -= this.auditResults.apis.issues.length * 3;

            // Asegurar que el score no sea negativo
            alignmentScore = Math.max(0, alignmentScore);

            // Determinar nivel de alineación
            let alignmentLevel;
            if (alignmentScore >= 95) {
                alignmentLevel = 'PERFECT';
            } else if (alignmentScore >= 85) {
                alignmentLevel = 'EXCELLENT';
            } else if (alignmentScore >= 70) {
                alignmentLevel = 'GOOD';
            } else if (alignmentScore >= 50) {
                alignmentLevel = 'FAIR';
            } else if (alignmentScore >= 25) {
                alignmentLevel = 'POOR';
            } else {
                alignmentLevel = 'CRITICAL';
            }

            this.auditResults.overallAlignment = alignmentLevel;

            this.log(`📊 Score de alineación: ${alignmentScore}/100`, 'info');
            this.log(`🎯 Nivel de alineación: ${alignmentLevel}`, 
                alignmentLevel === 'PERFECT' || alignmentLevel === 'EXCELLENT' ? 'success' : 
                alignmentLevel === 'GOOD' || alignmentLevel === 'FAIR' ? 'warning' : 'error');

            this.log(`🔴 Issues críticos: ${criticalIssues}`, 'error');
            this.log(`🟠 Issues altos: ${highIssues}`, 'warning');
            this.log(`🟡 Issues medios: ${mediumIssues}`, 'warning');

        } catch (error) {
            this.log(`❌ Error calculando alineación: ${error.message}`, 'error');
            this.auditResults.overallAlignment = 'ERROR';
        }
    }

    generateRecommendations() {
        this.log('\n=== GENERANDO RECOMENDACIONES ===', 'header');

        try {
            // Recomendaciones basadas en issues críticos
            if (this.auditResults.criticalIssues.length > 0) {
                this.auditResults.recommendations.push({
                    priority: 'URGENT',
                    category: 'CRITICAL_ISSUES',
                    action: 'Resolver issues críticos inmediatamente',
                    description: `Se encontraron ${this.auditResults.criticalIssues.length} problemas críticos que impiden el funcionamiento correcto`,
                    steps: this.auditResults.criticalIssues.map(issue => `- ${issue.description}`)
                });
            }

            // Recomendaciones para desalineaciones de esquema
            const totalSchemaMismatches = this.auditResults.schemaComparison.missingInSupabase.length +
                                        this.auditResults.schemaComparison.missingInPrisma.length;
            
            if (totalSchemaMismatches > 0) {
                this.auditResults.recommendations.push({
                    priority: 'HIGH',
                    category: 'SCHEMA_ALIGNMENT',
                    action: 'Sincronizar esquemas Prisma y Supabase',
                    description: `${totalSchemaMismatches} tablas/modelos desalineados encontrados`,
                    steps: [
                        '- Ejecutar prisma db push para sincronizar cambios',
                        '- Verificar que todas las tablas existan en ambos lados',
                        '- Revisar tipos de datos y campos faltantes'
                    ]
                });
            }

            // Recomendaciones para variables de entorno
            if (this.auditResults.environmentVariables.missing.length > 0) {
                this.auditResults.recommendations.push({
                    priority: 'HIGH',
                    category: 'ENVIRONMENT_CONFIG',
                    action: 'Configurar variables de entorno faltantes',
                    description: `${this.auditResults.environmentVariables.missing.length} variables requeridas no configuradas`,
                    steps: this.auditResults.environmentVariables.missing.map(varName => `- Configurar ${varName}`)
                });
            }

            // Recomendaciones para RLS
            if (this.auditResults.rlsPolicies.issues.length > 0) {
                this.auditResults.recommendations.push({
                    priority: 'MEDIUM',
                    category: 'SECURITY_RLS',
                    action: 'Configurar políticas RLS faltantes',
                    description: 'Algunas tablas no tienen políticas de seguridad RLS',
                    steps: [
                        '- Crear políticas RLS para tablas sin protección',
                        '- Verificar que las políticas existentes sean correctas',
                        '- Probar acceso con diferentes roles de usuario'
                    ]
                });
            }

            // Recomendaciones para storage
            if (this.auditResults.storage.issues.length > 0) {
                this.auditResults.recommendations.push({
                    priority: 'MEDIUM',
                    category: 'STORAGE_CONFIG',
                    action: 'Configurar buckets de storage faltantes',
                    description: 'Buckets de storage esperados no encontrados',
                    steps: [
                        '- Crear buckets faltantes en Supabase Storage',
                        '- Configurar políticas de acceso apropiadas',
                        '- Verificar configuración de CORS si es necesario'
                    ]
                });
            }

            // Recomendaciones generales
            this.auditResults.recommendations.push({
                priority: 'LOW',
                category: 'MAINTENANCE',
                action: 'Realizar auditorías regulares',
                description: 'Mantener sincronización entre proyecto y Supabase',
                steps: [
                    '- Ejecutar esta auditoría semanalmente',
                    '- Documentar cambios en esquema de base de datos',
                    '- Mantener variables de entorno actualizadas'
                ]
            });

            this.log(`📋 Generadas ${this.auditResults.recommendations.length} recomendaciones`, 'info');

        } catch (error) {
            this.log(`❌ Error generando recomendaciones: ${error.message}`, 'error');
        }
    }

    async generateComprehensiveReport() {
        this.log('\n=== GENERANDO REPORTE COMPLETO ===', 'header');

        try {
            const endTime = Date.now();
            const totalDuration = endTime - this.startTime;

            this.calculateOverallAlignment();
            this.generateRecommendations();

            const report = {
                auditInfo: {
                    timestamp: new Date().toISOString(),
                    duration: `${(totalDuration / 1000).toFixed(2)} segundos`,
                    mode: 'COMPREHENSIVE_ALIGNMENT_AUDIT',
                    connection: this.auditResults.connection,
                    auditor: 'BlackBox AI - Proyecto vs Supabase Auditor'
                },
                overallAssessment: {
                    alignmentLevel: this.auditResults.overallAlignment,
                    criticalIssuesCount: this.auditResults.criticalIssues.length,
                    totalRecommendations: this.auditResults.recommendations.length,
                    summary: this.generateExecutiveSummary()
                },
                detailedFindings: {
                    schemaComparison: this.auditResults.schemaComparison,
                    authConfiguration: this.auditResults.authConfiguration,
                    rlsPolicies: this.auditResults.rlsPolicies,
                    functions: this.auditResults.functions,
                    storage: this.auditResults.storage,
                    apis: this.auditResults.apis,
                    environmentVariables: this.auditResults.environmentVariables
                },
                criticalIssues: this.auditResults.criticalIssues,
                recommendations: this.auditResults.recommendations,
                nextSteps: this.generateNextSteps()
            };

            // Guardar reporte completo
            const reportPath = path.join(__dirname, '76-Reporte-Auditoria-Completa-Proyecto-Vs-Supabase-Final.json');
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

            // Generar reporte ejecutivo en Markdown
            const executiveReportPath = path.join(__dirname, '77-Reporte-Ejecutivo-Auditoria-Alineacion-Final.md');
            const executiveReport = this.generateExecutiveMarkdownReport(report);
            fs.writeFileSync(executiveReportPath, executiveReport);

            this.log(`📄 Reporte completo guardado en: ${reportPath}`, 'info');
            this.log(`📋 Reporte ejecutivo guardado en: ${executiveReportPath}`, 'info');

            return report;

        } catch (error) {
            this.log(`❌ Error generando reporte: ${error.message}`, 'error');
            return null;
        }
    }

    generateExecutiveSummary() {
        const totalIssues = this.auditResults.criticalIssues.length;
        const schemaMismatches = this.auditResults.schemaComparison.missingInSupabase.length +
                               this.auditResults.schemaComparison.missingInPrisma.length;
        const envMissing = this.auditResults.environmentVariables.missing.length;

        if (totalIssues === 0 && schemaMismatches === 0 && envMissing === 0) {
            return 'El proyecto está perfectamente alineado con Supabase. No se encontraron problemas críticos.';
        } else if (totalIssues <= 2 && schemaMismatches <= 3) {
            return 'El proyecto está mayormente alineado con Supabase con algunos problemas menores que requieren atención.';
        } else if (totalIssues <= 5) {
            return 'Se encontraron varios problemas de alineación que requieren corrección para asegurar el funcionamiento óptimo.';
        } else {
            return 'Se detectaron problemas significativos de alineación que requieren atención inmediata para evitar fallos del sistema.';
        }
    }

    generateNextSteps() {
        const nextSteps = [];

        if (this.auditResults.criticalIssues.length > 0) {
            nextSteps.push({
                step: 1,
                action: 'Resolver issues críticos',
                description: 'Abordar inmediatamente todos los problemas críticos identificados',
                priority: 'URGENT'
            });
        }

        if (this.auditResults.schemaComparison.missingInSupabase.length > 0 ||
            this.auditResults.schemaComparison.missingInPrisma.length > 0) {
            nextSteps.push({
                step: nextSteps.length + 1,
                action: 'Sincronizar esquemas',
                description: 'Ejecutar prisma db push y verificar sincronización completa',
                priority: 'HIGH'
            });
        }

        if (this.auditResults.environmentVariables.missing.length > 0) {
            nextSteps.push({
                step: nextSteps.length + 1,
                action: 'Configurar variables de entorno',
                description: 'Completar configuración de variables faltantes',
                priority: 'HIGH'
            });
        }

        nextSteps.push({
            step: nextSteps.length + 1,
            action: 'Verificar funcionalidad',
            description: 'Probar todas las funcionalidades críticas del sistema',
            priority: 'MEDIUM'
        });

        nextSteps.push({
            step: nextSteps.length + 1,
            action: 'Programar auditorías regulares',
            description: 'Establecer proceso de auditoría semanal para mantener alineación',
            priority: 'LOW'
        });

        return nextSteps;
    }

    generateExecutiveMarkdownReport(report) {
        return `# 📊 REPORTE EJECUTIVO - AUDITORÍA DE ALINEACIÓN
## Proyecto vs Supabase - Análisis Completo

**Fecha:** ${new Date().toLocaleDateString('es-ES')}  
**Duración:** ${report.auditInfo.duration}  
**Nivel de Alineación:** **${report.overallAssessment.alignmentLevel}**

---

## 🎯 RESUMEN EJECUTIVO

${report.overallAssessment.summary}

### Métricas Clave
- **Issues Críticos:** ${report.overallAssessment.criticalIssuesCount}
- **Recomendaciones:** ${report.overallAssessment.totalRecommendations}
- **Tablas Auditadas:** ${report.detailedFindings.schemaComparison.supabaseTables.length}
- **Modelos Prisma:** ${report.detailedFindings.schemaComparison.prismaModels.length}

---

## 🔍 HALLAZGOS PRINCIPALES

### Esquemas de Base de Datos
- **Modelos Prisma:** ${report.detailedFindings.schemaComparison.prismaModels.length}
- **Tablas Supabase:** ${report.detailedFindings.schemaComparison.supabaseTables.length}
- **Faltantes en Supabase:** ${report.detailedFindings.schemaComparison.missingInSupabase.length}
- **Faltantes en Prisma:** ${report.detailedFindings.schemaComparison.missingInPrisma.length}

### Configuración de Autenticación
- **Estado:** ${report.detailedFindings.authConfiguration.alignment}

### Políticas RLS
- **Total Políticas:** ${report.detailedFindings.rlsPolicies.total}
- **Issues Encontrados:** ${report.detailedFindings.rlsPolicies.issues.length}

### Storage
- **Buckets Configurados:** ${report.detailedFindings.storage.buckets.length}
- **Problemas de Storage:** ${report.detailedFindings.storage.issues.length}

### Variables de Entorno
- **Configuradas:** ${report.detailedFindings.environmentVariables.configured.length}
- **Faltantes:** ${report.detailedFindings.environmentVariables.missing.length}

---

## 🚨 ISSUES CRÍTICOS

${report.criticalIssues.length === 0 ? 
'✅ **No se encontraron issues críticos**' : 
report.criticalIssues.map((issue, index) => 
`${index + 1}. **${issue.type}** - ${issue.description}`
).join('\n')}

---

## 📋 RECOMENDACIONES PRIORITARIAS

${report.recommendations.slice(0, 5).map((rec, index) => 
`### ${index + 1}. ${rec.action} (${rec.priority})
**Categoría:** ${rec.category}  
**Descripción:** ${rec.description}

**Pasos:**
${rec.steps ? rec.steps.join('\n') : '- Ver detalles en reporte completo'}
`).join('\n')}

---

## 🎯 PRÓXIMOS PASOS

${report.nextSteps.map(step => 
`**${step.step}.** ${step.action} (${step.priority})  
${step.description}
`).join('\n')}

---

## 📊 CONCLUSIÓN

${report.overallAssessment.alignmentLevel === 'PERFECT' ? 
'🎉 **EXCELENTE:** El proyecto está perfectamente alineado con Supabase.' :
report.overallAssessment.alignmentLevel === 'EXCELLENT' || report.overallAssessment.alignmentLevel === 'GOOD' ?
'✅ **BUENO:** El proyecto está bien alineado con correcciones menores necesarias.' :
'⚠️ **ATENCIÓN REQUERIDA:** Se necesitan correcciones para asegurar funcionamiento óptimo.'}

**Reporte generado por:** BlackBox AI - Auditor de Alineación  
**Archivo completo:** 76-Reporte-Auditoria-Completa-Proyecto-Vs-Supabase-Final.json
`;
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

    async runComprehensiveAudit() {
        try {
            // Conectar a Supabase
            const connected = await this.connectToDatabase();
            if (!connected) {
                this.log('❌ No se pudo establecer conexión con Supabase', 'error');
                return false;
            }

            // Ejecutar todas las auditorías
            await this.auditPrismaSchema();
            await this.auditSupabaseTables();
            await this.compareSchemas();
            await this.auditRLSPolicies();
            await this.auditSupabaseFunctions();
            await this.auditSupabaseStorage();
            await this.auditAuthConfiguration();
            await this.auditProjectAPIs();
            await this.auditEnvironmentVariables();

            // Generar reporte completo
            const report = await this.generateComprehensiveReport();

            // Mostrar resumen final
            this.log('\n=== RESUMEN FINAL DE AUDITORÍA ===', 'header');
            this.log(`🎯 Nivel de alineación: ${this.auditResults.overallAlignment}`, 
                this.auditResults.overallAlignment === 'PERFECT' || this.auditResults.overallAlignment === 'EXCELLENT' ? 'success' : 
                this.auditResults.overallAlignment === 'GOOD' ? 'warning' : 'error');
            
            this.log(`🔴 Issues críticos: ${this.auditResults.criticalIssues.length}`, 'error');
            this.log(`📊 Modelos Prisma: ${this.auditResults.schemaComparison.prismaModels.length}`, 'info');
            this.log(`📊 Tablas Supabase: ${this.auditResults.schemaComparison.supabaseTables.length}`, 'info');
            this.log(`📋 Recomendaciones: ${this.auditResults.recommendations.length}`, 'info');
            
            const totalDuration = (Date.now() - this.startTime) / 1000;
            this.log(`⏱️ Duración total: ${totalDuration.toFixed(2)} segundos`, 'info');

            return this.auditResults.overallAlignment === 'PERFECT' || this.auditResults.overallAlignment === 'EXCELLENT';

        } catch (error) {
            this.log(`❌ Error crítico en auditoría: ${error.message}`, 'error');
            return false;
        } finally {
            await this.cleanup();
        }
    }
}

// Ejecutar auditoría completa
if (require.main === module) {
    const auditor = new ProyectoSupabaseAuditor();
    auditor.runComprehensiveAudit().then(success => {
        console.log('\n' + '='.repeat(80));
        console.log('🔍 AUDITORÍA COMPLETA FINALIZADA');
        console.log('📄 Revisa los reportes generados para detalles completos');
        console.log('📋 76-Reporte-Auditoria-Completa-Proyecto-Vs-Supabase-Final.json');
        console.log('📋 77-Reporte-Ejecutivo-Auditoria-Alineacion-Final.md');
        console.log('='.repeat(80));
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Error fatal en auditoría:', error);
        process.exit(1);
    });
}

module.exports = ProyectoSupabaseAuditor;
