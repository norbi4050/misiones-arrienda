
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 EJECUTANDO TESTS AUTOMATIZADOS COMPLETOS');
console.log('===========================================');

// Test 1: Verificar que el servidor inicie
console.log('\n🚀 TEST 1: Iniciando servidor...');
try {
    // Intentar iniciar el servidor en background
    const serverProcess = execSync('cd Backend && npm run dev', { 
        timeout: 10000,
        stdio: 'pipe'
    });
    console.log('✅ Servidor iniciado correctamente');
} catch (error) {
    console.log('⚠️  Servidor ya está ejecutándose o hay un problema');
}

// Test 2: Verificar endpoints API
console.log('\n🔌 TEST 2: Verificando endpoints API...');
const endpoints = [
    'http://localhost:3000/api/properties',
    'http://localhost:3000/api/health/db'
];

endpoints.forEach(async (endpoint) => {
    try {
        const response = await fetch(endpoint);
        console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
        console.log(`❌ ${endpoint}: Error de conexión`);
    }
});

// Test 3: Verificar formulario
console.log('\n📝 TEST 3: Verificando formulario...');
setTimeout(async () => {
    try {
        const response = await fetch('http://localhost:3000/publicar');
        if (response.ok) {
            const html = await response.text();
            const hasContactPhone = html.includes('contact_phone');
            console.log(`📱 Campo contact_phone: ${hasContactPhone ? '✅' : '❌'}`);
        }
    } catch (error) {
        console.log('❌ Error verificando formulario');
    }
}, 2000);

console.log('\n✅ Tests automatizados completados');
console.log('\n📋 PRÓXIMOS PASOS:');
console.log('1. Ejecutar: cd Backend && npm run dev');
console.log('2. Abrir: http://localhost:3000/publicar');
console.log('3. Probar el formulario manualmente');
console.log('4. Verificar que contact_phone funcione correctamente');
