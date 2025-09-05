// =====================================================
// VERIFICACIÓN DIRECTA ALTERNATIVA - SUPABASE
// =====================================================
// Fecha: 2025-01-09T15:45:00.000Z
// Propósito: Verificar datos únicos usando API REST estándar
// =====================================================

const fs = require('fs');

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('============================================================');
console.log('  VERIFICACIÓN DIRECTA ALTERNATIVA - SUPABASE');
console.log('============================================================');
console.log('🔍 Verificando datos únicos usando API REST estándar...');
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

// Función para hacer consulta REST a Supabase
async function consultarTablaSupabase(tabla) {
    try {
        const url = `${SUPABASE_URL}/rest/v1/${tabla}?select=count`;
        const response = await fetch(url, {
            method: 'HEAD', // Solo queremos el count, no los datos
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            }
        });

        if (response.ok) {
            const count = response.headers.get('content-range');
            const totalCount = count ? parseInt(count.split('/')[1]) : 0;
            return { existe: true, count: totalCount };
        } else if (response.status === 404) {
            return { existe: false, count: 0 };
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        return { existe: false, count: 0, error: error.message };
    }
}

// Función principal de verificación
async function ejecutarVerificacionAlternativa() {
    console.log('🔍 Iniciando verificación alternativa...');
    
    const tablasAVerificar = [
        // Tablas principales (PascalCase)
        { nombre: 'User', tipo: 'principal' },
        { nombre: 'Property', tipo: 'principal' },
        { nombre: 'Agent', tipo: 'principal' },
        { nombre: 'Favorite', tipo: 'principal' },
        { nombre: 'Conversation', tipo: 'principal' },
        { nombre: 'Message', tipo: 'principal' },
        
        // Tablas duplicadas potenciales (minúsculas)
        { nombre: 'users', tipo: 'duplicada' },
        { nombre: 'properties', tipo: 'duplicada' },
        { nombre: 'agents', tipo: 'duplicada' },
        { nombre: 'favorites', tipo: 'duplicada' },
        { nombre: 'conversations', tipo: 'duplicada' },
        { nombre: 'messages', tipo: 'duplicada' },
        { nombre: 'community_profiles', tipo: 'duplicada' }
    ];

    const resultados = {};
    
    for (const tabla of tablasAVerificar) {
        console.log(`📊 Verificando tabla: ${tabla.nombre}...`);
        const resultado = await consultarTablaSupabase(tabla.nombre);
        resultados[tabla.nombre] = {
            ...resultado,
            tipo: tabla.tipo
        };
        
        if (resultado.error) {
            console.log(`❌ Error en ${tabla.nombre}: ${resultado.error}`);
        } else if (resultado.existe) {
            console.log(`✅ ${tabla.nombre}: ${resultado.count} registros`);
        } else {
            console.log(`⚪ ${tabla.nombre}: No existe`);
        }
    }

    return resultados;
}

// Función para analizar resultados
function analizarResultadosAlternativos(resultados) {
    console.log('\n📊 ANÁLISIS DE RESULTADOS:');
    console.log('============================================================');
    
    let esSeguro = true;
    let razonesInseguro = [];
    let tablasPrincipales = 0;
    let tablasDuplicadas = 0;
    let registrosEnDuplicadas = 0;
    
    Object.keys(resultados).forEach(tabla => {
        const resultado = resultados[tabla];
        
        if (resultado.tipo === 'principal') {
            if (resultado.existe) {
                tablasPrincipales++;
                console.log(`🟢 PRINCIPAL: ${tabla} - ${resultado.count} registros`);
            } else {
                console.log(`🔴 PRINCIPAL: ${tabla} - NO EXISTE`);
                esSeguro = false;
                razonesInseguro.push(`Tabla principal ${tabla} no existe`);
            }
        } else if (resultado.tipo === 'duplicada') {
            if (resultado.existe && resultado.count > 0) {
                tablasDuplicadas++;
                registrosEnDuplicadas += resultado.count;
                console.log(`🟡 DUPLICADA: ${tabla} - ${resultado.count} registros`);
                esSeguro = false;
                razonesInseguro.push(`Tabla duplicada ${tabla} tiene ${resultado.count} registros`);
            } else if (resultado.existe && resultado.count === 0) {
                console.log(`🟢 DUPLICADA: ${tabla} - VACÍA (seguro eliminar)`);
            } else {
                console.log(`⚪ DUPLICADA: ${tabla} - NO EXISTE`);
            }
        }
    });

    // Determinar recomendación final
    let recomendacion = '';
    if (tablasPrincipales === 0) {
        recomendacion = '🔴 CRÍTICO - NO HAY TABLAS PRINCIPALES';
        esSeguro = false;
        razonesInseguro.push('No se encontraron tablas principales');
    } else if (registrosEnDuplicadas > 0) {
        recomendacion = '🟡 PRECAUCIÓN - HAY DATOS EN TABLAS DUPLICADAS';
        esSeguro = false;
    } else if (tablasDuplicadas > 0) {
        recomendacion = '🟢 SEGURO - TABLAS DUPLICADAS VACÍAS';
        esSeguro = true;
    } else {
        recomendacion = '🟢 PERFECTO - NO HAY TABLAS DUPLICADAS';
        esSeguro = true;
    }

    console.log('\n📋 RESUMEN:');
    console.log(`   Tablas principales encontradas: ${tablasPrincipales}`);
    console.log(`   Tablas duplicadas con datos: ${tablasDuplicadas}`);
    console.log(`   Total registros en duplicadas: ${registrosEnDuplicadas}`);

    return {
        esSeguro,
        razonesInseguro,
        recomendacion,
        estadisticas: {
            tablasPrincipales,
            tablasDuplicadas,
            registrosEnDuplicadas
        },
        resultados
    };
}

