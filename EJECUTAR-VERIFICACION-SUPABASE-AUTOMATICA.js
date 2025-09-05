// =====================================================
// EJECUTAR VERIFICACIÓN AUTOMÁTICA EN SUPABASE
// =====================================================
// Fecha: 2025-01-09T15:45:00.000Z
// Propósito: Ejecutar verificación de datos únicos automáticamente
// =====================================================

const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('============================================================');
console.log('  EJECUTAR VERIFICACIÓN AUTOMÁTICA EN SUPABASE');
console.log('============================================================');
console.log('🔍 Ejecutando verificación de datos únicos automáticamente...');
console.log(`📅 Fecha: ${new Date().toLocaleString()}`);

// Verificar variables de entorno
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Error: Variables de entorno de Supabase no configuradas');
    console.log('📋 Necesitas configurar:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

console.log('✅ Variables de entorno configuradas correctamente');

// Función para ejecutar consulta SQL en Supabase
async function ejecutarConsultaSupabase(sql) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ sql })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.log(`❌ Error ejecutando consulta: ${error.message}`);
        return null;
    }
}

// Función para ejecutar verificación directa
async function ejecutarVerificacionDirecta() {
    console.log('🔍 Ejecutando verificación directa en Supabase...');
    
    const consultas = [
        {
            nombre: 'Verificar tablas duplicadas',
            sql: `
                SELECT 
                    table_name,
                    table_schema
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages', 'community_profiles')
                ORDER BY table_name;
            `
        },
        {
            nombre: 'Contar registros en tablas principales',
            sql: `
                SELECT 
                    'User' as tabla,
                    COUNT(*) as total_registros
                FROM "User"
                WHERE "User".id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'Property' as tabla,
                    COUNT(*) as total_registros
                FROM "Property"
                WHERE "Property".id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'Agent' as tabla,
                    COUNT(*) as total_registros
                FROM "Agent"
                WHERE "Agent".id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'Favorite' as tabla,
                    COUNT(*) as total_registros
                FROM "Favorite"
                WHERE "Favorite".id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'Conversation' as tabla,
                    COUNT(*) as total_registros
                FROM "Conversation"
                WHERE "Conversation".id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'Message' as tabla,
                    COUNT(*) as total_registros
                FROM "Message"
                WHERE "Message".id IS NOT NULL;
            `
        },
        {
            nombre: 'Verificar tablas duplicadas (minúsculas)',
            sql: `
                SELECT 
                    'users' as tabla_duplicada,
                    COUNT(*) as total_registros
                FROM users
                WHERE users.id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'properties' as tabla_duplicada,
                    COUNT(*) as total_registros
                FROM properties
                WHERE properties.id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'agents' as tabla_duplicada,
                    COUNT(*) as total_registros
                FROM agents
                WHERE agents.id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'favorites' as tabla_duplicada,
                    COUNT(*) as total_registros
                FROM favorites
                WHERE favorites.id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'conversations' as tabla_duplicada,
                    COUNT(*) as total_registros
                FROM conversations
                WHERE conversations.id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'messages' as tabla_duplicada,
                    COUNT(*) as total_registros
                FROM messages
                WHERE messages.id IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'community_profiles' as tabla_duplicada,
                    COUNT(*) as total_registros
                FROM community_profiles
                WHERE community_profiles.id IS NOT NULL;
            `
        }
    ];

    const resultados = {};
    
    for (const consulta of consultas) {
        console.log(`📊 Ejecutando: ${consulta.nombre}...`);
        const resultado = await ejecutarConsultaSupabase(consulta.sql);
        
        if (resultado) {
            resultados[consulta.nombre] = resultado;
            console.log(`✅ ${consulta.nombre} completada`);
        } else {
            console.log(`❌ Error en: ${consulta.nombre}`);
            resultados[consulta.nombre] = { error: 'No se pudo ejecutar la consulta' };
        }
    }

    return resultados;
}

