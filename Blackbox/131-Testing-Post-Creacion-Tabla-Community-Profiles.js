/**
 * BLACKBOX AI - TESTING POST-CREACIÓN TABLA COMMUNITY_PROFILES
 * Fecha: 3 de Enero 2025
 * Objetivo: Verificar que la tabla community_profiles fue creada correctamente
 */

const fs = require('fs');

console.log('🔍 INICIANDO TESTING POST-CREACIÓN TABLA COMMUNITY_PROFILES...\n');

// Configuración con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

const resultados = {
    timestamp: new Date().toISOString(),
    tests: [],
    errores: [],
    exito: false,
    puntuacion: 0,
    maxPuntuacion: 100
};

// 1. VERIFICAR EXISTENCIA DE TABLA
console.log('📋 1. VERIFICANDO EXISTENCIA DE TABLA...');
async function verificarTablaExiste() {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?limit=1`, {
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Tabla community_profiles existe y es accesible');
            resultados.tests.push('✅ Tabla existe');
            resultados.puntuacion += 20;
            return true;
        } else {
            console.log('❌ Tabla community_profiles no accesible:', response.status);
            resultados.errores.push(`Tabla no accesible: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Error verificando tabla:', error.message);
        resultados.errores.push(`Error verificación: ${error.message}`);
        return false;
    }
}

// 2. VERIFICAR ESTRUCTURA DE COLUMNAS
console.log('\n🏗️ 2. VERIFICANDO ESTRUCTURA DE COLUMNAS...');
async function verificarEstructura() {
    try {
        // Intentar insertar un registro de prueba para verificar estructura
        const testData = {
            user_id: '00000000-0000-0000-0000-000000000000', // UUID de prueba
            display_name: 'Test User',
            bio: 'Test bio',
            interests: ['test'],
            location: 'Test Location',
            age: 25,
            gender: 'Test',
            occupation: 'Tester',
            phone: '123456789',
            email: 'test@test.com',
            social_links: {},
            preferences: {},
            verification_status: 'pending'
        };
        
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(testData)
        });
        
        if (response.ok || response.status === 201) {
            console.log('✅ Estructura de columnas correcta');
            resultados.tests.push('✅ Estructura correcta');
            resultados.puntuacion += 20;
            
            // Limpiar registro de prueba
            await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?user_id=eq.00000000-0000-0000-0000-000000000000`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
                }
            });
            
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Error en estructura:', errorText);
            resultados.errores.push(`Error estructura: ${errorText}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Error verificando estructura:', error.message);
        resultados.errores.push(`Error estructura: ${error.message}`);
        return false;
    }
}

// 3. VERIFICAR ROW LEVEL SECURITY
console.log('\n🔒 3. VERIFICANDO ROW LEVEL SECURITY...');
async function verificarRLS() {
    try {
        // Intentar acceder con clave anónima (debería funcionar para SELECT)
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?limit=1`, {
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ RLS configurado correctamente (SELECT permitido)');
            resultados.tests.push('✅ RLS configurado');
            resultados.puntuacion += 15;
            return true;
        } else {
            console.log('⚠️ RLS muy restrictivo o no configurado:', response.status);
            resultados.tests.push('⚠️ RLS necesita revisión');
            resultados.puntuacion += 5;
            return false;
        }
    } catch (error) {
        console.log('❌ Error verificando RLS:', error.message);
        resultados.errores.push(`Error RLS: ${error.message}`);
        return false;
    }
}

// 4. VERIFICAR ÍNDICES Y PERFORMANCE
console.log('\n⚡ 4. VERIFICANDO PERFORMANCE...');
async function verificarPerformance() {
    try {
        const startTime = Date.now();
        
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?select=id,display_name&limit=10`, {
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
            }
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (response.ok && responseTime < 1000) {
            console.log(`✅ Performance buena (${responseTime}ms)`);
            resultados.tests.push(`✅ Performance: ${responseTime}ms`);
            resultados.puntuacion += 15;
            return true;
        } else {
            console.log(`⚠️ Performance lenta (${responseTime}ms)`);
            resultados.tests.push(`⚠️ Performance: ${responseTime}ms`);
            resultados.puntuacion += 5;
            return false;
        }
    } catch (error) {
        console.log('❌ Error verificando performance:', error.message);
        resultados.errores.push(`Error performance: ${error.message}`);
        return false;
    }
}

// 5. VERIFICAR INTEGRACIÓN CON AUTH
console.log('\n👤 5. VERIFICANDO INTEGRACIÓN CON AUTH...');
async function verificarIntegracionAuth() {
    try {
        // Verificar que la foreign key a auth.users funciona
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?select=user_id&limit=1`, {
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Integración con auth.users correcta');
            resultados.tests.push('✅ Integración auth correcta');
            resultados.puntuacion += 10;
            return true;
        } else {
            console.log('❌ Error en integración con auth:', response.status);
            resultados.errores.push(`Error integración auth: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Error verificando integración auth:', error.message);
        resultados.errores.push(`Error integración auth: ${error.message}`);
        return false;
    }
}