// Función para generar reporte
function generarReporteAlternativo(analisis) {
    const fecha = new Date().toISOString().split('T')[0];
    const reporte = `# REPORTE DE VERIFICACIÓN ALTERNATIVA - ${fecha}

## 📊 RESUMEN EJECUTIVO

**Estado:** ${analisis.recomendacion}
**Fecha:** ${new Date().toLocaleString()}
**Es Seguro:** ${analisis.esSeguro ? 'SÍ' : 'NO'}

## 📈 ESTADÍSTICAS

- **Tablas principales encontradas:** ${analisis.estadisticas.tablasPrincipales}
- **Tablas duplicadas con datos:** ${analisis.estadisticas.tablasDuplicadas}
- **Total registros en duplicadas:** ${analisis.estadisticas.registrosEnDuplicadas}

## 🔍 RESULTADOS DETALLADOS

### Tablas Principales (PascalCase)
${Object.keys(analisis.resultados)
    .filter(tabla => analisis.resultados[tabla].tipo === 'principal')
    .map(tabla => {
        const r = analisis.resultados[tabla];
        return `- **${tabla}**: ${r.existe ? `✅ ${r.count} registros` : '❌ No existe'}`;
    }).join('\n')}

### Tablas Duplicadas (minúsculas)
${Object.keys(analisis.resultados)
    .filter(tabla => analisis.resultados[tabla].tipo === 'duplicada')
    .map(tabla => {
        const r = analisis.resultados[tabla];
        if (!r.existe) return `- **${tabla}**: ⚪ No existe`;
        if (r.count === 0) return `- **${tabla}**: 🟢 Existe pero vacía (seguro eliminar)`;
        return `- **${tabla}**: 🟡 ${r.count} registros (REVISAR ANTES DE ELIMINAR)`;
    }).join('\n')}

## ⚠️ ANÁLISIS DE SEGURIDAD

${analisis.esSeguro ? 
    '✅ **SEGURO PROCEDER CON LIMPIEZA**\n\nLas tablas duplicadas están vacías o no existen. Es seguro ejecutar el PASO 3 de limpieza.' :
    `❌ **NO PROCEDER CON LIMPIEZA**\n\n**Problemas encontrados:**\n${analisis.razonesInseguro.map(r => `- ${r}`).join('\n')}\n\n**Acción requerida:** Resolver estos problemas antes de proceder con la limpieza.`
}

## 📋 PRÓXIMOS PASOS

${analisis.esSeguro ? 
    '1. ✅ Ejecutar PASO 3 (limpieza de tablas duplicadas)\n2. ✅ Verificar que la limpieza fue exitosa\n3. ✅ Completar el proceso de limpieza' :
    '1. ❌ NO ejecutar PASO 3\n2. 🔍 Investigar datos en tablas duplicadas\n3. 📋 Migrar datos únicos si es necesario\n4. 🔄 Re-ejecutar verificación'
}

---
*Reporte generado automáticamente por el sistema de verificación alternativa*
`;

    const nombreArchivo = `REPORTE-VERIFICACION-ALTERNATIVA-${fecha}.md`;
    fs.writeFileSync(nombreArchivo, reporte);
    console.log(`\n📄 Reporte generado: ${nombreArchivo}`);
    
    return nombreArchivo;
}

// Función principal
async function main() {
    try {
        const resultados = await ejecutarVerificacionAlternativa();
        const analisis = analizarResultadosAlternativos(resultados);
        const archivoReporte = generarReporteAlternativo(analisis);
        
        console.log('\n============================================================');
        console.log('  VERIFICACIÓN ALTERNATIVA COMPLETADA');
        console.log('============================================================');
        console.log(`📊 Estado: ${analisis.recomendacion}`);
        console.log(`📄 Reporte: ${archivoReporte}`);
        
        if (analisis.esSeguro) {
            console.log('\n🎯 RESULTADO: ES SEGURO PROCEDER CON EL PASO 3');
            console.log('💡 Las tablas duplicadas están vacías o no existen');
            console.log('🚀 Puedes ejecutar la limpieza de forma segura');
        } else {
            console.log('\n⚠️ RESULTADO: NO ES SEGURO PROCEDER');
            console.log('📋 Hay datos en tablas duplicadas que necesitan revisión');
            console.log('🛑 NO ejecutes el PASO 3 hasta resolver los problemas');
        }
        
    } catch (error) {
        console.log(`❌ Error en verificación alternativa: ${error.message}`);
        process.exit(1);
    }
}

// Ejecutar
main();
