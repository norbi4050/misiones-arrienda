/**
 * SCRIPT DE VERIFICACIÓN DE DATOS ÚNICOS EN SUPABASE
 * 
 * Este script verifica si hay datos únicos en las tablas duplicadas
 * antes de proceder con la limpieza del esquema.
 * 
 * IMPORTANTE: Ejecutar ANTES de eliminar cualquier tabla
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Variables de entorno de Supabase no configuradas');
    console.log('Necesitas configurar:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 VERIFICACIÓN DE DATOS ÚNICOS EN TABLAS DUPLICADAS');
console.log('====================================================');

/**
 * Función para verificar datos únicos entre tablas duplicadas
 */
async function verificarDatosUnicos() {
    const resultados = {
        tablasPrincipales: {},
        tablasDuplicadas: {},
        datosUnicos: {},
        recomendaciones: []
    };

    try {
        // 1. VERIFICAR USUARIOS
        console.log('\n📋 1. VERIFICANDO USUARIOS...');
        
        // Contar registros en tabla principal
        const { data: usersPrincipal, error: errorUsersPrincipal } = await supabase
            .from('User')
            .select('id', { count: 'exact', head: true });
        
        if (!errorUsersPrincipal) {
            resultados.tablasPrincipales.User = usersPrincipal?.length || 0;
            console.log(`   ✅ Tabla "User" (principal): ${resultados.tablasPrincipales.User} registros`);
        } else {
            console.log(`   ❌ Error accediendo tabla "User": ${errorUsersPrincipal.message}`);
        }

        // Contar registros en tabla duplicada
        const { data: usersDuplicada, error: errorUsersDuplicada } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true });
        
        if (!errorUsersDuplicada) {
            resultados.tablasDuplicadas.users = usersDuplicada?.length || 0;
            console.log(`   ⚠️  Tabla "users" (duplicada): ${resultados.tablasDuplicadas.users} registros`);
        } else {
            console.log(`   ❌ Error accediendo tabla "users": ${errorUsersDuplicada.message}`);
        }

        // Verificar datos únicos en users que no estén en User
        if (!errorUsersDuplicada && !errorUsersPrincipal) {
            const { data: datosUnicosUsers, error: errorUnicos } = await supabase
                .rpc('verificar_usuarios_unicos');
            
            if (!errorUnicos && datosUnicosUsers) {
                resultados.datosUnicos.users = datosUnicosUsers.length;
                if (datosUnicosUsers.length > 0) {
                    console.log(`   🚨 DATOS ÚNICOS ENCONTRADOS: ${datosUnicosUsers.length} usuarios solo en tabla "users"`);
                    resultados.recomendaciones.push('MIGRAR datos únicos de "users" a "User" antes de eliminar');
                }
            }
        }

        // 2. VERIFICAR PROPIEDADES
        console.log('\n🏠 2. VERIFICANDO PROPIEDADES...');
        
        const { data: propertiesPrincipal, error: errorPropertiesPrincipal } = await supabase
            .from('Property')
            .select('id', { count: 'exact', head: true });
        
        if (!errorPropertiesPrincipal) {
            resultados.tablasPrincipales.Property = propertiesPrincipal?.length || 0;
            console.log(`   ✅ Tabla "Property" (principal): ${resultados.tablasPrincipales.Property} registros`);
        }

        const { data: propertiesDuplicada, error: errorPropertiesDuplicada } = await supabase
            .from('properties')
            .select('id', { count: 'exact', head: true });
        
        if (!errorPropertiesDuplicada) {
            resultados.tablasDuplicadas.properties = propertiesDuplicada?.length || 0;
            console.log(`   ⚠️  Tabla "properties" (duplicada): ${resultados.tablasDuplicadas.properties} registros`);
        }

        // 3. VERIFICAR AGENTES
        console.log('\n👨‍💼 3. VERIFICANDO AGENTES...');
        
        const { data: agentsPrincipal, error: errorAgentsPrincipal } = await supabase
            .from('Agent')
            .select('id', { count: 'exact', head: true });
        
        if (!errorAgentsPrincipal) {
            resultados.tablasPrincipales.Agent = agentsPrincipal?.length || 0;
            console.log(`   ✅ Tabla "Agent" (principal): ${resultados.tablasPrincipales.Agent} registros`);
        }

        const { data: agentsDuplicada, error: errorAgentsDuplicada } = await supabase
            .from('agents')
            .select('id', { count: 'exact', head: true });
        
        if (!errorAgentsDuplicada) {
            resultados.tablasDuplicadas.agents = agentsDuplicada?.length || 0;
            console.log(`   ⚠️  Tabla "agents" (duplicada): ${resultados.tablasDuplicadas.agents} registros`);
        }

        // 4. VERIFICAR FAVORITOS
        console.log('\n❤️  4. VERIFICANDO FAVORITOS...');
        
        const { data: favoritesPrincipal, error: errorFavoritesPrincipal } = await supabase
            .from('Favorite')
            .select('id', { count: 'exact', head: true });
        
        if (!errorFavoritesPrincipal) {
            resultados.tablasPrincipales.Favorite = favoritesPrincipal?.length || 0;
            console.log(`   ✅ Tabla "Favorite" (principal): ${resultados.tablasPrincipales.Favorite} registros`);
        }

        const { data: favoritesDuplicada, error: errorFavoritesDuplicada } = await supabase
            .from('favorites')
            .select('id', { count: 'exact', head: true });
        
        if (!errorFavoritesDuplicada) {
            resultados.tablasDuplicadas.favorites = favoritesDuplicada?.length || 0;
            console.log(`   ⚠️  Tabla "favorites" (duplicada): ${resultados.tablasDuplicadas.favorites} registros`);
        }

        // 5. VERIFICAR CONVERSACIONES
        console.log('\n💬 5. VERIFICANDO CONVERSACIONES...');
        
        const { data: conversationsPrincipal, error: errorConversationsPrincipal } = await supabase
            .from('Conversation')
            .select('id', { count: 'exact', head: true });
        
        if (!errorConversationsPrincipal) {
            resultados.tablasPrincipales.Conversation = conversationsPrincipal?.length || 0;
            console.log(`   ✅ Tabla "Conversation" (principal): ${resultados.tablasPrincipales.Conversation} registros`);
        }

        const { data: conversationsDuplicada, error: errorConversationsDuplicada } = await supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true });
        
        if (!errorConversationsDuplicada) {
            resultados.tablasDuplicadas.conversations = conversationsDuplicada?.length || 0;
            console.log(`   ⚠️  Tabla "conversations" (duplicada): ${resultados.tablasDuplicadas.conversations} registros`);
        }

        // 6. VERIFICAR TABLAS OBSOLETAS
        console.log('\n🗑️  6. VERIFICANDO TABLAS OBSOLETAS...');
        
        const tablasObsoletas = [
            'profiles',
            'community_profiles',
            'analytics_dashboard',
            'conversations_with_participants',
            'properties_with_agent',
            'property_stats',
            'user_stats'
        ];

        for (const tabla of tablasObsoletas) {
            try {
                const { data, error } = await supabase
                    .from(tabla)
                    .select('*', { count: 'exact', head: true });
                
                if (!error) {
                    const count = data?.length || 0;
                    console.log(`   📊 Tabla "${tabla}": ${count} registros`);
                    if (count > 0) {
                        resultados.recomendaciones.push(`REVISAR datos en tabla obsoleta "${tabla}" antes de eliminar`);
                    }
                } else {
                    console.log(`   ❌ Tabla "${tabla}" no existe o no es accesible`);
                }
            } catch (err) {
                console.log(`   ❌ Error verificando tabla "${tabla}": ${err.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error durante la verificación:', error.message);
        return null;
    }

    return resultados;
}

/**
 * Función para generar reporte de verificación
 */
function generarReporte(resultados) {
    console.log('\n📊 REPORTE DE VERIFICACIÓN');
    console.log('==========================');
    
    console.log('\n✅ TABLAS PRINCIPALES (MANTENER):');
    Object.entries(resultados.tablasPrincipales).forEach(([tabla, count]) => {
        console.log(`   • ${tabla}: ${count} registros`);
    });
    
    console.log('\n⚠️  TABLAS DUPLICADAS (ELIMINAR):');
    Object.entries(resultados.tablasDuplicadas).forEach(([tabla, count]) => {
        console.log(`   • ${tabla}: ${count} registros`);
    });
    
    if (Object.keys(resultados.datosUnicos).length > 0) {
        console.log('\n🚨 DATOS ÚNICOS ENCONTRADOS:');
        Object.entries(resultados.datosUnicos).forEach(([tabla, count]) => {
            console.log(`   • ${tabla}: ${count} registros únicos`);
        });
    }
    
    if (resultados.recomendaciones.length > 0) {
        console.log('\n📋 RECOMENDACIONES:');
        resultados.recomendaciones.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
        });
    }
    
    // Calcular estadísticas
    const totalPrincipales = Object.values(resultados.tablasPrincipales).reduce((a, b) => a + b, 0);
    const totalDuplicadas = Object.values(resultados.tablasDuplicadas).reduce((a, b) => a + b, 0);
    const totalUnicos = Object.values(resultados.datosUnicos).reduce((a, b) => a + b, 0);
    
    console.log('\n📈 ESTADÍSTICAS:');
    console.log(`   • Total registros en tablas principales: ${totalPrincipales}`);
    console.log(`   • Total registros en tablas duplicadas: ${totalDuplicadas}`);
    console.log(`   • Total registros únicos que requieren migración: ${totalUnicos}`);
    
    // Determinar si es seguro proceder
    const esSeguroEliminar = totalUnicos === 0 && resultados.recomendaciones.length === 0;
    
    console.log('\n🎯 CONCLUSIÓN:');
    if (esSeguroEliminar) {
        console.log('   ✅ ES SEGURO PROCEDER con la eliminación de tablas duplicadas');
        console.log('   ✅ No se encontraron datos únicos que requieran migración');
    } else {
        console.log('   ❌ NO ES SEGURO PROCEDER sin antes migrar datos únicos');
        console.log('   ⚠️  Revisar recomendaciones antes de continuar');
    }
    
    return esSeguroEliminar;
}

/**
 * Función principal
 */
async function main() {
    console.log('🚀 Iniciando verificación de datos únicos...\n');
    
    const resultados = await verificarDatosUnicos();
    
    if (!resultados) {
        console.error('❌ Error durante la verificación. Abortando.');
        process.exit(1);
    }
    
    const esSeguro = generarReporte(resultados);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 PRÓXIMOS PASOS:');
    
    if (esSeguro) {
        console.log('1. ✅ Crear backup completo de la base de datos');
        console.log('2. ✅ Ejecutar script de limpieza de tablas duplicadas');
        console.log('3. ✅ Verificar funcionamiento de APIs');
        console.log('4. ✅ Monitorear logs de errores');
    } else {
        console.log('1. ⚠️  MIGRAR datos únicos identificados');
        console.log('2. ⚠️  Revisar tablas obsoletas con datos');
        console.log('3. ⚠️  Ejecutar nuevamente esta verificación');
        console.log('4. ⚠️  Solo entonces proceder con la limpieza');
    }
    
    console.log('\n🔗 Archivos relacionados:');
    console.log('   • AUDITORIA-COMPLETA-ESQUEMAS-SUPABASE-2025.md');
    console.log('   • SCRIPT-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.sql (próximo)');
    
    process.exit(esSeguro ? 0 : 1);
}

// Ejecutar script
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

module.exports = {
    verificarDatosUnicos,
    generarReporte
};
