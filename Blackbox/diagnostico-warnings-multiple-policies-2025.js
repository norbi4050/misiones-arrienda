// =====================================================
// DIAGNÓSTICO COMPLETO: MULTIPLE PERMISSIVE POLICIES Y DUPLICATE INDEX
// =====================================================
// Fecha: 2025-01-27
// Objetivo: Analizar y diagnosticar warnings de rendimiento en Supabase
// Protocolo: Seguir flujo de trabajo eficiente sin romper el proyecto
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnosticarWarningsCompleto() {
    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE WARNINGS SUPABASE');
    console.log('=' .repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('=' .repeat(60));
    console.log('');

    const resultados = {
        timestamp: new Date().toISOString(),
        warnings: {
            multiplePermissivePolicies: [],
            duplicateIndex: []
        },
        analisis: {
            tablas: {},
            politicas: {},
            indices: {}
        },
        recomendaciones: [],
        impactoRendimiento: 'PENDIENTE'
    };

    try {
        // ====================================================================
        console.log('🔍 PASO 1: ANÁLISIS DE POLÍTICAS MÚLTIPLES');
        console.log('='.repeat(40));

        // Obtener todas las políticas RLS
        const { data: politicas, error: politicasError } = await supabase
            .rpc('sql', {
                query: `
                    SELECT 
                        schemaname,
                        tablename,
                        policyname,
                        cmd,
                        roles,
                        qual,
                        with_check
                    FROM pg_policies 
                    WHERE schemaname = 'public'
                    ORDER BY tablename, cmd, roles;
                `
            });

        if (politicasError) {
            console.log('❌ Error obteniendo políticas:', politicasError.message);
        } else {
            console.log(`📋 POLÍTICAS ENCONTRADAS: ${politicas.length}`);
            
            // Agrupar políticas por tabla, rol y acción
            const politicasAgrupadas = {};
            
            politicas.forEach(politica => {
                const tabla = politica.tablename;
                const accion = politica.cmd;
                const roles = politica.roles || ['public'];
                
                if (!politicasAgrupadas[tabla]) {
                    politicasAgrupadas[tabla] = {};
                }
                
                roles.forEach(rol => {
                    const clave = `${tabla}_${rol}_${accion}`;
                    
                    if (!politicasAgrupadas[tabla][clave]) {
                        politicasAgrupadas[tabla][clave] = [];
                    }
                    
                    politicasAgrupadas[tabla][clave].push({
                        nombre: politica.policyname,
                        condicion: politica.qual,
                        withCheck: politica.with_check
                    });
                });
            });

            // Identificar políticas múltiples
            Object.keys(politicasAgrupadas).forEach(tabla => {
                Object.keys(politicasAgrupadas[tabla]).forEach(clave => {
                    const politicasGrupo = politicasAgrupadas[tabla][clave];
                    
                    if (politicasGrupo.length > 1) {
                        const [tablaName, rol, accion] = clave.split('_');
                        
                        console.log(`⚠️ MÚLTIPLES POLÍTICAS DETECTADAS:`);
                        console.log(`   📋 Tabla: ${tablaName}`);
                        console.log(`   👤 Rol: ${rol}`);
                        console.log(`   🔧 Acción: ${accion}`);
                        console.log(`   📊 Cantidad: ${politicasGrupo.length}`);
                        
                        politicasGrupo.forEach((pol, index) => {
                            console.log(`      ${index + 1}. ${pol.nombre}`);
                            console.log(`         Condición: ${pol.condicion || 'N/A'}`);
                        });
                        console.log('');

                        resultados.warnings.multiplePermissivePolicies.push({
                            tabla: tablaName,
                            rol: rol,
                            accion: accion,
                            cantidad: politicasGrupo.length,
                            politicas: politicasGrupo.map(p => p.nombre),
                            impacto: 'PERFORMANCE'
                        });
                    }
                });
            });

            resultados.analisis.politicas = politicasAgrupadas;
        }

        // ====================================================================
        console.log('🔍 PASO 2: ANÁLISIS DE ÍNDICES DUPLICADOS');
        console.log('='.repeat(40));

        // Obtener información de índices
        const { data: indices, error: indicesError } = await supabase
            .rpc('sql', {
                query: `
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        indexdef
                    FROM pg_indexes 
                    WHERE schemaname = 'public'
                    ORDER BY tablename, indexname;
                `
            });

        if (indicesError) {
            console.log('❌ Error obteniendo índices:', indicesError.message);
        } else {
            console.log(`📋 ÍNDICES ENCONTRADOS: ${indices.length}`);
            
            // Agrupar índices por tabla y definición
            const indicesAgrupados = {};
            
            indices.forEach(indice => {
                const tabla = indice.tablename;
                const definicion = indice.indexdef;
                
                if (!indicesAgrupados[tabla]) {
                    indicesAgrupados[tabla] = {};
                }
                
                if (!indicesAgrupados[tabla][definicion]) {
                    indicesAgrupados[tabla][definicion] = [];
                }
                
                indicesAgrupados[tabla][definicion].push(indice.indexname);
            });

            // Identificar índices duplicados
            Object.keys(indicesAgrupados).forEach(tabla => {
                Object.keys(indicesAgrupados[tabla]).forEach(definicion => {
                    const indicesGrupo = indicesAgrupados[tabla][definicion];
                    
                    if (indicesGrupo.length > 1) {
                        console.log(`⚠️ ÍNDICES DUPLICADOS DETECTADOS:`);
                        console.log(`   📋 Tabla: ${tabla}`);
                        console.log(`   📊 Cantidad: ${indicesGrupo.length}`);
                        console.log(`   📝 Definición: ${definicion}`);
                        
                        indicesGrupo.forEach((indice, index) => {
                            console.log(`      ${index + 1}. ${indice}`);
                        });
                        console.log('');

                        resultados.warnings.duplicateIndex.push({
                            tabla: tabla,
                            cantidad: indicesGrupo.length,
                            indices: indicesGrupo,
                            definicion: definicion,
                            impacto: 'PERFORMANCE'
                        });
                    }
                });
            });

            resultados.analisis.indices = indicesAgrupados;
        }

        // ====================================================================
        console.log('🔍 PASO 3: ANÁLISIS DE IMPACTO EN RENDIMIENTO');
        console.log('='.repeat(40));

        const totalWarnings = resultados.warnings.multiplePermissivePolicies.length + 
                             resultados.warnings.duplicateIndex.length;

        console.log(`📊 RESUMEN DE WARNINGS:`);
        console.log(`   🔒 Políticas múltiples: ${resultados.warnings.multiplePermissivePolicies.length}`);
        console.log(`   📇 Índices duplicados: ${resultados.warnings.duplicateIndex.length}`);
        console.log(`   📈 Total warnings: ${totalWarnings}`);

        // Evaluar impacto
        let impactoGeneral = 'BAJO';
        if (totalWarnings > 20) {
            impactoGeneral = 'ALTO';
        } else if (totalWarnings > 10) {
            impactoGeneral = 'MEDIO';
        }

        resultados.impactoRendimiento = impactoGeneral;
        console.log(`   ⚡ Impacto en rendimiento: ${impactoGeneral}`);

        // ====================================================================
        console.log('🔍 PASO 4: GENERACIÓN DE RECOMENDACIONES');
        console.log('='.repeat(40));

        // Recomendaciones para políticas múltiples
        if (resultados.warnings.multiplePermissivePolicies.length > 0) {
            console.log('💡 RECOMENDACIONES PARA POLÍTICAS MÚLTIPLES:');
            
            resultados.warnings.multiplePermissivePolicies.forEach(warning => {
                const recomendacion = `Consolidar políticas en tabla ${warning.tabla} para rol ${warning.rol} y acción ${warning.accion}`;
                console.log(`   ✅ ${recomendacion}`);
                resultados.recomendaciones.push({
                    tipo: 'MULTIPLE_POLICIES',
                    tabla: warning.tabla,
                    accion: recomendacion,
                    prioridad: 'MEDIA'
                });
            });
        }

        // Recomendaciones para índices duplicados
        if (resultados.warnings.duplicateIndex.length > 0) {
            console.log('💡 RECOMENDACIONES PARA ÍNDICES DUPLICADOS:');
            
            resultados.warnings.duplicateIndex.forEach(warning => {
                const recomendacion = `Eliminar índices duplicados en tabla ${warning.tabla}, mantener solo uno`;
                console.log(`   ✅ ${recomendacion}`);
                resultados.recomendaciones.push({
                    tipo: 'DUPLICATE_INDEX',
                    tabla: warning.tabla,
                    accion: recomendacion,
                    prioridad: 'ALTA'
                });
            });
        }

        // ====================================================================
        console.log('');
        console.log('📊 RESUMEN FINAL DEL DIAGNÓSTICO');
        console.log('='.repeat(40));
        console.log(`✅ Warnings de políticas múltiples: ${resultados.warnings.multiplePermissivePolicies.length}`);
        console.log(`✅ Warnings de índices duplicados: ${resultados.warnings.duplicateIndex.length}`);
        console.log(`✅ Recomendaciones generadas: ${resultados.recomendaciones.length}`);
        console.log(`✅ Impacto en rendimiento: ${resultados.impactoRendimiento}`);
        console.log('');

        // Guardar resultados
        const fs = require('fs');
        const reportePath = 'Blackbox/DIAGNOSTICO-WARNINGS-MULTIPLE-POLICIES-2025.json';
        fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
        console.log(`📄 Reporte guardado en: ${reportePath}`);

        console.log('✅ DIAGNÓSTICO COMPLETADO EXITOSAMENTE');
        return resultados;

    } catch (error) {
        console.log('❌ ERROR DURANTE EL DIAGNÓSTICO:', error.message);
        return null;
    }
}

// Ejecutar diagnóstico
if (require.main === module) {
    diagnosticarWarningsCompleto().catch(console.error);
}

module.exports = { diagnosticarWarningsCompleto };
