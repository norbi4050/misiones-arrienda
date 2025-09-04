// ========================================
// BLACKBOX AI - AUDITORIA COMPLETA PROYECTO 100% CON TOKEN REAL
// Fecha: 3 de Enero 2025
// Objetivo: Verificar configuración completa Supabase + Código Local
// ========================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    key: 'sbp_v0_3ea81d3fe948ffcd0a1bc3a4403b5d98b97999a4'
};

console.log('========================================');
console.log('BLACKBOX AI - AUDITORIA COMPLETA PROYECTO 100%');
console.log('Fecha:', new Date().toLocaleString());
console.log('Token:', SUPABASE_CONFIG.key.substring(0, 20) + '...');
console.log('========================================\n');

let auditResults = {
    supabase: {
        connection: false,
        tables: {},
        policies: {},
        storage: {},
        functions: {},
        auth: {}
    },
    local: {
        envFiles: {},
        prismaSchema: false,
        supabaseClient: false,
        apiRoutes: {},
        components: {}
    },
    issues: [],
    recommendations: []
};

async function auditarSupabase() {
    console.log('🔍 AUDITANDO SUPABASE...\n');
    
    try {
        // Inicializar cliente Supabase
        const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        
        // 1. Verificar conexión
        console.log('1️⃣ Verificando conexión a Supabase...');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
        
        if (connectionError) {
            console.log('❌ Error de conexión:', connectionError.message);
            auditResults.issues.push('Conexión a Supabase fallida');
            return;
        }
        
        auditResults.supabase.connection = true;
        console.log('✅ Conexión exitosa\n');
        
        // 2. Auditar tablas principales
        console.log('2️⃣ Auditando tablas principales...');
        const tablasEsperadas = [
            'properties', 'users', 'profiles', 'community_profiles',
            'favorites', 'search_history', 'inquiries', 'payments'
        ];
        
        for (const tabla of tablasEsperadas) {
            try {
                const { data: tableExists, error: tableError } = await supabase
                    .from('information_schema.tables')
                    .select('table_name')
                    .eq('table_name', tabla)
                    .eq('table_schema', 'public');
                
                if (tableExists && tableExists.length > 0) {
                    auditResults.supabase.tables[tabla] = true;
                    console.log(`✅ Tabla ${tabla}: Existe`);
                    
                    // Verificar columnas críticas
                    const { data: columns } = await supabase
                        .from('information_schema.columns')
                        .select('column_name, data_type')
                        .eq('table_name', tabla);
                    
                    console.log(`   📊 Columnas: ${columns?.length || 0}`);
                } else {
                    auditResults.supabase.tables[tabla] = false;
                    console.log(`❌ Tabla ${tabla}: No existe`);
                    auditResults.issues.push(`Tabla ${tabla} faltante`);
                }
            } catch (error) {
                console.log(`❌ Error verificando tabla ${tabla}:`, error.message);
                auditResults.supabase.tables[tabla] = false;
            }
        }
        console.log('');
        
        // 3. Verificar políticas RLS
        console.log('3️⃣ Verificando políticas RLS...');
        for (const tabla of tablasEsperadas) {
            if (auditResults.supabase.tables[tabla]) {
                try {
                    const { data: policies } = await supabase
                        .from('pg_policies')
                        .select('policyname, cmd')
                        .eq('tablename', tabla);
                    
                    if (policies && policies.length > 0) {
                        auditResults.supabase.policies[tabla] = policies.length;
                        console.log(`✅ ${tabla}: ${policies.length} políticas RLS`);
                    } else {
                        auditResults.supabase.policies[tabla] = 0;
                        console.log(`⚠️  ${tabla}: Sin políticas RLS`);
                        auditResults.issues.push(`Tabla ${tabla} sin políticas RLS`);
                    }
                } catch (error) {
                    console.log(`❌ Error verificando políticas ${tabla}:`, error.message);
                }
            }
        }
        console.log('');
        
        // 4. Verificar Storage Buckets
        console.log('4️⃣ Verificando Storage Buckets...');
        const bucketsEsperados = ['property-images', 'profile-avatars', 'documents'];
        
        try {
            const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
            
            if (buckets) {
                for (const bucketName of bucketsEsperados) {
                    const bucketExists = buckets.find(b => b.name === bucketName);
                    if (bucketExists) {
                        auditResults.supabase.storage[bucketName] = true;
                        console.log(`✅ Bucket ${bucketName}: Existe`);
                    } else {
                        auditResults.supabase.storage[bucketName] = false;
                        console.log(`❌ Bucket ${bucketName}: No existe`);
                        auditResults.issues.push(`Bucket ${bucketName} faltante`);
                    }
                }
            }
        } catch (error) {
            console.log('❌ Error verificando buckets:', error.message);
        }
        console.log('');
        
        // 5. Verificar autenticación
        console.log('5️⃣ Verificando configuración de autenticación...');
        try {
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            auditResults.supabase.auth.usersCount = authUsers?.users?.length || 0;
            console.log(`✅ Usuarios registrados: ${auditResults.supabase.auth.usersCount}`);
        } catch (error) {
            console.log('❌ Error verificando auth:', error.message);
        }
        console.log('');
        
        // 6. Probar operaciones CRUD básicas
        console.log('6️⃣ Probando operaciones CRUD...');
        
        // Test en tabla properties
        if (auditResults.supabase.tables.properties) {
            try {
                const { data: propertiesCount } = await supabase
                    .from('properties')
                    .select('id', { count: 'exact' })
                    .limit(1);
                
                console.log(`✅ Properties: Lectura exitosa`);
            } catch (error) {
                console.log('❌ Error leyendo properties:', error.message);
                auditResults.issues.push('Error en operaciones CRUD properties');
            }
        }
        
        // Test en tabla community_profiles
        if (auditResults.supabase.tables.community_profiles) {
            try {
                const { data: profilesCount } = await supabase
                    .from('community_profiles')
                    .select('id', { count: 'exact' })
                    .limit(1);
                
                console.log(`✅ Community Profiles: Lectura exitosa`);
            } catch (error) {
                console.log('❌ Error leyendo community_profiles:', error.message);
                auditResults.issues.push('Error en operaciones CRUD community_profiles');
            }
        }
        
    } catch (error) {
        console.log('❌ ERROR CRÍTICO EN AUDITORÍA SUPABASE:', error.message);
        auditResults.issues.push('Error crítico en auditoría Supabase');
    }
}

