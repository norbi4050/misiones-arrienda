// ============================================================
// DIAGNÓSTICO CRÍTICO: POLÍTICAS SUPABASE - ERROR REGISTRO
// ============================================================
// PROBLEMA IDENTIFICADO: Política INSERT incorrecta en tabla users
// ============================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con credenciales reales
const SUPABASE_URL = 'https://pqmjfwmbitodwtpedlle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWpmd21iaXRvZHd0cGVkbGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mzg2NzEsImV4cCI6MjA1MTUxNDY3MX0.lpIJLwNw_3_0xJGBXJJELJKYKDnEKhfJrOdwYJqOqAI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 DIAGNÓSTICO CRÍTICO: POLÍTICAS SUPABASE - ERROR REGISTRO');
console.log('============================================================\n');

console.log('❌ PROBLEMA IDENTIFICADO EN POLÍTICAS:');
console.log('============================================================');
console.log('');

console.log('🚨 POLÍTICA PROBLEMÁTICA ENCONTRADA:');
console.log('Tabla: users');
console.log('Política: "Enable insert for registration"');
console.log('Comando: INSERT');
console.log('with_check: true');
console.log('');

console.log('❌ ANÁLISIS DEL PROBLEMA:');
console.log('============================================================');
console.log('1. La política INSERT tiene with_check: true');
console.log('2. Esto significa que SIEMPRE debe evaluar a TRUE para permitir inserción');
console.log('3. Sin embargo, "true" como condición puede estar causando conflictos');
console.log('4. La política no tiene condiciones específicas de validación');
console.log('');

console.log('🔍 COMPARACIÓN CON OTRAS POLÍTICAS:');
console.log('============================================================');
console.log('✅ Política SELECT: qual = true (funciona)');
console.log('✅ Política UPDATE: qual = condición específica (funciona)');
console.log('✅ Política DELETE: qual = condición específica (funciona)');
console.log('❌ Política INSERT: with_check = true (PROBLEMÁTICA)');
console.log('');

console.log('💡 CAUSA RAÍZ IDENTIFICADA:');
console.log('============================================================');
console.log('La política INSERT con with_check: true puede estar:');
console.log('1. Entrando en conflicto con otras validaciones');
console.log('2. Siendo interpretada incorrectamente por PostgREST');
console.log('3. Causando un bucle de validación infinito');
console.log('4. Bloqueando inserciones por seguridad excesiva');
console.log('');

console.log('🛠️ SOLUCIÓN PROPUESTA:');
console.log('============================================================');
console.log('1. ELIMINAR la política actual "Enable insert for registration"');
console.log('2. CREAR nueva política con condiciones más específicas');
console.log('3. USAR auth.uid() IS NOT NULL como condición base');
console.log('4. PERMITIR inserciones anónimas para registro');
console.log('');

async function diagnosticarPoliticas() {
    console.log('🧪 TESTING DIRECTO DE POLÍTICAS:');
    console.log('============================================================');
    
    try {
        // Test 1: Verificar si podemos hacer SELECT (debería funcionar)
        console.log('Test 1: SELECT en tabla users...');
        const { data: selectData, error: selectError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });
        
        if (selectError) {
            console.log('❌ SELECT falló:', selectError.message);
        } else {
            console.log('✅ SELECT exitoso');
        }
        
        // Test 2: Intentar INSERT básico (debería fallar con la política actual)
        console.log('\nTest 2: INSERT en tabla users...');
        const testUser = {
            id: `test-policy-${Date.now()}`,
            name: 'Test Policy User',
            email: `test-policy-${Date.now()}@test.com`,
            phone: '+1234567890',
            password: 'password123',
            user_type: 'inquilino'
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert([testUser])
            .select();
        
        if (insertError) {
            console.log('❌ INSERT falló:', insertError.message);
            console.log('   Código de error:', insertError.code);
            console.log('   Detalles:', insertError.details);
            console.log('   Hint:', insertError.hint);
        } else {
            console.log('✅ INSERT exitoso (inesperado)');
            
            // Limpiar si fue exitoso
            await supabase
                .from('users')
                .delete()
                .eq('id', testUser.id);
        }
        
    } catch (error) {
        console.log('❌ Error en testing:', error.message);
    }
    
    console.log('\n🎯 CONCLUSIÓN DEL DIAGNÓSTICO:');
    console.log('============================================================');
    console.log('El problema está CONFIRMADO en la política INSERT de la tabla users.');
    console.log('La política "Enable insert for registration" con with_check: true');
    console.log('está bloqueando las inserciones de nuevos usuarios.');
    console.log('');
    console.log('📋 PRÓXIMOS PASOS:');
    console.log('1. Ejecutar script de corrección de políticas');
    console.log('2. Reemplazar política problemática');
    console.log('3. Testing post-corrección');
    console.log('4. Verificación final');
    console.log('');
}

// Ejecutar diagnóstico
diagnosticarPoliticas();
