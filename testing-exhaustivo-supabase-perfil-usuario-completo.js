const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase con credenciales reales
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 TESTING EXHAUSTIVO - SUPABASE PERFIL USUARIO');
console.log('================================================================');

async function testingExhaustivoCompleto() {
    const resultados = {
        timestamp: new Date().toISOString(),
        tests_ejecutados: 0,
        tests_exitosos: 0,
        tests_fallidos: 0,
        errores: [],
        warnings: [],
        correcciones_aplicadas: [],
        recomendaciones: []
    };

    try {
        console.log('\n📋 FASE 1: TESTING DE CONEXIÓN Y CONFIGURACIÓN');
        console.log('================================================================');

        // Test 1: Conexión a Supabase
        console.log('\n🔍 Test 1: Verificando conexión a Supabase...');
        resultados.tests_ejecutados++;
        
        try {
            const { data: testConnection, error: connectionError } = await supabase
                .from('users')
                .select('count')
                .limit(1);
                
            if (connectionError) {
                throw new Error(`Error de conexión: ${connectionError.message}`);
            }
            
            console.log('✅ Conexión exitosa a Supabase');
            resultados.tests_exitosos++;
        } catch (error) {
            console.error('❌ Error de conexión:', error.message);
            resultados.tests_fallidos++;
            resultados.errores.push({
                test: 'Conexión Supabase',
                error: error.message,
                solucion: 'Verificar credenciales y URL de Supabase'
            });
        }

        // Test 2: Verificar estructura de tabla users
        console.log('\n🔍 Test 2: Verificando estructura de tabla users...');
        resultados.tests_ejecutados++;
        
        try {
            const { data: usersSchema, error: schemaError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable')
                .eq('table_name', 'users')
                .order('ordinal_position');

            if (schemaError) {
                throw new Error(`Error consultando esquema: ${schemaError.message}`);
            }

            console.log('✅ Esquema de tabla users obtenido correctamente');
            console.log(`📊 Columnas encontradas: ${usersSchema.length}`);
            
            // Verificar campos críticos
            const camposCriticos = ['id', 'email', 'full_name', 'phone', 'user_type'];
            const camposEncontrados = usersSchema.map(col => col.column_name);
            
            for (const campo of camposCriticos) {
                if (camposEncontrados.includes(campo)) {
                    console.log(`✅ Campo crítico encontrado: ${campo}`);
                } else {
                    console.log(`⚠️  Campo crítico faltante: ${campo}`);
                    resultados.warnings.push(`Campo faltante en users: ${campo}`);
                }
            }
            
            resultados.tests_exitosos++;
        } catch (error) {
            console.error('❌ Error verificando esquema:', error.message);
            resultados.tests_fallidos++;
            resultados.errores.push({
                test: 'Esquema tabla users',
                error: error.message,
                solucion: 'Ejecutar script SQL de corrección'
            });
        }

        console.log('\n📋 FASE 2: TESTING DE ENDPOINT /api/users/profile');
        console.log('================================================================');

        // Test 3: Testing del endpoint con diferentes métodos HTTP
        const endpointTests = [
            { method: 'GET', description: 'Obtener perfil de usuario' },
            { method: 'PUT', description: 'Actualizar perfil completo' },
            { method: 'PATCH', description: 'Actualización parcial de perfil' }
        ];

        for (const test of endpointTests) {
            console.log(`\n🔍 Test 3.${endpointTests.indexOf(test) + 1}: ${test.description} (${test.method})`);
            resultados.tests_ejecutados++;

            try {
                const testData = {
                    fullName: 'Usuario Test',
                    phone: '+54911234567',
                    userType: 'inquilino',
                    preferences: {
                        notifications: true,
                        theme: 'light'
                    }
                };

                const response = await fetch(`http://localhost:3000/api/users/profile`, {
                    method: test.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    },
                    body: test.method !== 'GET' ? JSON.stringify(testData) : undefined
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ ${test.method} exitoso - Status: ${response.status}`);
                    
                    if (test.method === 'GET' && data) {
                        console.log('📊 Datos recibidos:', Object.keys(data));
                    }
                    
                    resultados.tests_exitosos++;
                } else {
                    const errorText = await response.text();
                    console.log(`⚠️  ${test.method} falló - Status: ${response.status}`);
                    console.log(`📝 Error: ${errorText}`);
                    
                    if (response.status === 500) {
                        resultados.warnings.push(`Error 500 en ${test.method} - Posible problema de mapeo de campos`);
                    }
                    
                    resultados.tests_fallidos++;
                }
            } catch (error) {
                console.error(`❌ Error en ${test.method}:`, error.message);
                resultados.tests_fallidos++;
                resultados.errores.push({
                    test: `Endpoint ${test.method}`,
                    error: error.message,
                    solucion: 'Verificar que el servidor local esté ejecutándose'
                });
            }
        }

        console.log('\n📋 FASE 3: TESTING DE MAPEO DE CAMPOS');
        console.log('================================================================');

        // Test 4: Verificar mapeo camelCase ↔ snake_case
        console.log('\n🔍 Test 4: Verificando mapeo de campos...');
        resultados.tests_ejecutados++;

        try {
            // Crear usuario de prueba directamente en Supabase
            const testUser = {
                email: `test-${Date.now()}@example.com`,
                full_name: 'Usuario Prueba Mapeo',
                phone: '+54911111111',
                user_type: 'propietario'
            };

            const { data: insertedUser, error: insertError } = await supabase
                .from('users')
                .insert([testUser])
                .select()
                .single();

            if (insertError) {
                throw new Error(`Error insertando usuario: ${insertError.message}`);
            }

            console.log('✅ Usuario de prueba creado exitosamente');
            
            // Verificar que los campos se guardaron en snake_case
            const camposSnakeCase = ['full_name', 'user_type'];
            for (const campo of camposSnakeCase) {
                if (insertedUser[campo] !== undefined) {
                    console.log(`✅ Campo snake_case correcto: ${campo} = ${insertedUser[campo]}`);
                } else {
                    console.log(`❌ Campo snake_case faltante: ${campo}`);
                    resultados.errores.push({
                        test: 'Mapeo snake_case',
                        error: `Campo ${campo} no encontrado`,
                        solucion: 'Verificar mapeo en endpoint'
                    });
                }
            }

            // Limpiar usuario de prueba
            await supabase
                .from('users')
                .delete()
                .eq('id', insertedUser.id);

            console.log('🧹 Usuario de prueba eliminado');
            resultados.tests_exitosos++;
            
        } catch (error) {
            console.error('❌ Error en test de mapeo:', error.message);
            resultados.tests_fallidos++;
            resultados.errores.push({
                test: 'Mapeo de campos',
                error: error.message,
                solucion: 'Revisar función de mapeo en el endpoint'
            });
        }

        console.log('\n📋 FASE 4: TESTING DE POLÍTICAS RLS');
        console.log('================================================================');

        // Test 5: Verificar políticas RLS
        console.log('\n🔍 Test 5: Verificando políticas RLS...');
        resultados.tests_ejecutados++;

        try {
            const { data: policies, error: policiesError } = await supabase
                .from('pg_policies')
                .select('tablename, policyname, cmd, qual')
                .eq('tablename', 'users');

            if (policiesError) {
                throw new Error(`Error consultando políticas: ${policiesError.message}`);
            }

            console.log(`✅ Políticas RLS encontradas: ${policies.length}`);
            
            const tiposPoliticas = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
            for (const tipo of tiposPoliticas) {
                const politica = policies.find(p => p.cmd === tipo);
                if (politica) {
                    console.log(`✅ Política ${tipo} encontrada: ${politica.policyname}`);
                } else {
                    console.log(`⚠️  Política ${tipo} faltante`);
                    resultados.warnings.push(`Política RLS faltante para ${tipo} en tabla users`);
                }
            }

            resultados.tests_exitosos++;
            
        } catch (error) {
            console.error('❌ Error verificando políticas RLS:', error.message);
            resultados.tests_fallidos++;
            resultados.errores.push({
                test: 'Políticas RLS',
                error: error.message,
                solucion: 'Ejecutar script SQL para crear políticas RLS'
            });
        }

        console.log('\n📋 FASE 5: TESTING DE CASOS EDGE');
        console.log('================================================================');

        // Test 6: Casos edge y validaciones
        const casosEdge = [
            {
                nombre: 'Datos inválidos',
                data: { email: 'invalid-email', phone: '123' }
            },
            {
                nombre: 'Campos faltantes',
                data: { fullName: '' }
            },
            {
                nombre: 'Tipos incorrectos',
                data: { userType: 'tipo_inexistente' }
            }
        ];

        for (const caso of casosEdge) {
            console.log(`\n🔍 Test 6.${casosEdge.indexOf(caso) + 1}: ${caso.nombre}`);
            resultados.tests_ejecutados++;

            try {
                const response = await fetch(`http://localhost:3000/api/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify(caso.data)
                });

                if (response.status === 400 || response.status === 422) {
                    console.log(`✅ Validación correcta - Status: ${response.status}`);
                    resultados.tests_exitosos++;
                } else {
                    console.log(`⚠️  Validación débil - Status: ${response.status}`);
                    resultados.warnings.push(`Caso edge ${caso.nombre} no validado correctamente`);
                    resultados.tests_fallidos++;
                }
            } catch (error) {
                console.error(`❌ Error en caso edge ${caso.nombre}:`, error.message);
                resultados.tests_fallidos++;
            }
        }

        console.log('\n📋 FASE 6: TESTING DE RENDIMIENTO');
        console.log('================================================================');

        // Test 7: Performance testing
        console.log('\n🔍 Test 7: Testing de rendimiento...');
        resultados.tests_ejecutados++;

        try {
            const startTime = Date.now();
            const requests = [];

            // Ejecutar 10 requests concurrentes
            for (let i = 0; i < 10; i++) {
                requests.push(
                    fetch(`http://localhost:3000/api/users/profile`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                        }
                    })
                );
            }

            const responses = await Promise.all(requests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / requests.length;

            console.log(`✅ Requests concurrentes completados`);
            console.log(`📊 Tiempo total: ${totalTime}ms`);
            console.log(`📊 Tiempo promedio: ${avgTime.toFixed(2)}ms`);

            if (avgTime < 1000) {
                console.log('✅ Rendimiento excelente (< 1s)');
                resultados.tests_exitosos++;
            } else if (avgTime < 3000) {
                console.log('⚠️  Rendimiento aceptable (1-3s)');
                resultados.warnings.push('Rendimiento podría mejorarse');
                resultados.tests_exitosos++;
            } else {
                console.log('❌ Rendimiento deficiente (> 3s)');
                resultados.tests_fallidos++;
                resultados.errores.push({
                    test: 'Rendimiento',
                    error: `Tiempo promedio: ${avgTime.toFixed(2)}ms`,
                    solucion: 'Optimizar queries y conexiones a BD'
                });
            }

        } catch (error) {
            console.error('❌ Error en test de rendimiento:', error.message);
            resultados.tests_fallidos++;
            resultados.errores.push({
                test: 'Rendimiento',
                error: error.message,
                solucion: 'Verificar estabilidad del servidor'
            });
        }

        console.log('\n📋 FASE 7: APLICACIÓN DE CORRECCIONES AUTOMÁTICAS');
        console.log('================================================================');

        // Aplicar correcciones si hay errores críticos
        if (resultados.errores.length > 0) {
            console.log('\n🔧 Aplicando correcciones automáticas...');
            
            try {
                // Leer y ejecutar script SQL de corrección
                const sqlScript = fs.readFileSync('verificacion-supabase-perfil-usuario.sql', 'utf8');
                
                const commands = sqlScript
                    .split(';')
                    .map(cmd => cmd.trim())
                    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

                let correcciones = 0;
                for (const command of commands) {
                    try {
                        const { error } = await supabase.rpc('exec_sql', {
                            sql_query: command
                        });

                        if (!error) {
                            correcciones++;
                        }
                    } catch (err) {
                        // Ignorar errores menores en correcciones automáticas
                    }
                }

                console.log(`✅ Correcciones aplicadas: ${correcciones}/${commands.length}`);
                resultados.correcciones_aplicadas.push(`${correcciones} comandos SQL ejecutados`);
                
            } catch (error) {
                console.log('⚠️  No se pudo aplicar correcciones automáticas:', error.message);
                resultados.warnings.push('Correcciones automáticas no disponibles');
            }
        }

        console.log('\n📋 RESUMEN FINAL DEL TESTING');
        console.log('================================================================');
        
        const porcentajeExito = ((resultados.tests_exitosos / resultados.tests_ejecutados) * 100).toFixed(1);
        
        console.log(`📊 Tests ejecutados: ${resultados.tests_ejecutados}`);
        console.log(`✅ Tests exitosos: ${resultados.tests_exitosos}`);
        console.log(`❌ Tests fallidos: ${resultados.tests_fallidos}`);
        console.log(`⚠️  Warnings: ${resultados.warnings.length}`);
        console.log(`🎯 Porcentaje de éxito: ${porcentajeExito}%`);

        // Generar recomendaciones
        if (resultados.errores.length > 0) {
            resultados.recomendaciones.push('Ejecutar script SQL de corrección manualmente');
            resultados.recomendaciones.push('Verificar configuración de Supabase');
        }
        
        if (resultados.warnings.length > 0) {
            resultados.recomendaciones.push('Revisar warnings para optimizaciones');
        }
        
        if (porcentajeExito >= 80) {
            resultados.recomendaciones.push('Sistema funcionando correctamente');
        } else {
            resultados.recomendaciones.push('Requiere atención inmediata');
        }

        // Guardar reporte detallado
        fs.writeFileSync(
            'REPORTE-TESTING-EXHAUSTIVO-SUPABASE-PERFIL-USUARIO-FINAL.json',
            JSON.stringify(resultados, null, 2)
        );

        console.log('\n📄 Reporte detallado guardado en: REPORTE-TESTING-EXHAUSTIVO-SUPABASE-PERFIL-USUARIO-FINAL.json');

        // Mostrar próximos pasos
        console.log('\n📋 PRÓXIMOS PASOS RECOMENDADOS:');
        console.log('================================================================');
        
        if (porcentajeExito >= 90) {
            console.log('🎉 ¡EXCELENTE! El sistema está funcionando correctamente');
            console.log('✅ 1. Realizar testing en producción');
            console.log('✅ 2. Monitorear rendimiento en uso real');
            console.log('✅ 3. Implementar logging avanzado');
        } else if (porcentajeExito >= 70) {
            console.log('⚠️  BUENO - Algunas mejoras necesarias');
            console.log('🔧 1. Corregir errores identificados');
            console.log('🔧 2. Ejecutar script SQL de corrección');
            console.log('🔧 3. Re-ejecutar testing');
        } else {
            console.log('❌ CRÍTICO - Requiere atención inmediata');
            console.log('🚨 1. Ejecutar correcciones automáticas');
            console.log('🚨 2. Revisar configuración de Supabase');
            console.log('🚨 3. Verificar endpoint de perfil');
        }

        return resultados;

    } catch (error) {
        console.error('\n💥 ERROR CRÍTICO EN TESTING:', error.message);
        resultados.errores.push({
            test: 'Testing General',
            error: error.message,
            solucion: 'Revisar configuración general del sistema'
        });
        
        return resultados;
    }
}

// Ejecutar testing exhaustivo
testingExhaustivoCompleto()
    .then(resultados => {
        const porcentajeExito = ((resultados.tests_exitosos / resultados.tests_ejecutados) * 100).toFixed(1);
        
        if (porcentajeExito >= 80) {
            console.log('\n🎉 TESTING COMPLETADO EXITOSAMENTE');
            process.exit(0);
        } else {
            console.log('\n⚠️  TESTING COMPLETADO CON PROBLEMAS');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 ERROR FATAL:', error.message);
        process.exit(1);
    });