// 6. VERIFICAR TIPOS DE DATOS ESPECIALES
console.log('\n🔧 6. VERIFICANDO TIPOS DE DATOS ESPECIALES...');
async function verificarTiposDatos() {
    try {
        // Verificar que los tipos JSONB y arrays funcionan
        const testData = {
            user_id: '11111111-1111-1111-1111-111111111111',
            display_name: 'Test Types',
            interests: ['tecnología', 'inmuebles', 'networking'],
            social_links: { twitter: '@test', linkedin: 'test' },
            preferences: { notifications: true, theme: 'dark' }
        };
        
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(testData)
        });
        
        if (response.ok || response.status === 201) {
            console.log('✅ Tipos de datos especiales funcionan correctamente');
            resultados.tests.push('✅ Tipos de datos correctos');
            resultados.puntuacion += 10;
            
            // Limpiar
            await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?user_id=eq.11111111-1111-1111-1111-111111111111`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
                }
            });
            
            return true;
        } else {
            const errorText = await response.text();
            console.log('❌ Error en tipos de datos:', errorText);
            resultados.errores.push(`Error tipos de datos: ${errorText}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Error verificando tipos de datos:', error.message);
        resultados.errores.push(`Error tipos de datos: ${error.message}`);
        return false;
    }
}

// 7. VERIFICAR TRIGGERS Y FUNCIONES
console.log('\n⚙️ 7. VERIFICANDO TRIGGERS...');
async function verificarTriggers() {
    try {
        // Crear un registro y verificar que updated_at se actualiza
        const testData = {
            user_id: '22222222-2222-2222-2222-222222222222',
            display_name: 'Test Triggers'
        };
        
        // Insertar
        const insertResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testData)
        });
        
        if (insertResponse.ok) {
            const insertedData = await insertResponse.json();
            const originalUpdatedAt = insertedData[0]?.updated_at;
            
            // Esperar un momento y actualizar
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const updateResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?user_id=eq.22222222-2222-2222-2222-222222222222`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ display_name: 'Test Triggers Updated' })
            });
            
            if (updateResponse.ok) {
                const updatedData = await updateResponse.json();
                const newUpdatedAt = updatedData[0]?.updated_at;
                
                if (newUpdatedAt && newUpdatedAt !== originalUpdatedAt) {
                    console.log('✅ Triggers funcionan correctamente');
                    resultados.tests.push('✅ Triggers funcionan');
                    resultados.puntuacion += 10;
                } else {
                    console.log('⚠️ Triggers no detectados o no funcionan');
                    resultados.tests.push('⚠️ Triggers necesitan revisión');
                    resultados.puntuacion += 3;
                }
            }
            
            // Limpiar
            await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?user_id=eq.22222222-2222-2222-2222-222222222222`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
                }
            });
            
            return true;
        } else {
            console.log('❌ Error verificando triggers');
            resultados.errores.push('Error verificando triggers');
            return false;
        }
    } catch (error) {
        console.log('❌ Error verificando triggers:', error.message);
        resultados.errores.push(`Error triggers: ${error.message}`);
        return false;
    }
}

// EJECUTAR TODOS LOS TESTS
async function ejecutarTodosLosTests() {
    try {
        console.log('🚀 EJECUTANDO BATERÍA COMPLETA DE TESTS...\n');
        
        await verificarTablaExiste();
        await verificarEstructura();
        await verificarRLS();
        await verificarPerformance();
        await verificarIntegracionAuth();
        await verificarTiposDatos();
        await verificarTriggers();
        
        // Calcular resultado final
        resultados.exito = resultados.puntuacion >= 70; // 70% mínimo para considerar éxito
        
        console.log('\n📊 RESUMEN FINAL DE TESTING:');
        console.log('================================');
        console.log(`🕐 Timestamp: ${resultados.timestamp}`);
        console.log(`🎯 Puntuación: ${resultados.puntuacion}/${resultados.maxPuntuacion} (${Math.round((resultados.puntuacion/resultados.maxPuntuacion)*100)}%)`);
        console.log(`✅ Tests pasados: ${resultados.tests.length}`);
        console.log(`❌ Errores encontrados: ${resultados.errores.length}`);
        console.log(`🏆 Estado general: ${resultados.exito ? 'ÉXITO' : 'NECESITA MEJORAS'}`);
        
        if (resultados.tests.length > 0) {
            console.log('\n✅ TESTS PASADOS:');
            resultados.tests.forEach((test, index) => {
                console.log(`${index + 1}. ${test}`);
            });
        }
        
        if (resultados.errores.length > 0) {
            console.log('\n❌ ERRORES ENCONTRADOS:');
            resultados.errores.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        // Recomendaciones basadas en puntuación
        console.log('\n💡 RECOMENDACIONES:');
        if (resultados.puntuacion >= 90) {
            console.log('🎉 ¡Excelente! La tabla está perfectamente configurada.');
        } else if (resultados.puntuacion >= 70) {
            console.log('✅ Buena configuración, pero hay algunas mejoras menores.');
        } else if (resultados.puntuacion >= 50) {
            console.log('⚠️ Configuración básica funcional, pero necesita mejoras importantes.');
        } else {
            console.log('🚨 Configuración incompleta, revisa la guía manual.');
        }
        
        // Próximos pasos
        console.log('\n🚀 PRÓXIMOS PASOS:');
        if (resultados.exito) {
            console.log('1. ✅ Ejecutar testing de APIs de comunidad');
            console.log('2. ✅ Verificar integración con frontend');
            console.log('3. ✅ Testing de funcionalidad completa');
        } else {
            console.log('1. 📋 Revisar errores encontrados');
            console.log('2. 🔧 Aplicar correcciones necesarias');
            console.log('3. 🔄 Re-ejecutar este testing');
        }
        
        // Guardar reporte
        const reportePath = 'Blackbox/131-Reporte-Testing-Community-Profiles.json';
        fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
        console.log(`\n💾 Reporte guardado en: ${reportePath}`);
        
    } catch (error) {
        console.log('\n❌ ERROR CRÍTICO EN TESTING:', error.message);
        resultados.errores.push(`Error crítico: ${error.message}`);
    }
}

// Ejecutar testing
ejecutarTodosLosTests().catch(console.error);