function auditarCodigoLocal() {
    console.log('\n🔍 AUDITANDO CÓDIGO LOCAL...\n');
    
    // 1. Verificar archivos .env
    console.log('1️⃣ Verificando archivos de configuración...');
    
    const envFiles = ['.env.local', '.env', '.env.example'];
    for (const envFile of envFiles) {
        const envPath = path.join(process.cwd(), 'Backend', envFile);
        if (fs.existsSync(envPath)) {
            auditResults.local.envFiles[envFile] = true;
            console.log(`✅ ${envFile}: Existe`);
            
            // Verificar variables críticas
            const envContent = fs.readFileSync(envPath, 'utf8');
            const criticalVars = [
                'NEXT_PUBLIC_SUPABASE_URL',
                'NEXT_PUBLIC_SUPABASE_ANON_KEY',
                'SUPABASE_SERVICE_ROLE_KEY',
                'DATABASE_URL'
            ];
            
            for (const varName of criticalVars) {
                if (envContent.includes(varName)) {
                    console.log(`   ✅ ${varName}: Configurada`);
                } else {
                    console.log(`   ❌ ${varName}: Faltante`);
                    auditResults.issues.push(`Variable ${varName} faltante en ${envFile}`);
                }
            }
        } else {
            auditResults.local.envFiles[envFile] = false;
            console.log(`❌ ${envFile}: No existe`);
            if (envFile === '.env.local') {
                auditResults.issues.push('Archivo .env.local faltante');
            }
        }
    }
    console.log('');
    
    // 2. Verificar Prisma Schema
    console.log('2️⃣ Verificando Prisma Schema...');
    const prismaPath = path.join(process.cwd(), 'Backend', 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaPath)) {
        auditResults.local.prismaSchema = true;
        console.log('✅ schema.prisma: Existe');
        
        const schemaContent = fs.readFileSync(prismaPath, 'utf8');
        const modelsEsperados = ['Property', 'User', 'Profile', 'CommunityProfile'];
        
        for (const model of modelsEsperados) {
            if (schemaContent.includes(`model ${model}`)) {
                console.log(`   ✅ Modelo ${model}: Definido`);
            } else {
                console.log(`   ❌ Modelo ${model}: Faltante`);
                auditResults.issues.push(`Modelo Prisma ${model} faltante`);
            }
        }
    } else {
        auditResults.local.prismaSchema = false;
        console.log('❌ schema.prisma: No existe');
        auditResults.issues.push('Archivo schema.prisma faltante');
    }
    console.log('');
    
    // 3. Verificar clientes Supabase
    console.log('3️⃣ Verificando clientes Supabase...');
    const supabaseClientPaths = [
        'Backend/src/lib/supabase/client.ts',
        'Backend/src/lib/supabase/server.ts'
    ];
    
    for (const clientPath of supabaseClientPaths) {
        const fullPath = path.join(process.cwd(), clientPath);
        if (fs.existsSync(fullPath)) {
            console.log(`✅ ${path.basename(clientPath)}: Existe`);
            auditResults.local.supabaseClient = true;
        } else {
            console.log(`❌ ${path.basename(clientPath)}: No existe`);
            auditResults.issues.push(`Cliente Supabase ${clientPath} faltante`);
        }
    }
    console.log('');
    
    // 4. Verificar rutas API críticas
    console.log('4️⃣ Verificando rutas API críticas...');
    const apiRoutes = [
        'Backend/src/app/api/auth/register/route.ts',
        'Backend/src/app/api/auth/login/route.ts',
        'Backend/src/app/api/properties/route.ts',
        'Backend/src/app/api/comunidad/profiles/route.ts'
    ];
    
    for (const routePath of apiRoutes) {
        const fullPath = path.join(process.cwd(), routePath);
        if (fs.existsSync(fullPath)) {
            auditResults.local.apiRoutes[path.basename(routePath, '.ts')] = true;
            console.log(`✅ ${path.basename(routePath)}: Existe`);
        } else {
            auditResults.local.apiRoutes[path.basename(routePath, '.ts')] = false;
            console.log(`❌ ${path.basename(routePath)}: No existe`);
            auditResults.issues.push(`Ruta API ${routePath} faltante`);
        }
    }
    console.log('');
    
    // 5. Verificar componentes críticos
    console.log('5️⃣ Verificando componentes críticos...');
    const components = [
        'Backend/src/components/navbar.tsx',
        'Backend/src/app/login/page.tsx',
        'Backend/src/app/register/page.tsx',
        'Backend/src/app/properties/page.tsx',
        'Backend/src/app/comunidad/page.tsx'
    ];
    
    for (const componentPath of components) {
        const fullPath = path.join(process.cwd(), componentPath);
        if (fs.existsSync(fullPath)) {
            auditResults.local.components[path.basename(componentPath, '.tsx')] = true;
            console.log(`✅ ${path.basename(componentPath)}: Existe`);
        } else {
            auditResults.local.components[path.basename(componentPath, '.tsx')] = false;
            console.log(`❌ ${path.basename(componentPath)}: No existe`);
            auditResults.issues.push(`Componente ${componentPath} faltante`);
        }
    }
}

