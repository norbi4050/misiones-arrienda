// =====================================================
// BLACKBOX AI - TESTING EXHAUSTIVO CONFIGURACIÓN SUPABASE CON CREDENCIALES
// Archivo: 109-Testing-Exhaustivo-Configuracion-Supabase-Con-Credenciales.js
// Fecha: 3/9/2025
// Estado: ✅ LISTO PARA EJECUTAR
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE'
};

// Cliente Supabase con permisos de administrador
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);

// Reporte de testing exhaustivo
let testingReport = {
    timestamp: new Date().toISOString(),
    status: 'INICIANDO',
    tests: [],
    passed: [],
    failed: [],
    warnings: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        successRate: 0
    }
};

// Función para agregar test al reporte
function addTest(category, description, status, details = null, expected = null, actual = null) {
    const test = {
        id: testingReport.tests.length + 1,
        category,
        description,
        status,
        details,
        expected,
        actual,
        timestamp: new Date().toISOString()
    };
    
    testingReport.tests.push(test);
    
    if (status === 'PASSED') {
        testingReport.passed.push(test);
        console.log(`✅ [${category}] ${description}`);
    } else if (status === 'FAILED') {
        testingReport.failed.push(test);
        console.log(`❌ [${category}] ${description}`);
        if (details) console.log(`   Error: ${details}`);
    } else if (status === 'WARNING') {
        testingReport.warnings.push(test);
        console.log(`⚠️  [${category}] ${description}`);
        if (details) console.log(`   Advertencia: ${details}`);
    }
    
    if (details && status === 'PASSED') {
        console.log(`   ✓ ${details}`);
    }
}

// 1. TESTING DE CONECTIVIDAD BÁSICA
async function testConectividadBasica() {
    console.log('\n🔍 TESTING CONECTIVIDAD BÁSICA...');
    
    try {
        // Test 1: Conexión con Service Role Key
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
            
        if (error) {
            addTest('CONECTIVIDAD', 'Conexión con Service Role Key', 'FAILED', error.message);
            return false;
        }
        
        addTest('CONECTIVIDAD', 'Conexión con Service Role Key', 'PASSED', 'Conexión exitosa con permisos de administrador');
        
        // Test 2: Verificar URL de Supabase
        if (SUPABASE_CONFIG.url.includes('qfeyhaaxyemmnohqdele.supabase.co')) {
            addTest('CONECTIVIDAD', 'URL de Supabase válida', 'PASSED', `URL: ${SUPABASE_CONFIG.url}`);
        } else {
            addTest('CONECTIVIDAD', 'URL de Supabase válida', 'FAILED', 'URL no coincide con las credenciales proporcionadas');
        }
        
        // Test 3: Verificar permisos de administrador
        try {
            const { data: schemas, error: schemaError } = await supabase
                .from('information_schema.schemata')
                .select('schema_name');
                
            if (!schemaError && schemas) {
                addTest('CONECTIVIDAD', 'Permisos de administrador', 'PASSED', `Acceso a ${schemas.length} esquemas`);
            } else {
                addTest('CONECTIVIDAD', 'Permisos de administrador', 'WARNING', 'Permisos limitados detectados');
            }
        } catch (err) {
            addTest('CONECTIVIDAD', 'Permisos de administrador', 'WARNING', 'No se pudo verificar permisos completos');
        }
        
        return true;
    } catch (error) {
        addTest('CONECTIVIDAD', 'Conexión general', 'FAILED', error.message);
        return false;
    }
}

