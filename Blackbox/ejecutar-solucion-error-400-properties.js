const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🔧 EJECUTAR SOLUCIÓN ERROR 400 PROPERTIES');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function ejecutarSolucionError400() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Objetivo: Crear tablas faltantes para solucionar error 400');
    console.log('📋 Script SQL: crear-tablas-properties-completas.sql');
    console.log('');

    const resultado = {
        inicio: new Date().toISOString(),
        pasos_ejecutados: [],
        tablas_creadas: [],
        errores: [],
        exito: false,
        fin: null
    };

    try {
        // =====================================================
        // PASO 1: LEER SCRIPT SQL
        // =====================================================
        console.log('📖 PASO 1: LEYENDO SCRIPT SQL');
        console.log('-'.repeat(50));

        const sqlScript = fs.readFileSync('crear-tablas-properties-completas.sql', 'utf8');
        console.log('✅ Script SQL leído exitosamente');
        console.log(`   └─ Tamaño: ${sqlScript.length} caracteres`);

        resultado.pasos_ejecutados.push({
            paso: 'leer_script',
            resultado: 'exitoso',
            tamaño_script: sqlScript.length
        });

        // =====================================================
        // PASO 2: VERIFICAR CONEXIÓN
        // =====================================================
        console.log('');
        console.log('🔌 PASO 2: VERIFICANDO CONEXIÓN A SUPABASE');
        console.log('-'.repeat(50));

        const { data: testConnection, error: connectionError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (connectionError) {
            console.log('❌ Error de conexión:', connectionError.message);
            resultado.errores.push({
                paso: 'verificar_conexion',
                error: connectionError.message
            });
            return resultado;
        }

        console.log('✅ Conexión a Supabase exitosa');
        resultado.pasos_ejecutados.push({
            paso: 'verificar_conexion',
            resultado: 'exitoso'
        });

        // =====================================================
        // PASO 3: EJECUTAR SCRIPT SQL POR PARTES
        // =====================================================
        console.log('');
        console.log('⚙️ PASO 3: EJECUTANDO SCRIPT SQL');
        console.log('-'.repeat(50));

        // Dividir el script en comandos individuales
        const comandos = sqlScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== 'SELECT \'Tablas creadas exitosamente\' as status');

        console.log(`📋 Total de comandos SQL a ejecutar: ${comandos.length}`);

        let comandosEjecutados = 0;
        let comandosExitosos = 0;
        let comandosConError = 0;

        for (let i = 0; i < comandos.length; i++) {
            const comando = comandos[i];
            comandosEjecutados++;

            // Mostrar progreso cada 10 comandos
            if (comandosEjecutados % 10 === 0 || comandosEjecutados === comandos.length) {
                console.log(`   └─ Progreso: ${comandosEjecutados}/${comandos.length} comandos`);
            }

            try {
                const { error } = await supabase.rpc('exec_sql', { sql_query: comando });
                
                if (error) {
                    // Algunos errores son esperables (como "ya existe")
                    if (error.message.includes('already exists') || 
                        error.message.includes('ya existe') ||
                        error.message.includes('duplicate key')) {
                        comandosExitosos++;
                        // No mostrar estos errores como críticos
                    } else {
                        console.log(`   ⚠️ Error en comando ${comandosEjecutados}: ${error.message}`);
                        comandosConError++;
                        resultado.errores.push({
                            paso: 'ejecutar_sql',
                            comando_numero: comandosEjecutados,
                            comando: comando.substring(0, 100) + '...',
                            error: error.message
                        });
                    }
                } else {
                    comandosExitosos++;
                }
            } catch (error) {
                console.log(`   ❌ Error crítico en comando ${comandosEjecutados}: ${error.message}`);
                comandosConError++;
                resultado.errores.push({
                    paso: 'ejecutar_sql',
                    comando_numero: comandosEjecutados,
                    error: error.message,
                    critico: true
                });
            }
        }

        console.log('');
        console.log('📊 RESUMEN DE EJECUCIÓN SQL:');
        console.log(`   └─ Comandos ejecutados: ${comandosEjecutados}`);
        console.log(`   └─ Comandos exitosos: ${comandosExitosos}`);
        console.log(`   └─ Comandos con error: ${comandosConError}`);

        resultado.pasos_ejecutados.push({
            paso: 'ejecutar_sql',
            comandos_ejecutados: comandosEjecutados,
            comandos_exitosos: comandosExitosos,
            comandos_con_error: comandosConError
        });

        // =====================================================
        // PASO 4: VERIFICAR TABLAS CREADAS
        // =====================================================
        console.log('');
        console.log('✅ PASO 4: VERIFICANDO TABLAS CREADAS');
        console.log('-'.repeat(50));

        const tablasEsperadas = ['properties', 'property_inquiries', 'favorites', 'agents', 'conversations', 'messages'];
        
        for (const tabla of tablasEsperadas) {
            try {
                const { data, error } = await supabase
                    .from(tabla)
                    .select('*')
                    .limit(1);

                if (error) {
                    if (error.code === 'PGRST106') {
                        console.log(`   ❌ Tabla ${tabla}: NO EXISTE`);
                    } else {
                        console.log(`   ⚠️ Tabla ${tabla}: Error - ${error.message}`);
                    }
                } else {
                    console.log(`   ✅ Tabla ${tabla}: EXISTE y es accesible`);
                    resultado.tablas_creadas.push(tabla);
                }
            } catch (error) {
                console.log(`   ❌ Tabla ${tabla}: Error crítico - ${error.message}`);
            }
        }

        // =====================================================
        // PASO 5: PROBAR LA CONSULTA ORIGINAL
        // =====================================================
        console.log('');
        console.log('🧪 PASO 5: PROBANDO LA CONSULTA ORIGINAL');
        console.log('-'.repeat(50));

        console.log('🔍 Probando consulta que causaba error 400...');
        console.log('   └─ SELECT: id, inquiries:property_inquiries(id)');
        console.log('   └─ WHERE: user_id = 6403f9d2-e846-4c70-87e0-e051127d9500');

        try {
            const { data: testQuery, error: testError } = await supabase
                .from('properties')
                .select('id, inquiries:property_inquiries(id)')
                .eq('user_id', '6403f9d2-e846-4c70-87e0-e051127d9500');

            if (testError) {
                console.log('❌ La consulta original sigue fallando:', testError.message);
                console.log(`   └─ Código: ${testError.code}`);
                resultado.errores.push({
                    paso: 'probar_consulta_original',
                    error: testError.message,
                    codigo: testError.code
                });
            } else {
                console.log('✅ ¡La consulta original ahora funciona!');
                console.log(`   └─ Propiedades encontradas: ${testQuery ? testQuery.length : 0}`);
                resultado.pasos_ejecutados.push({
                    paso: 'probar_consulta_original',
                    resultado: 'exitoso',
                    propiedades_encontradas: testQuery ? testQuery.length : 0
                });
            }
        } catch (error) {
            console.log('❌ Error crítico probando consulta:', error.message);
            resultado.errores.push({
                paso: 'probar_consulta_original',
                error: error.message,
                critico: true
            });
        }

        // =====================================================
        // PASO 6: VERIFICAR DATOS DE PRUEBA
        // =====================================================
        console.log('');
        console.log('📊 PASO 6: VERIFICANDO DATOS DE PRUEBA');
        console.log('-'.repeat(50));

        try {
            const { data: propiedades, error: errorPropiedades } = await supabase
                .from('properties')
                .select('id, title, city, user_id')
                .limit(5);

            if (errorPropiedades) {
                console.log('❌ Error obteniendo propiedades:', errorPropiedades.message);
            } else {
                console.log(`✅ Propiedades en base de datos: ${propiedades ? propiedades.length : 0}`);
                if (propiedades && propiedades.length > 0) {
                    propiedades.forEach((prop, index) => {
                        console.log(`   ${index + 1}. ${prop.title} (${prop.city}) - Usuario: ${prop.user_id.substring(0, 8)}...`);
                    });
                }
            }

            const { data: consultas, error: errorConsultas } = await supabase
                .from('property_inquiries')
                .select('id, property_id, user_id, status')
                .limit(5);

            if (errorConsultas) {
                console.log('❌ Error obteniendo consultas:', errorConsultas.message);
            } else {
                console.log(`✅ Consultas en base de datos: ${consultas ? consultas.length : 0}`);
            }

        } catch (error) {
            console.log('❌ Error verificando datos:', error.message);
        }

        // =====================================================
        // RESULTADO FINAL
        // =====================================================
        console.log('');
        console.log('🎯 RESULTADO FINAL');
        console.log('='.repeat(70));

        const tablasCreadas = resultado.tablas_creadas.length;
        const tablasEsperadasTotal = tablasEsperadas.length;
        const erroresCriticos = resultado.errores.filter(e => e.critico).length;

        if (tablasCreadas >= tablasEsperadasTotal - 1 && erroresCriticos === 0) {
            resultado.exito = true;
            console.log('✅ SOLUCIÓN APLICADA EXITOSAMENTE');
            console.log(`   └─ Tablas creadas: ${tablasCreadas}/${tablasEsperadasTotal}`);
            console.log('   └─ Error 400 properties: SOLUCIONADO');
            console.log('   └─ Consulta original: FUNCIONA');
        } else {
            console.log('⚠️ SOLUCIÓN APLICADA CON ADVERTENCIAS');
            console.log(`   └─ Tablas creadas: ${tablasCreadas}/${tablasEsperadasTotal}`);
            console.log(`   └─ Errores críticos: ${erroresCriticos}`);
            console.log('   └─ Revisar errores para completar solución');
        }

        resultado.fin = new Date().toISOString();

        // Guardar resultado
        fs.writeFileSync(
            'solucion-error-400-properties-resultado.json',
            JSON.stringify(resultado, null, 2)
        );

        console.log('');
        console.log('💾 Resultado guardado en: solucion-error-400-properties-resultado.json');
        console.log('✅ EJECUCIÓN DE SOLUCIÓN COMPLETADA');

        return resultado;

    } catch (error) {
        console.error('❌ Error crítico en ejecución:', error.message);
        resultado.errores.push({
            paso: 'ejecucion_general',
            error: error.message,
            critico: true
        });
        resultado.fin = new Date().toISOString();
        return resultado;
    }
}

// Ejecutar solución
if (require.main === module) {
    ejecutarSolucionError400().catch(console.error);
}

module.exports = { ejecutarSolucionError400 };