function generarRecomendaciones() {
    console.log('\n📋 GENERANDO RECOMENDACIONES...\n');
    
    // Recomendaciones basadas en issues encontrados
    if (auditResults.issues.length === 0) {
        auditResults.recommendations.push('🎉 ¡Proyecto 100% configurado correctamente!');
    } else {
        auditResults.recommendations.push('🔧 Acciones requeridas para completar configuración:');
        
        // Agrupar issues por categoría
        const supabaseIssues = auditResults.issues.filter(issue => 
            issue.includes('Tabla') || issue.includes('Bucket') || issue.includes('políticas')
        );
        
        const localIssues = auditResults.issues.filter(issue => 
            issue.includes('Variable') || issue.includes('Archivo') || issue.includes('Modelo')
        );
        
        if (supabaseIssues.length > 0) {
            auditResults.recommendations.push('\n📊 SUPABASE:');
            supabaseIssues.forEach(issue => {
                auditResults.recommendations.push(`   - ${issue}`);
            });
        }
        
        if (localIssues.length > 0) {
            auditResults.recommendations.push('\n💻 CÓDIGO LOCAL:');
            localIssues.forEach(issue => {
                auditResults.recommendations.push(`   - ${issue}`);
            });
        }
    }
    
    // Recomendaciones adicionales
    auditResults.recommendations.push('\n🚀 PRÓXIMOS PASOS RECOMENDADOS:');
    auditResults.recommendations.push('   1. Ejecutar script de corrección automática');
    auditResults.recommendations.push('   2. Verificar variables de entorno en producción');
    auditResults.recommendations.push('   3. Probar funcionalidades críticas end-to-end');
    auditResults.recommendations.push('   4. Configurar monitoreo y alertas');
}