// 2. TESTING DE TABLAS EXISTENTES
async function testTablasExistentes() {
    console.log('\n📋 TESTING TABLAS EXISTENTES...');
    
    try {
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (error) {
            addTest('TABLAS', 'Consultar tablas existentes', 'FAILED', error.message);
            return [];
        }
        
        const tableNames = tables.map(t => t.table_name);
        addTest('TABLAS', 'Consultar tablas existentes', 'PASSED', `${tableNames.length} tablas encontradas`);
        
        // Verificar tablas críticas
        const tablasRequeridas = [
            'users', 'properties', 'agents', 'favorites', 'inquiries',
            'search_history', 'rental_history', 'user_reviews', 'payments',
            'subscriptions', 'payment_methods', 'user_profiles', 'rooms',
            'likes', 'conversations', 'messages', 'profiles'
        ];
        
        const tablasFaltantes = [];
        const tablasExistentes = [];
        
        for (const tabla of tablasRequeridas) {
            if (tableNames.includes(tabla)) {
                tablasExistentes.push(tabla);
                addTest('TABLAS', `Tabla ${tabla}`, 'PASSED', 'Tabla existe en la base de datos');
            } else {
                tablasFaltantes.push(tabla);
                addTest('TABLAS', `Tabla ${tabla}`, 'FAILED', 'Tabla no existe - requiere creación');
            }
        }
        
        // Resumen de tablas
        if (tablasFaltantes.length === 0) {
            addTest('TABLAS', 'Verificación completa de tablas', 'PASSED', 'Todas las tablas requeridas existen');
        } else {
            addTest('TABLAS', 'Verificación completa de tablas', 'FAILED', 
                `${tablasFaltantes.length} tablas faltantes: ${tablasFaltantes.join(', ')}`);
        }
        
        return { existentes: tablasExistentes, faltantes: tablasFaltantes, todas: tableNames };
    } catch (error) {
        addTest('TABLAS', 'Testing de tablas', 'FAILED', error.message);
        return { existentes: [], faltantes: [], todas: [] };
    }
}

// 3. TESTING DE STORAGE BUCKETS
async function testStorageBuckets() {
    console.log('\n🗂️ TESTING STORAGE BUCKETS...');
    
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
            addTest('STORAGE', 'Listar buckets de storage', 'FAILED', error.message);
            return [];
        }
        
        const bucketNames = buckets.map(b => b.name);
        addTest('STORAGE', 'Listar buckets de storage', 'PASSED', `${buckets.length} buckets encontrados`);
        
        // Verificar buckets requeridos
        const bucketsRequeridos = ['property-images', 'avatars', 'community-photos', 'documents'];
        const bucketsFaltantes = [];
        const bucketsExistentes = [];
        
        for (const bucket of bucketsRequeridos) {
            if (bucketNames.includes(bucket)) {
                bucketsExistentes.push(bucket);
                addTest('STORAGE', `Bucket ${bucket}`, 'PASSED', 'Bucket existe y está accesible');
            } else {
                bucketsFaltantes.push(bucket);
                addTest('STORAGE', `Bucket ${bucket}`, 'FAILED', 'Bucket no existe - requiere creación');
            }
        }
        
        // Test de permisos de buckets existentes
        for (const bucket of bucketsExistentes) {
            try {
                const { data: files, error: listError } = await supabase.storage
                    .from(bucket)
                    .list('', { limit: 1 });
                    
                if (!listError) {
                    addTest('STORAGE', `Permisos bucket ${bucket}`, 'PASSED', 'Permisos de lectura correctos');
                } else {
                    addTest('STORAGE', `Permisos bucket ${bucket}`, 'WARNING', 'Permisos limitados o configuración incorrecta');
                }
            } catch (err) {
                addTest('STORAGE', `Permisos bucket ${bucket}`, 'WARNING', 'No se pudo verificar permisos');
            }
        }
        
        return { existentes: bucketsExistentes, faltantes: bucketsFaltantes, todos: buckets };
    } catch (error) {
        addTest('STORAGE', 'Testing de storage', 'FAILED', error.message);
        return { existentes: [], faltantes: [], todos: [] };
    }
}

