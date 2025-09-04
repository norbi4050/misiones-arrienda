const https = require('https');

console.log('🔧 SOLUCIÓN DIRECTA: SECURITY DEFINER VIEWS');
console.log('==========================================');
console.log(`Fecha: ${new Date().toLocaleString()}`);
console.log('==========================================\n');

// Configuración con credenciales reales
const config = {
    supabaseUrl: 'https://qfeyhaaxymmnohqdele.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
    timeout: 60000
};

// Views problemáticas confirmadas
const problematicViews = [
    'analytics_dashboard',
    'user_stats', 
    'conversations_with_participants',
    'property_stats',
    'properties_with_agent'
];

let results = {
    total: 5,
    fixed: 0,
    errors: [],
    success: []
};

// Función para hacer peticiones HTTPS
function makeHttpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (error) => reject(error));
        req.setTimeout(config.timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Función para ejecutar SQL directo en Supabase
async function executeDirectSQL(sqlQuery, description) {
    console.log(`🔄 Ejecutando: ${description}`);
    
    try {
        const url = new URL(config.supabaseUrl);
        const response = await makeHttpsRequest({
            hostname: url.hostname,
            port: 443,
            path: '/rest/v1/rpc/query',
            method: 'POST',
            headers: {
                'apikey': config.serviceRoleKey,
                'Authorization': `Bearer ${config.serviceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
        }, JSON.stringify({
            query: sqlQuery
        }));

        if (response.statusCode >= 200 && response.statusCode < 300) {
            console.log(`✅ ${description} - EXITOSO`);
            return { success: true, response };
        } else {
            console.log(`❌ ${description} - Error: ${response.statusCode}`);
            console.log(`   Respuesta: ${response.data}`);
            return { success: false, error: `HTTP ${response.statusCode}: ${response.data}` };
        }
    } catch (error) {
        console.log(`❌ ${description} - Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Scripts SQL específicos para cada view
const sqlScripts = {
    analytics_dashboard: `
        DROP VIEW IF EXISTS public.analytics_dashboard CASCADE;
        CREATE VIEW public.analytics_dashboard AS
        SELECT 
            'properties' as table_name,
            COUNT(*)::bigint as total_count,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::bigint as last_30_days,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::bigint as last_7_days
        FROM properties
        UNION ALL
        SELECT 
            'users' as table_name,
            COUNT(*)::bigint as total_count,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::bigint as last_30_days,
            COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::bigint as last_7_days
        FROM auth.users;
        
        ALTER VIEW public.analytics_dashboard OWNER TO postgres;
        GRANT SELECT ON public.analytics_dashboard TO authenticated;
    `,
    
    user_stats: `
        DROP VIEW IF EXISTS public.user_stats CASCADE;
        CREATE VIEW public.user_stats AS
        SELECT 
            u.id,
            u.email,
            u.created_at as user_created_at,
            COALESCE(COUNT(DISTINCT p.id), 0)::bigint as properties_count,
            COALESCE(COUNT(DISTINCT f.id), 0)::bigint as favorites_count,
            COALESCE(COUNT(DISTINCT sh.id), 0)::bigint as searches_count
        FROM auth.users u
        LEFT JOIN properties p ON p.user_id = u.id
        LEFT JOIN favorites f ON f.user_id = u.id
        LEFT JOIN search_history sh ON sh.user_id = u.id
        GROUP BY u.id, u.email, u.created_at;
        
        ALTER VIEW public.user_stats OWNER TO postgres;
        GRANT SELECT ON public.user_stats TO authenticated;
    `,
    
    conversations_with_participants: `
        DROP VIEW IF EXISTS public.conversations_with_participants CASCADE;
        CREATE VIEW public.conversations_with_participants AS
        SELECT 
            c.id,
            c.created_at,
            c.updated_at,
            COALESCE(array_agg(DISTINCT cp.user_id) FILTER (WHERE cp.user_id IS NOT NULL), ARRAY[]::uuid[]) as participant_ids,
            COALESCE(COUNT(m.id), 0)::bigint as message_count,
            MAX(m.created_at) as last_message_at
        FROM conversations c
        LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
        LEFT JOIN messages m ON m.conversation_id = c.id
        GROUP BY c.id, c.created_at, c.updated_at;
        
        ALTER VIEW public.conversations_with_participants OWNER TO postgres;
        GRANT SELECT ON public.conversations_with_participants TO authenticated;
    `,
    
    property_stats: `
        DROP VIEW IF EXISTS public.property_stats CASCADE;
        CREATE VIEW public.property_stats AS
        SELECT 
            p.id,
            p.title,
            p.price,
            p.location,
            p.created_at,
            p.user_id,
            COALESCE(COUNT(DISTINCT f.id), 0)::bigint as favorites_count,
            COALESCE(COUNT(DISTINCT v.id), 0)::bigint as views_count,
            COALESCE(COUNT(DISTINCT i.id), 0)::bigint as inquiries_count
        FROM properties p
        LEFT JOIN favorites f ON f.property_id = p.id
        LEFT JOIN property_views v ON v.property_id = p.id
        LEFT JOIN inquiries i ON i.property_id = p.id
        GROUP BY p.id, p.title, p.price, p.location, p.created_at, p.user_id;
        
        ALTER VIEW public.property_stats OWNER TO postgres;
        GRANT SELECT ON public.property_stats TO authenticated;
    `,
    
    properties_with_agent: `
        DROP VIEW IF EXISTS public.properties_with_agent CASCADE;
        CREATE VIEW public.properties_with_agent AS
        SELECT 
            p.*,
            u.email as agent_email,
            cp.name as agent_name,
            cp.phone as agent_phone,
            cp.bio as agent_bio
        FROM properties p
        LEFT JOIN auth.users u ON u.id = p.user_id
        LEFT JOIN community_profiles cp ON cp.user_id = p.user_id;
        
        ALTER VIEW public.properties_with_agent OWNER TO postgres;
        GRANT SELECT ON public.properties_with_agent TO authenticated;
    `
};

// Función principal para corregir las views
async function corregirSecurityDefinerViews() {
    console.log('🚀 Iniciando corrección directa de Security Definer Views...\n');

    for (const viewName of problematicViews) {
        console.log(`\n📋 Procesando view: ${viewName}`);
        console.log('='.repeat(50));
        
        const sqlScript = sqlScripts[viewName];
        if (!sqlScript) {
            console.log(`❌ No se encontró script SQL para ${viewName}`);
            results.errors.push(`${viewName}: Script SQL no encontrado`);
            continue;
        }

        const result = await executeDirectSQL(sqlScript, `Recrear ${viewName} sin SECURITY DEFINER`);
        
        if (result.success) {
            results.fixed++;
            results.success.push(viewName);
            console.log(`✅ ${viewName} - CORREGIDA EXITOSAMENTE`);
        } else {
            results.errors.push(`${viewName}: ${result.error}`);
            console.log(`❌ ${viewName} - ERROR: ${result.error}`);
        }
        
        // Pausa entre operaciones
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Función para verificar las correcciones
async function verificarCorrecciones() {
    console.log('\n🔍 VERIFICANDO CORRECCIONES');
    console.log('===========================');

    for (const viewName of problematicViews) {
        try {
            const url = new URL(config.supabaseUrl);
            const response = await makeHttpsRequest({
                hostname: url.hostname,
                port: 443,
                path: `/rest/v1/${viewName}?select=*&limit=1`,
                method: 'GET',
                headers: {
                    'apikey': config.serviceRoleKey,
                    'Authorization': `Bearer ${config.serviceRoleKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.statusCode === 200) {
                console.log(`✅ ${viewName} - FUNCIONANDO CORRECTAMENTE`);
            } else {
                console.log(`⚠️ ${viewName} - Status: ${response.statusCode}`);
            }
        } catch (error) {
            console.log(`❌ ${viewName} - Error en verificación: ${error.message}`);
        }
        
        // Pausa entre verificaciones
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Función principal
async function main() {
    try {
        console.log('🎯 OBJETIVO: Eliminar SECURITY DEFINER de 5 views problemáticas');
        console.log('📋 Views a corregir:', problematicViews.join(', '));
        console.log('\n' + '='.repeat(60));

        // Ejecutar correcciones
        await corregirSecurityDefinerViews();

        // Verificar correcciones
        await verificarCorrecciones();

        // Generar reporte final
        console.log('\n📊 REPORTE FINAL');
        console.log('================');
        console.log(`Total de views: ${results.total}`);
        console.log(`Views corregidas: ${results.fixed}`);
        console.log(`Errores: ${results.errors.length}`);
        
        if (results.success.length > 0) {
            console.log('\n✅ VIEWS CORREGIDAS EXITOSAMENTE:');
            results.success.forEach((view, index) => {
                console.log(`${index + 1}. ${view}`);
            });
        }

        if (results.errors.length > 0) {
            console.log('\n❌ ERRORES ENCONTRADOS:');
            results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        // Calcular tasa de éxito
        const successRate = (results.fixed / results.total) * 100;
        console.log(`\n📈 Tasa de éxito: ${successRate.toFixed(1)}%`);

        if (successRate === 100) {
            console.log('\n🎉 ¡CORRECCIÓN COMPLETAMENTE EXITOSA!');
            console.log('✅ Todas las Security Definer Views han sido corregidas');
            console.log('✅ El Database Linter debería estar limpio ahora');
        } else if (successRate >= 80) {
            console.log('\n✅ CORRECCIÓN MAYORMENTE EXITOSA');
            console.log('⚠️ Algunas views pueden requerir atención manual');
        } else {
            console.log('\n❌ CORRECCIÓN PARCIAL');
            console.log('🔧 Se requiere intervención manual adicional');
        }

        // Guardar reporte
        const fs = require('fs');
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: results.total,
                fixed: results.fixed,
                errors: results.errors.length,
                successRate: successRate.toFixed(1) + '%'
            },
            successfulViews: results.success,
            errors: results.errors,
            problematicViews: problematicViews
        };

        fs.writeFileSync('189-REPORTE-CORRECCION-SECURITY-DEFINER-VIEWS-DIRECTO.json', 
                        JSON.stringify(report, null, 2));

        console.log('\n📄 Reporte guardado: 189-REPORTE-CORRECCION-SECURITY-DEFINER-VIEWS-DIRECTO.json');

    } catch (error) {
        console.error('\n💥 ERROR FATAL:', error.message);
        process.exit(1);
    }
}

// Ejecutar
main().then(() => {
    console.log('\n🏁 Proceso completado');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Error fatal:', error.message);
    process.exit(1);
});