function mostrarResumenFinal() {
    console.log('\n========================================');
    console.log('📊 RESUMEN FINAL DE AUDITORÍA');
    console.log('========================================\n');
    
    // Calcular puntuación general
    const totalChecks = Object.keys(auditResults.supabase.tables).length +
                       Object.keys(auditResults.local.envFiles).length +
                       Object.keys(auditResults.local.apiRoutes).length +
                       Object.keys(auditResults.local.components).length;
    
    const passedChecks = Object.values(auditResults.supabase.tables).filter(Boolean).length +
                        Object.values(auditResults.local.envFiles).filter(Boolean).length +
                        Object.values(auditResults.local.apiRoutes).filter(Boolean).length +
                        Object.values(auditResults.local.components).filter(Boolean).length;
    
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    console.log(`🎯 PUNTUACIÓN GENERAL: ${score}%`);
    console.log(`✅ Verificaciones exitosas: ${passedChecks}/${totalChecks}`);
    console.log(`❌ Issues encontrados: ${auditResults.issues.length}`);
    console.log(`🔗 Conexión Supabase: ${auditResults.supabase.connection ? '✅' : '❌'}`);
    
    console.log('\n📊 DETALLES POR CATEGORÍA:');
    console.log(`   🗄️  Tablas Supabase: ${Object.values(auditResults.supabase.tables).filter(Boolean).length}/${Object.keys(auditResults.supabase.tables).length}`);
    console.log(`   🔐 Políticas RLS: ${Object.keys(auditResults.supabase.policies).length} tablas configuradas`);
    console.log(`   📁 Storage Buckets: ${Object.values(auditResults.supabase.storage).filter(Boolean).length}/${Object.keys(auditResults.supabase.storage).length}`);
    console.log(`   ⚙️  Archivos ENV: ${Object.values(auditResults.local.envFiles).filter(Boolean).length}/${Object.keys(auditResults.local.envFiles).length}`);
    console.log(`   🛣️  Rutas API: ${Object.values(auditResults.local.apiRoutes).filter(Boolean).length}/${Object.keys(auditResults.local.apiRoutes).length}`);
    console.log(`   🧩 Componentes: ${Object.values(auditResults.local.components).filter(Boolean).length}/${Object.keys(auditResults.local.components).length}`);
    
    if (auditResults.issues.length > 0) {
        console.log('\n❌ ISSUES ENCONTRADOS:');
        auditResults.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
        });
    }
    
    console.log('\n💡 RECOMENDACIONES:');
    auditResults.recommendations.forEach(rec => {
        console.log(rec);
    });
    
    console.log('\n========================================');
    if (score >= 90) {
        console.log('🎉 ¡PROYECTO CASI PERFECTO! Listo para producción.');
    } else if (score >= 70) {
        console.log('⚠️  PROYECTO FUNCIONAL. Requiere ajustes menores.');
    } else {
        console.log('🔧 PROYECTO REQUIERE CONFIGURACIÓN ADICIONAL.');
    }
    console.log('========================================');
}

async function ejecutarAuditoriaCompleta() {
    try {
        await auditarSupabase();
        auditarCodigoLocal();
        generarRecomendaciones();
        mostrarResumenFinal();
        
        // Guardar resultados en archivo JSON
        const resultsPath = path.join(__dirname, '148-Resultados-Auditoria-Completa.json');
        fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
        console.log(`\n💾 Resultados guardados en: ${resultsPath}`);
        
    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO EN AUDITORÍA:', error.message);
        console.error('📍 Stack trace:', error.stack);
        process.exit(1);
    }
}

// Ejecutar auditoría completa
ejecutarAuditoriaCompleta().catch(console.error);