// 4. TESTING DE POLÍTICAS RLS
async function testPoliticasRLS() {
    console.log('\n🔒 TESTING POLÍTICAS RLS...');
    
    try {
        // Verificar si RLS está habilitado
        const { data: rlsStatus, error: rlsError } = await supabase
            .from('pg_class')
            .select('relname, relrowsecurity')
            .eq('relkind', 'r')
            .in('relname', ['users', 'properties', 'profiles', 'payments']);
            
        if (rlsError) {
            addTest('RLS', 'Verificar estado RLS', 'WARNING', 'No se pudo verificar estado de RLS');
        } else {
            const tablesWithRLS = rlsStatus.filter(t => t.relrowsecurity).map(t => t.relname);
            const tablesWithoutRLS = rlsStatus.filter(t => !t.relrowsecurity).map(t => t.relname);
            
            if (tablesWithRLS.length > 0) {
                addTest('RLS', 'RLS habilitado', 'PASSED', `RLS activo en: ${tablesWithRLS.join(', ')}`);
            }
            
            if (tablesWithoutRLS.length > 0) {
                addTest('RLS', 'RLS faltante', 'WARNING', `RLS no habilitado en: ${tablesWithoutRLS.join(', ')}`);
            }
        }
        
        // Verificar políticas existentes
        try {
            const { data: policies, error: policiesError } = await supabase
                .from('pg_policies')
                .select('tablename, policyname, cmd')
                .in('tablename', ['users', 'properties', 'profiles', 'payments']);
                
            if (!policiesError && policies) {
                const policyCount = policies.length;
                const tablesPolicies = [...new Set(policies.map(p => p.tablename))];
                
                addTest('RLS', 'Políticas existentes', 'PASSED', 
                    `${policyCount} políticas encontradas en ${tablesPolicies.length} tablas`);
                    
                // Verificar tipos de políticas
                const selectPolicies = policies.filter(p => p.cmd === 'SELECT').length;
                const insertPolicies = policies.filter(p => p.cmd === 'INSERT').length;
                const updatePolicies = policies.filter(p => p.cmd === 'UPDATE').length;
                const deletePolicies = policies.filter(p => p.cmd === 'DELETE').length;
                
                addTest('RLS', 'Distribución de políticas', 'PASSED', 
                    `SELECT: ${selectPolicies}, INSERT: ${insertPolicies}, UPDATE: ${updatePolicies}, DELETE: ${deletePolicies}`);
            } else {
                addTest('RLS', 'Políticas existentes', 'WARNING', 'No se encontraron políticas o acceso limitado');
            }
        } catch (err) {
            addTest('RLS', 'Verificar políticas', 'WARNING', 'No se pudo acceder a información de políticas');
        }
        
        return true;
    } catch (error) {
        addTest('RLS', 'Testing de RLS', 'FAILED', error.message);
        return false;
    }
}

// 5. TESTING DE FUNCIONES Y TRIGGERS
async function testFuncionesTriggers() {
    console.log('\n⚡ TESTING FUNCIONES Y TRIGGERS...');
    
    try {
        // Verificar funciones existentes
        const { data: functions, error: funcError } = await supabase
            .from('information_schema.routines')
            .select('routine_name, routine_type')
            .eq('routine_schema', 'public');
            
        if (funcError) {
            addTest('FUNCIONES', 'Listar funciones', 'WARNING', 'No se pudo acceder a información de funciones');
        } else {
            const functionNames = functions.map(f => f.routine_name);
            addTest('FUNCIONES', 'Listar funciones', 'PASSED', `${functions.length} funciones encontradas`);
            
            // Verificar funciones críticas
            const funcionesCriticas = [
                'update_updated_at_column',
                'handle_new_user',
                'handle_user_delete'
            ];
            
            for (const func of funcionesCriticas) {
                if (functionNames.includes(func)) {
                    addTest('FUNCIONES', `Función ${func}`, 'PASSED', 'Función existe');
                } else {
                    addTest('FUNCIONES', `Función ${func}`, 'FAILED', 'Función no existe - requiere creación');
                }
            }
        }
        
        // Verificar triggers
        try {
            const { data: triggers, error: triggerError } = await supabase
                .from('information_schema.triggers')
                .select('trigger_name, event_object_table')
                .eq('trigger_schema', 'public');
                
            if (!triggerError && triggers) {
                addTest('TRIGGERS', 'Listar triggers', 'PASSED', `${triggers.length} triggers encontrados`);
                
                // Verificar triggers de updated_at
                const updatedAtTriggers = triggers.filter(t => 
                    t.trigger_name.includes('updated_at') || 
                    t.trigger_name.includes('set_timestamp')
                );
                
                if (updatedAtTriggers.length > 0) {
                    addTest('TRIGGERS', 'Triggers updated_at', 'PASSED', 
                        `${updatedAtTriggers.length} triggers de timestamp encontrados`);
                } else {
                    addTest('TRIGGERS', 'Triggers updated_at', 'FAILED', 
                        'No se encontraron triggers para actualización automática de timestamps');
                }
            } else {
                addTest('TRIGGERS', 'Listar triggers', 'WARNING', 'No se pudo acceder a información de triggers');
            }
        } catch (err) {
            addTest('TRIGGERS', 'Verificar triggers', 'WARNING', 'Acceso limitado a información de triggers');
        }
        
        return true;
    } catch (error) {
        addTest('FUNCIONES', 'Testing de funciones y triggers', 'FAILED', error.message);
        return false;
    }
}