// Función para analizar resultados y determinar seguridad
function analizarResultados(resultados) {
    console.log('\n📊 ANÁLISIS DE RESULTADOS:');
    console.log('============================================================');
    
    let esSeguro = true;
    let razonesInseguro = [];
    let recomendacion = '';
    
    // Analizar cada resultado
    Object.keys(resultados).forEach(consulta => {
        console.log(`\n🔍 ${consulta}:`);
        const resultado = resultados[consulta];
        
        if (resultado.error) {
            console.log(`❌ Error: ${resultado.error}`);
            esSeguro = false;
            razonesInseguro.push(`Error en ${consulta}`);
        } else if (Array.isArray(resultado)) {
            resultado.forEach(fila => {
                console.log(`   ${JSON.stringify(fila)}`);
                
                // Si hay datos en tablas duplicadas, no es seguro
                if (consulta.includes('duplicadas') && fila.total_registros > 0) {
                    esSeguro = false;
                    razonesInseguro.push(`Tabla ${fila.tabla_duplicada} tiene ${fila.total_registros} registros`);
                }
            });
        } else {
            console.log(`   ${JSON.stringify(resultado)}`);
        }
    });

    // Determinar recomendación
    if (esSeguro) {
        recomendacion = '🟢 VERDE - SEGURO PROCEDER';
        console.log('\n✅ RESULTADO: ES SEGURO PROCEDER CON LA LIMPIEZA');
        console.log('📋 Las tablas duplicadas están vacías o no existen');
        console.log('🚀 Puedes ejecutar el PASO 3 (limpieza) de forma segura');
    } else {
        recomendacion = '🔴 ROJO - NO PROCEDER';
        console.log('\n⚠️ RESULTADO: NO ES SEGURO PROCEDER');
        console.log('📋 Razones:');
        razonesInseguro.forEach(razon => {
            console.log(`   - ${razon}`);
        });
        console.log('🛑 NO ejecutes el PASO 3 hasta resolver estos problemas');
    }

    return {
        esSeguro,
        razonesInseguro,
        recomendacion,
        resultados
    };
}

// Función para generar reporte
function generarReporte(analisis) {
    const fecha = new Date().toISOString().split('T')[0];
    const reporte = `# REPORTE DE VERIFICACIÓN AUTOMÁTICA - ${fecha}

## 📊 RESUMEN EJECUTIVO

**Estado:** ${analisis.recomendacion}
**Fecha:** ${new Date().toLocaleString()}
**Es Seguro:** ${analisis.esSeguro ? 'SÍ' : 'NO'}

## 🔍 RESULTADOS DETALLADOS

${JSON.stringify(analisis.resultados, null, 2)}

## ⚠️ ANÁLISIS DE SEGURIDAD

${analisis.esSeguro ? 
    '✅ **SEGURO PROCEDER**\n\nLas tablas duplicadas están vacías o no contienen datos únicos. Es seguro ejecutar el PASO 3 de limpieza.' :
    `❌ **NO PROCEDER**\n\n**Problemas encontrados:**\n${analisis.razonesInseguro.map(r => `- ${r}`).join('\n')}\n\n**Acción requerida:** Resolver estos problemas antes de proceder con la limpieza.`
}

## 📋 PRÓXIMOS PASOS

${analisis.esSeguro ? 
    '1. ✅ Ejecutar PASO 3 (limpieza de tablas duplicadas)\n2. ✅ Verificar que la limpieza fue exitosa\n3. ✅ Completar el proceso de limpieza' :
    '1. ❌ NO ejecutar PASO 3\n2. 🔍 Investigar por qué hay datos en tablas duplicadas\n3. 📋 Migrar datos únicos si es necesario\n4. 🔄 Re-ejecutar verificación'
}

---
*Reporte generado automáticamente por el sistema de limpieza de esquemas Supabase*
`;

    const nombreArchivo = `REPORTE-VERIFICACION-AUTOMATICA-${fecha}.md`;
    fs.writeFileSync(nombreArchivo, reporte);
    console.log(`\n📄 Reporte generado: ${nombreArchivo}`);
    
    return nombreArchivo;
}

// Función principal
async function main() {
    try {
        console.log('🚀 Iniciando verificación automática...');
        
        const resultados = await ejecutarVerificacionDirecta();
        const analisis = analizarResultados(resultados);
        const archivoReporte = generarReporte(analisis);
        
        console.log('\n============================================================');
        console.log('  VERIFICACIÓN AUTOMÁTICA COMPLETADA');
        console.log('============================================================');
        console.log(`📊 Estado: ${analisis.recomendacion}`);
        console.log(`📄 Reporte: ${archivoReporte}`);
        
        if (analisis.esSeguro) {
            console.log('\n🎯 PRÓXIMO PASO: Ejecutar PASO 3 (limpieza)');
            console.log('💡 Comando: node PASO-3-LIMPIEZA-TABLAS-DUPLICADAS-SUPABASE.js');
        } else {
            console.log('\n⚠️ ACCIÓN REQUERIDA: Resolver problemas antes de continuar');
            console.log('📋 Revisa el reporte para más detalles');
        }
        
    } catch (error) {
        console.log(`❌ Error en verificación automática: ${error.message}`);
        process.exit(1);
    }
}

// Ejecutar
main();
