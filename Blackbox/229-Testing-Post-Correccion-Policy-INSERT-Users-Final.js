// ============================================================
// TESTING POST-CORRECCIÓN: POLÍTICA INSERT USERS
// ============================================================
// Verifica que el error "Database error saving new user" esté resuelto
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase con credenciales reales
const SUPABASE_URL = 'https://pqmjfwmbitodwtpedlle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWpmd21iaXRvZHd0cGVkbGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mzg2NzEsImV4cCI6MjA1MTUxNDY3MX0.lpIJLwNw_3_0xJGBXJJELJKYKDnEKhfJrOdwYJqOqAI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 TESTING POST-CORRECCIÓN: POLÍTICA INSERT USERS');
console.log('============================================================\n');

async function testingPostCorreccion() {
    const reporte = {
        timestamp: new Date().toISOString(),
        proceso: 'Testing Post-Corrección Política INSERT Users',
        tests: [],
        errores: [],
        exito: false,
        resumen: {
            totalTests: 0,
            exitosos: 0,
            fallidos: 0
        }
    };

    try {
        console.log('📋 TEST 1: Verificar políticas INSERT actuales...');
        
        // Test 1: Verificar políticas actuales
        const { data: politicas, error: errorPoliticas } = await supabase
            .rpc('exec_sql', {
                sql: `
                SELECT 
                    policyname,
                    cmd,
                    with_check
                FROM pg_policies 
                WHERE tablename = 'users' 
                AND schemaname = 'public'
                AND cmd = 'INSERT'
                ORDER BY policyname;
                `
            });

        reporte.totalTests++;
        
        if (errorPoliticas) {
            console.log('❌ Error consultando políticas:', errorPoliticas.message);
            reporte.tests.push({
                test: 1,
                nombre: 'Verificar políticas INSERT',
                resultado: 'fallido',
                error: errorPoliticas.message
            });
            reporte.fallidos++;
        } else {
            console.log('✅ Políticas INSERT encontradas:', politicas?.length || 0);
            if (politicas && politicas.length > 0) {
                politicas.forEach(politica => {
                    console.log(`   - ${politica.policyname}: ${politica.with_check}`);
                });
            }
            
            reporte.tests.push({
                test: 1,
                nombre: 'Verificar políticas INSERT',
                resultado: 'exitoso',
                detalles: `${politicas?.length || 0} políticas encontradas`,
                politicas: politicas
            });
            reporte.exitosos++;
        }

        console.log('\n🧪 TEST 2: Intentar registro de usuario de prueba...');
        
        // Test 2: Intentar insertar usuario de prueba
        const usuarioPrueba = {
            id: `test-post-correccion-${Date.now()}`,
            name: 'Usuario Test Post-Corrección',
            email: `test-post-correccion-${Date.now()}@test.com`,
            phone: '+1234567890',
            password: 'password123',
            user_type: 'inquilino'
        };

        reporte.totalTests++;
        
        const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert([usuarioPrueba])
            .select();

        if (insertError) {
            console.log('❌ Error en inserción:', insertError.message);
            console.log('   Código:', insertError.code);
            console.log('   Detalles:', insertError.details);
            
            // Verificar si es el error específico que estamos solucionando
            if (insertError.message.includes('Database error saving new user') || 
                insertError.message.includes('new row violates row-level security policy')) {
                console.log('🚨 EL ERROR ORIGINAL PERSISTE - CORRECCIÓN NO EXITOSA');
                reporte.tests.push({
                    test: 2,
                    nombre: 'Inserción usuario de prueba',
                    resultado: 'fallido',
                    error: insertError.message,
                    tipo: 'error_original_persiste'
                });
            } else {
                console.log('⚠️ Error diferente al original - puede ser esperado');
                reporte.tests.push({
                    test: 2,
                    nombre: 'Inserción usuario de prueba',
                    resultado: 'fallido',
                    error: insertError.message,
                    tipo: 'error_diferente'
                });
            }
            reporte.fallidos++;
        } else {
            console.log('✅ Inserción exitosa - PROBLEMA RESUELTO');
            console.log('   Usuario creado:', insertData[0]?.id);
            
            reporte.tests.push({
                test: 2,
                nombre: 'Inserción usuario de prueba',
                resultado: 'exitoso',
                detalles: 'Usuario insertado correctamente',
                usuario_id: insertData[0]?.id
            });
            reporte.exitosos++;

            // Limpiar usuario de prueba
            console.log('\n🧹 Limpiando usuario de prueba...');
            const { error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', usuarioPrueba.id);

            if (deleteError) {
                console.log('⚠️ Error limpiando usuario de prueba:', deleteError.message);
            } else {
                console.log('✅ Usuario de prueba eliminado');
            }
        }

        console.log('\n🔍 TEST 3: Verificar permisos de tabla...');
        
        // Test 3: Verificar permisos
        const { data: permisos, error: errorPermisos } = await supabase
            .rpc('exec_sql', {
                sql: `
                SELECT 
                    grantee,
                    privilege_type
                FROM information_schema.table_privileges 
                WHERE table_name = 'users' 
                AND table_schema = 'public'
                AND privilege_type = 'INSERT'
                ORDER BY grantee;
                `
            });

        reporte.totalTests++;
        
        if (errorPermisos) {
            console.log('❌ Error consultando permisos:', errorPermisos.message);
            reporte.tests.push({
                test: 3,
                nombre: 'Verificar permisos INSERT',
                resultado: 'fallido',
                error: errorPermisos.message
            });
            reporte.fallidos++;
        } else {
            console.log('✅ Permisos INSERT encontrados:', permisos?.length || 0);
            if (permisos && permisos.length > 0) {
                permisos.forEach(permiso => {
                    console.log(`   - ${permiso.grantee}: ${permiso.privilege_type}`);
                });
            }
            
            reporte.tests.push({
                test: 3,
                nombre: 'Verificar permisos INSERT',
                resultado: 'exitoso',
                detalles: `${permisos?.length || 0} permisos encontrados`,
                permisos: permisos
            });
            reporte.exitosos++;
        }

        console.log('\n🧪 TEST 4: Simular registro desde aplicación...');
        
        // Test 4: Simular el flujo completo de registro
        const usuarioReal = {
            id: `real-user-test-${Date.now()}`,
            name: 'Juan Pérez',
            email: `juan.perez.${Date.now()}@gmail.com`,
            phone: '+5493764123456',
            password: 'MiPassword123!',
            user_type: 'inquilino'
        };

        reporte.totalTests++;
        
        const { data: realInsertData, error: realInsertError } = await supabase
            .from('users')
            .insert([usuarioReal])
            .select();

        if (realInsertError) {
            console.log('❌ Error en registro real:', realInsertError.message);
            
            if (realInsertError.message.includes('Database error saving new user')) {
                console.log('🚨 ERROR CRÍTICO: El problema original NO está resuelto');
                reporte.tests.push({
                    test: 4,
                    nombre: 'Simulación registro real',
                    resultado: 'fallido_critico',
                    error: realInsertError.message,
                    tipo: 'problema_no_resuelto'
                });
            } else {
                console.log('⚠️ Error diferente - puede requerir investigación adicional');
                reporte.tests.push({
                    test: 4,
                    nombre: 'Simulación registro real',
                    resultado: 'fallido',
                    error: realInsertError.message,
                    tipo: 'error_adicional'
                });
            }
            reporte.fallidos++;
        } else {
            console.log('✅ Registro real exitoso - PROBLEMA COMPLETAMENTE RESUELTO');
            console.log('   Usuario registrado:', realInsertData[0]?.email);
            
            reporte.tests.push({
                test: 4,
                nombre: 'Simulación registro real',
                resultado: 'exitoso',
                detalles: 'Registro completado exitosamente',
                usuario_email: realInsertData[0]?.email
            });
            reporte.exitosos++;

            // Limpiar usuario real de prueba
            console.log('\n🧹 Limpiando usuario real de prueba...');
            const { error: realDeleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', usuarioReal.id);

            if (realDeleteError) {
                console.log('⚠️ Error limpiando usuario real:', realDeleteError.message);
            } else {
                console.log('✅ Usuario real de prueba eliminado');
            }
        }

        // Calcular resultado final
        reporte.resumen.totalTests = reporte.totalTests;
        reporte.resumen.exitosos = reporte.exitosos;
        reporte.resumen.fallidos = reporte.fallidos;
        reporte.exito = reporte.exitosos > reporte.fallidos && reporte.exitosos >= 2;

        console.log('\n🎯 RESUMEN DEL TESTING:');
        console.log('============================================================');
        console.log(`📊 Total de tests: ${reporte.resumen.totalTests}`);
        console.log(`✅ Tests exitosos: ${reporte.resumen.exitosos}`);
        console.log(`❌ Tests fallidos: ${reporte.resumen.fallidos}`);
        console.log(`🎯 Estado final: ${reporte.exito ? 'EXITOSO' : 'REQUIERE ATENCIÓN'}`);
        
        if (reporte.exito) {
            console.log('\n🎉 CORRECCIÓN VERIFICADA EXITOSAMENTE');
            console.log('El error "Database error saving new user" ha sido resuelto.');
            console.log('El registro de usuarios funciona correctamente.');
        } else {
            console.log('\n⚠️ CORRECCIÓN REQUIERE ATENCIÓN ADICIONAL');
            console.log('Algunos tests fallaron. Revisar detalles en el reporte.');
        }

    } catch (error) {
        console.log('❌ Error crítico en testing:', error.message);
        reporte.errores.push(`Error crítico: ${error.message}`);
        reporte.exito = false;
    }

    // Guardar reporte
    try {
        fs.writeFileSync(
            'Blackbox/229-Reporte-Testing-Post-Correccion-Policy-INSERT-Users-Final.json',
            JSON.stringify(reporte, null, 2)
        );
        console.log('\n📄 Reporte guardado en: Blackbox/229-Reporte-Testing-Post-Correccion-Policy-INSERT-Users-Final.json');
    } catch (errorArchivo) {
        console.log('❌ Error guardando reporte:', errorArchivo.message);
    }

    console.log('\n🔄 PRÓXIMOS PASOS:');
    if (reporte.exito) {
        console.log('1. ✅ Problema resuelto - Continuar con desarrollo normal');
        console.log('2. 🧪 Probar registro desde la aplicación web');
        console.log('3. 📊 Monitorear registros en producción');
    } else {
        console.log('1. 🔍 Revisar errores específicos en el reporte');
        console.log('2. 🛠️ Aplicar correcciones adicionales si es necesario');
        console.log('3. 🔄 Re-ejecutar testing después de correcciones');
    }

    return reporte;
}

// Ejecutar testing
testingPostCorreccion()
    .then(reporte => {
        console.log('\n✅ TESTING POST-CORRECCIÓN COMPLETADO');
        process.exit(reporte.exito ? 0 : 1);
    })
    .catch(error => {
        console.log('❌ Error fatal en testing:', error.message);
        process.exit(1);
    });