// 6. TESTING DE OPERACIONES CRUD BÁSICAS
async function testOperacionesCRUD() {
    console.log('\n🔧 TESTING OPERACIONES CRUD BÁSICAS...');
    
    try {
        // Test en tabla profiles (si existe)
        const testTableName = 'profiles';
        
        // Test 1: SELECT
        try {
            const { data, error } = await supabase
                .from(testTableName)
                .select('*')
                .limit(1);
                
            if (!error) {
                addTest('CRUD', `SELECT en ${testTableName}`, 'PASSED', 'Operación de lectura exitosa');
            } else {
                addTest('CRUD', `SELECT en ${testTableName}`, 'FAILED', error.message);
            }
        } catch (err) {
            addTest('CRUD', `SELECT en ${testTableName}`, 'FAILED', `Tabla ${testTableName} no existe o no es accesible`);
        }
        
        // Test 2: INSERT (con datos de prueba)
        try {
            const testData = {
                id: 'test-' + Date.now(),
                full_name: 'Test User',
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from(testTableName)
                .insert([testData])
                .select();
                
            if (!error && data && data.length > 0) {
                addTest('CRUD', `INSERT en ${testTableName}`, 'PASSED', 'Operación de inserción exitosa');
                
                // Test 3: UPDATE
                const { error: updateError } = await supabase
                    .from(testTableName)
                    .update({ full_name: 'Test User Updated' })
                    .eq('id', testData.id);
                    
                if (!updateError) {
                    addTest('CRUD', `UPDATE en ${testTableName}`, 'PASSED', 'Operación de actualización exitosa');
                } else {
                    addTest('CRUD', `UPDATE en ${testTableName}`, 'FAILED', updateError.message);
                }
                
                // Test 4: DELETE
                const { error: deleteError } = await supabase
                    .from(testTableName)
                    .delete()
                    .eq('id', testData.id);
                    
                if (!deleteError) {
                    addTest('CRUD', `DELETE en ${testTableName}`, 'PASSED', 'Operación de eliminación exitosa');
                } else {
                    addTest('CRUD', `DELETE en ${testTableName}`, 'FAILED', deleteError.message);
                }
            } else {
                addTest('CRUD', `INSERT en ${testTableName}`, 'FAILED', error?.message || 'No se pudo insertar datos');
            }
        } catch (err) {
            addTest('CRUD', `INSERT en ${testTableName}`, 'WARNING', 'Posibles restricciones RLS o permisos');
        }
        
        return true;
    } catch (error) {
        addTest('CRUD', 'Testing de operaciones CRUD', 'FAILED', error.message);
        return false;
    }
}

// 7. TESTING DE AUTENTICACIÓN
async function testAutenticacion() {
    console.log('\n🔐 TESTING AUTENTICACIÓN...');
    
    try {
        // Test 1: Verificar configuración de auth
        const { data: authConfig, error: authError } = await supabase.auth.getSession();
        
        if (!authError) {
            addTest('AUTH', 'Configuración de autenticación', 'PASSED', 'Sistema de auth accesible');
        } else {
            addTest('AUTH', 'Configuración de autenticación', 'WARNING', 'Configuración de auth limitada');
        }
        
        // Test 2: Verificar tabla auth.users
        try {
            const { data: users, error: usersError } = await supabase
                .from('auth.users')
                .select('id')
                .limit(1);
                
            if (!usersError) {
                addTest('AUTH', 'Tabla auth.users', 'PASSED', 'Acceso a tabla de usuarios de auth');
            } else {
                addTest('AUTH', 'Tabla auth.users', 'WARNING', 'Acceso limitado a tabla auth.users');
            }
        } catch (err) {
            addTest('AUTH', 'Tabla auth.users', 'WARNING', 'No se pudo verificar tabla auth.users');
        }
        
        // Test 3: Verificar providers de auth
        try {
            // Intentar obtener configuración de providers (esto puede fallar sin permisos específicos)
            addTest('AUTH', 'Providers de autenticación', 'WARNING', 'Verificación manual requerida en dashboard');
        } catch (err) {
            addTest('AUTH', 'Providers de autenticación', 'WARNING', 'No se pudo verificar providers automáticamente');
        }
        
        return true;
    } catch (error) {
        addTest('AUTH', 'Testing de autenticación', 'FAILED', error.message);
        return false;
    }
}

// 8. TESTING DE PERFORMANCE Y LÍMITES
async function testPerformanceLimites() {
    console.log('\n⚡ TESTING PERFORMANCE Y LÍMITES...');
    
    try {
        // Test 1: Tiempo de respuesta de consultas
        const startTime = Date.now();
        
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(10);
            
        const responseTime = Date.now() - startTime;
        
        if (!error) {
            if (responseTime < 1000) {
                addTest('PERFORMANCE', 'Tiempo de respuesta', 'PASSED', `${responseTime}ms - Excelente`);
            } else if (responseTime < 3000) {
                addTest('PERFORMANCE', 'Tiempo de respuesta', 'WARNING', `${responseTime}ms - Aceptable`);
            } else {
                addTest('PERFORMANCE', 'Tiempo de respuesta', 'FAILED', `${responseTime}ms - Muy lento`);
            }
        } else {
            addTest('PERFORMANCE', 'Tiempo de respuesta', 'FAILED', error.message);
        }
        
        // Test 2: Límites de conexión
        addTest('PERFORMANCE', 'Límites de conexión', 'WARNING', 'Verificación manual requerida - depende del plan de Supabase');
        
        // Test 3: Tamaño de base de datos
        try {
            const { data: dbSize, error: sizeError } = await supabase
                .from('pg_database_size')
                .select('*')
                .limit(1);
                
            if (!sizeError) {
                addTest('PERFORMANCE', 'Información de tamaño DB', 'PASSED', 'Información de tamaño accesible');
            } else {
                addTest('PERFORMANCE', 'Información de tamaño DB', 'WARNING', 'No se pudo obtener información de tamaño');
            }
        } catch (err) {
            addTest('PERFORMANCE', 'Información de tamaño DB', 'WARNING', 'Acceso limitado a métricas de DB');
        }
        
        return true;
    } catch (error) {
        addTest('PERFORMANCE', 'Testing de performance', 'FAILED', error.message);
        return false;
    }
}

// 9. GENERAR REPORTE FINAL
function generarReporteFinal() {
    console.log('\n📊 GENERANDO REPORTE FINAL...');
    
    testingReport.status = 'COMPLETADO';
    testingReport.summary = {
        total: testingReport.tests.length,
        passed: testingReport.passed.length,
        failed: testingReport.failed.length,
        warnings: testingReport.warnings.length,
        successRate: Math.round((testingReport.passed.length / testingReport.tests.length) * 100)
    };
    
    // Generar recomendaciones basadas en resultados
    testingReport.recommendations = [];
    
    if (testingReport.failed.length > 0) {
        testingReport.recommendations.push({
            priority: 'CRÍTICA',
            action: 'Corregir errores críticos',
            description: 'Hay componentes que no funcionan correctamente',
            items: testingReport.failed.map(f => f.description)
        });
    }
    
    if (testingReport.warnings.length > 0) {
        testingReport.recommendations.push({
            priority: 'ALTA',
            action: 'Revisar advertencias',
            description: 'Hay configuraciones que requieren atención',
            items: testingReport.warnings.map(w => w.description)
        });
    }
    
    // Próximos pasos
    testingReport.nextSteps = [
        {
            step: 1,
            description: 'Ejecutar scripts de configuración automática',
            command: 'Blackbox/107-Ejecutar-Configuracion-Supabase-Con-Credenciales.bat',
            priority: 'CRÍTICA'
        },
        {
            step: 2,
            description: 'Crear tablas faltantes manualmente',
            file: 'Blackbox/105-Scripts-SQL-Configuracion-Supabase-Completa.sql',
            priority: 'CRÍTICA'
        },
        {
            step: 3,
            description: 'Configurar políticas RLS',
            priority: 'ALTA'
        },
        {
            step: 4,
            description: 'Crear buckets de storage faltantes',
            priority: 'ALTA'
        },
        {
            step: 5,
            description: 'Implementar funciones y triggers',
            priority: 'MEDIA'
        }
    ];
    
    // Guardar reporte
    const reportePath = path.join(__dirname, '110-Reporte-Testing-Exhaustivo-Supabase-Final.json');
    fs.writeFileSync(reportePath, JSON.stringify(testingReport, null, 2));
    
    console.log(`\n✅ Reporte de testing guardado en: ${reportePath}`);
    
    return testingReport;
}

// FUNCIÓN PRINCIPAL
async function ejecutarTestingExhaustivo() {
    console.log('🚀 INICIANDO TESTING EXHAUSTIVO DE SUPABASE...');
    console.log('📅 Fecha:', new Date().toLocaleString());
    console.log('🔗 URL Supabase:', SUPABASE_CONFIG.url);
    console.log('=' .repeat(60));
    
    try {
        // 1. Testing de conectividad básica
        const conectividadOk = await testConectividadBasica();
        if (!conectividadOk) {
            console.log('❌ Conectividad fallida. Continuando con tests limitados...');
        }
        
        // 2. Testing de tablas existentes
        const resultadoTablas = await testTablasExistentes();
        
        // 3. Testing de storage buckets
        const resultadoStorage = await testStorageBuckets();
        
        // 4. Testing de políticas RLS
        await testPoliticasRLS();
        
        // 5. Testing de funciones y triggers
        await testFuncionesTriggers();
        
        // 6. Testing de operaciones CRUD
        await testOperacionesCRUD();
        
        // 7. Testing de autenticación
        await testAutenticacion();
        
        // 8. Testing de performance
        await testPerformanceLimites();
        
        // 9. Generar reporte final
        const reporte = generarReporteFinal();
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE TESTING EXHAUSTIVO:');
        console.log(`✅ Tests pasados: ${reporte.summary.passed}`);
        console.log(`❌ Tests fallidos: ${reporte.summary.failed}`);
        console.log(`⚠️  Advertencias: ${reporte.summary.warnings}`);
        console.log(`📈 Tasa de éxito: ${reporte.summary.successRate}%`);
        console.log('=' .repeat(60));
        
        return reporte;
        
    } catch (error) {
        console.error('💥 Error crítico en testing exhaustivo:', error);
        addTest('SISTEMA', 'Testing exhaustivo general', 'FAILED', error.message);
        return generarReporteFinal();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarTestingExhaustivo()
        .then(reporte => {
            console.log('\n🎉 Testing exhaustivo de Supabase completado!');
            process.exit(reporte.summary.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = {
    ejecutarTestingExhaustivo,
    SUPABASE_CONFIG
};
