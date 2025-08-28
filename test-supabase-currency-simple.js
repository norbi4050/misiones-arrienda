// =====================================================
// TEST SIMPLE PARA VERIFICAR PROBLEMA CURRENCY FIELD
// =====================================================
// Este script prueba directamente si el problema viene de Supabase

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (usa tus credenciales reales)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'TU_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'TU_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseCurrency() {
    console.log('🔍 INICIANDO TEST DE CURRENCY FIELD...\n');
    
    try {
        // TEST 1: Verificar si tabla 'properties' existe
        console.log('📋 TEST 1: Verificando tabla properties...');
        const { data: propertiesData, error: propertiesError } = await supabase
            .from('properties')
            .select('*')
            .limit(1);
            
        if (propertiesError) {
            console.log('❌ Error con tabla properties:', propertiesError.message);
        } else {
            console.log('✅ Tabla properties existe');
            console.log('📊 Columnas disponibles:', Object.keys(propertiesData[0] || {}));
        }
        
        // TEST 2: Verificar si tabla 'Property' (mayúscula) existe
        console.log('\n📋 TEST 2: Verificando tabla Property (mayúscula)...');
        const { data: PropertyData, error: PropertyError } = await supabase
            .from('Property')
            .select('*')
            .limit(1);
            
        if (PropertyError) {
            console.log('❌ Error con tabla Property:', PropertyError.message);
        } else {
            console.log('✅ Tabla Property existe');
            console.log('📊 Columnas disponibles:', Object.keys(PropertyData[0] || {}));
        }
        
        // TEST 3: Intentar seleccionar específicamente el campo currency
        console.log('\n📋 TEST 3: Verificando campo currency en properties...');
        const { data: currencyData, error: currencyError } = await supabase
            .from('properties')
            .select('currency')
            .limit(1);
            
        if (currencyError) {
            console.log('❌ ERROR CRÍTICO - Campo currency no existe:', currencyError.message);
            console.log('🔧 SOLUCIÓN: Ejecuta el script DIAGNOSTICO-SUPABASE-CURRENCY-FIELD.sql');
        } else {
            console.log('✅ Campo currency existe y funciona');
            console.log('💰 Valor currency:', currencyData[0]?.currency || 'NULL');
        }
        
        // TEST 4: Intentar insertar un registro de prueba
        console.log('\n📋 TEST 4: Intentando insertar registro de prueba...');
        const testProperty = {
            title: 'TEST - Propiedad de prueba',
            description: 'Esta es una propiedad de prueba para verificar currency',
            price: 100000,
            currency: 'ARS',
            city: 'Posadas',
            address: 'Dirección de prueba 123'
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('properties')
            .insert([testProperty])
            .select();
            
        if (insertError) {
            console.log('❌ ERROR AL INSERTAR:', insertError.message);
            console.log('🔧 Detalles del error:', insertError);
        } else {
            console.log('✅ Inserción exitosa');
            console.log('📝 Registro creado:', insertData[0]);
            
            // Limpiar - eliminar el registro de prueba
            await supabase
                .from('properties')
                .delete()
                .eq('id', insertData[0].id);
            console.log('🧹 Registro de prueba eliminado');
        }
        
    } catch (error) {
        console.log('💥 ERROR GENERAL:', error.message);
    }
    
    console.log('\n🎯 RESUMEN DEL TEST:');
    console.log('- Si ves "Campo currency no existe", el problema está en Supabase');
    console.log('- Si ves "Inserción exitosa", el problema está en tu código');
    console.log('- Ejecuta DIAGNOSTICO-SUPABASE-CURRENCY-FIELD.sql para solucionarlo');
}

// Ejecutar el test
testSupabaseCurrency();
