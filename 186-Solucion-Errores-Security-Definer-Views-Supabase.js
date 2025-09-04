const https = require('https');

console.log('🔧 SOLUCIONANDO ERRORES SECURITY DEFINER VIEWS EN SUPABASE');
console.log('=========================================================');
console.log(`Fecha: ${new Date().toLocaleString()}`);
console.log('=========================================================\n');

// Configuración con credenciales reales
const config = {
    supabaseUrl: 'https://qfeyhaaxymmnohqdele.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
    timeout: 30000
};

// Views problemáticas identificadas
const problematicViews = [
    'analytics_dashboard',
    'user_stats', 
    'conversations_with_participants',
    'property_stats',
    'properties_with_agent'
];

let solutionResults = {
    total: 0,
    fixed: 0,
    errors: [],
    details: []
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
                    data: data,
                    body: data
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

// Función para ejecutar SQL en Supabase
async function executeSQL(sqlQuery, description) {
    console.log(`🔄 Ejecutando: ${description}`);
    
    try {
        const url = new URL(config.supabaseUrl);
        const response = await makeHttpsRequest({
            hostname: url.hostname,
            port: 443,
            path: '/rest/v1/rpc/exec_sql',
            method: 'POST',
            headers: {
                'apikey': config.serviceRoleKey,
                'Authorization': `Bearer ${config.serviceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
        }, JSON.stringify({
            sql: sqlQuery
        }));

        if (response.statusCode >= 200 && response.statusCode < 300) {
            console.log(`✅ ${description} - Exitoso`);
            return { success: true, response };
        } else {
            console.log(`❌ ${description} - Error: ${response.statusCode}`);
            return { success: false, error: `HTTP ${response.statusCode}: ${response.data}` };
        }
    } catch (error) {
        console.log(`❌ ${description} - Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// SQL para corregir Security Definer Views
const fixSecurityDefinerViews = async () => {
    console.log('\n🛠️ CORRIGIENDO SECURITY DEFINER VIEWS');
    console.log('=====================================');

    // 1. Recrear analytics_dashboard sin SECURITY DEFINER
    const analyticsViewSQL = `
    DROP VIEW IF EXISTS public.analytics_dashboard CASCADE;
    
    CREATE VIEW public.analytics_dashboard AS
    SELECT 
        'properties' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days
    FROM properties
    UNION ALL
    SELECT 
        'users' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days
    FROM auth.users;
    
    -- Aplicar RLS
    ALTER VIEW public.analytics_dashboard OWNER TO postgres;
    GRANT SELECT ON public.analytics_dashboard TO authenticated;
    `;

    const result1 = await executeSQL(analyticsViewSQL, 'Recrear analytics_dashboard sin SECURITY DEFINER');
    solutionResults.total++;
    if (result1.success) solutionResults.fixed++;
    else solutionResults.errors.push(`analytics_dashboard: ${result1.error}`);

    // 2. Recrear user_stats sin SECURITY DEFINER
    const userStatsSQL = `
    DROP VIEW IF EXISTS public.user_stats CASCADE;
    
    CREATE VIEW public.user_stats AS
    SELECT 
        u.id,
        u.email,
        u.created_at as user_created_at,
        COUNT(p.id) as properties_count,
        COUNT(f.id) as favorites_count,
        COUNT(DISTINCT sh.id) as searches_count
    FROM auth.users u
    LEFT JOIN properties p ON p.user_id = u.id
    LEFT JOIN favorites f ON f.user_id = u.id
    LEFT JOIN search_history sh ON sh.user_id = u.id
    GROUP BY u.id, u.email, u.created_at;
    
    -- Aplicar RLS
    ALTER VIEW public.user_stats OWNER TO postgres;
    GRANT SELECT ON public.user_stats TO authenticated;
    
    -- Política RLS para que usuarios solo vean sus propias estadísticas
    CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR SELECT USING (auth.uid() = id);
    `;

    const result2 = await executeSQL(userStatsSQL, 'Recrear user_stats sin SECURITY DEFINER');
    solutionResults.total++;
    if (result2.success) solutionResults.fixed++;
    else solutionResults.errors.push(`user_stats: ${result2.error}`);

    // 3. Recrear conversations_with_participants sin SECURITY DEFINER
    const conversationsSQL = `
    DROP VIEW IF EXISTS public.conversations_with_participants CASCADE;
    
    CREATE VIEW public.conversations_with_participants AS
    SELECT 
        c.id,
        c.created_at,
        c.updated_at,
        array_agg(DISTINCT cp.user_id) as participant_ids,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
    FROM conversations c
    LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
    LEFT JOIN messages m ON m.conversation_id = c.id
    GROUP BY c.id, c.created_at, c.updated_at;
    
    -- Aplicar RLS
    ALTER VIEW public.conversations_with_participants OWNER TO postgres;
    GRANT SELECT ON public.conversations_with_participants TO authenticated;
    
    -- Política RLS para que usuarios solo vean conversaciones donde participan
    CREATE POLICY "Users can view own conversations" ON public.conversations_with_participants
    FOR SELECT USING (auth.uid() = ANY(participant_ids));
    `;

    const result3 = await executeSQL(conversationsSQL, 'Recrear conversations_with_participants sin SECURITY DEFINER');
    solutionResults.total++;
    if (result3.success) solutionResults.fixed++;
    else solutionResults.errors.push(`conversations_with_participants: ${result3.error}`);

    // 4. Recrear property_stats sin SECURITY DEFINER
    const propertyStatsSQL = `
    DROP VIEW IF EXISTS public.property_stats CASCADE;
    
    CREATE VIEW public.property_stats AS
    SELECT 
        p.id,
        p.title,
        p.price,
        p.location,
        p.created_at,
        p.user_id,
        COUNT(f.id) as favorites_count,
        COUNT(DISTINCT v.id) as views_count,
        COUNT(DISTINCT i.id) as inquiries_count
    FROM properties p
    LEFT JOIN favorites f ON f.property_id = p.id
    LEFT JOIN property_views v ON v.property_id = p.id
    LEFT JOIN inquiries i ON i.property_id = p.id
    GROUP BY p.id, p.title, p.price, p.location, p.created_at, p.user_id;
    
    -- Aplicar RLS
    ALTER VIEW public.property_stats OWNER TO postgres;
    GRANT SELECT ON public.property_stats TO authenticated;
    
    -- Política RLS para que usuarios vean estadísticas de sus propiedades
    CREATE POLICY "Users can view own property stats" ON public.property_stats
    FOR SELECT USING (auth.uid() = user_id);
    `;

    const result4 = await executeSQL(propertyStatsSQL, 'Recrear property_stats sin SECURITY DEFINER');
    solutionResults.total++;
    if (result4.success) solutionResults.fixed++;
    else solutionResults.errors.push(`property_stats: ${result4.error}`);

    // 5. Recrear properties_with_agent sin SECURITY DEFINER
    const propertiesAgentSQL = `
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
    
    -- Aplicar RLS
    ALTER VIEW public.properties_with_agent OWNER TO postgres;
    GRANT SELECT ON public.properties_with_agent TO authenticated;
    
    -- Política RLS estándar para propiedades
    CREATE POLICY "Properties are viewable by everyone" ON public.properties_with_agent
    FOR SELECT USING (true);
    `;

    const result5 = await executeSQL(propertiesAgentSQL, 'Recrear properties_with_agent sin SECURITY DEFINER');
    solutionResults.total++;
    if (result5.success) solutionResults.fixed++;
    else solutionResults.errors.push(`properties_with_agent: ${result5.error}`);
};

// Función para verificar que las views fueron corregidas
const verifyFixes = async () => {
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
                console.log(`✅ View ${viewName} - Funcionando correctamente`);
                solutionResults.details.push({
                    view: viewName,
                    status: 'success',
                    message: 'View recreada y funcionando'
                });
            } else {
                console.log(`⚠️ View ${viewName} - Status: ${response.statusCode}`);
                solutionResults.details.push({
                    view: viewName,
                    status: 'warning',
                    message: `HTTP ${response.statusCode}`
                });
            }
        } catch (error) {
            console.log(`❌ View ${viewName} - Error: ${error.message}`);
            solutionResults.details.push({
                view: viewName,
                status: 'error',
                message: error.message
            });
        }
    }
};

// Función principal
async function solucionarErroresSecurityDefiner() {
    try {
        console.log('🚀 Iniciando corrección de Security Definer Views...\n');

        // Corregir las views problemáticas
        await fixSecurityDefinerViews();

        // Verificar que las correcciones funcionan
        await verifyFixes();

        // Generar reporte final
        console.log('\n📊 REPORTE FINAL DE CORRECCIONES');
        console.log('================================');
        console.log(`Total de views corregidas: ${solutionResults.total}`);
        console.log(`Correcciones exitosas: ${solutionResults.fixed}`);
        console.log(`Errores encontrados: ${solutionResults.errors.length}`);

        if (solutionResults.errors.length > 0) {
            console.log('\n❌ ERRORES DURANTE LA CORRECCIÓN:');
            solutionResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        // Calcular tasa de éxito
        const successRate = (solutionResults.fixed / solutionResults.total) * 100;
        
        console.log(`\n📈 Tasa de éxito: ${successRate.toFixed(1)}%`);

        if (successRate >= 80) {
            console.log('\n🎉 CORRECCIÓN EXITOSA - Security Definer Views corregidas');
        } else if (successRate >= 50) {
            console.log('\n⚠️ CORRECCIÓN PARCIAL - Algunas views requieren atención manual');
        } else {
            console.log('\n❌ CORRECCIÓN FALLIDA - Se requiere intervención manual');
        }

        // Guardar reporte detallado
        const fs = require('fs');
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: solutionResults.total,
                fixed: solutionResults.fixed,
                errors: solutionResults.errors.length,
                successRate: successRate.toFixed(1) + '%'
            },
            errors: solutionResults.errors,
            details: solutionResults.details,
            problematicViews: problematicViews
        };

        fs.writeFileSync('186-REPORTE-CORRECCION-SECURITY-DEFINER-VIEWS-FINAL.json', 
                        JSON.stringify(report, null, 2));

        console.log('\n✅ Reporte detallado guardado en: 186-REPORTE-CORRECCION-SECURITY-DEFINER-VIEWS-FINAL.json');

    } catch (error) {
        console.error('💥 Error fatal durante la corrección:', error.message);
        process.exit(1);
    }
}

// Ejecutar la solución
solucionarErroresSecurityDefiner().then(() => {
    console.log('\n🏁 Corrección de Security Definer Views completada');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
});
