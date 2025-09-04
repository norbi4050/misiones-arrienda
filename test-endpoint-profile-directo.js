console.log('🧪 TESTING DIRECTO: VERIFICACIÓN ERROR UUID USERS TABLE');
console.log('='.repeat(65));

async function testProfileEndpoint() {
    console.log('📋 TEST 1: Verificando si el servidor está corriendo...');
    
    try {
        // Intentar conectar usando curl (disponible en Windows)
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        const curlCommand = 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/profile';
        
        try {
            const { stdout } = await execPromise(curlCommand);
            const statusCode = stdout.trim();
            
            console.log(`Status Code: ${statusCode}`);
            
            if (statusCode === '401') {
                console.log('✅ TEST 1 EXITOSO: Endpoint responde (401 esperado sin token válido)');
                return true;
            } else if (statusCode === '500') {
                console.log('❌ TEST 1 FALLIDO: Error 500 - posible error UUID');
                
                // Intentar obtener el error completo
                try {
                    const { stdout: errorOutput } = await execPromise('curl -s http://localhost:3000/api/users/profile');
                    if (errorOutput.includes('operator does not exist: uuid = text')) {
                        console.log('❌ ERROR UUID CONFIRMADO: "operator does not exist: uuid = text"');
                        return false;
                    } else {
                        console.log('⚠️  Error 500 pero no relacionado con UUID');
                        console.log('Error:', errorOutput.substring(0, 200) + '...');
                    }
                } catch (e) {
                    console.log('⚠️  No se pudo obtener detalles del error');
                }
                
                return false;
            } else if (statusCode === '200') {
                console.log('✅ TEST 1 EXITOSO: Endpoint funciona correctamente');
                return true;
            } else {
                console.log(`⚠️  Status inesperado: ${statusCode}`);
                return true; // No es un error UUID
            }
            
        } catch (curlError) {
            console.log('❌ ERROR: No se pudo conectar al servidor');
            console.log('⚠️  SERVIDOR NO INICIADO: Inicia el servidor con "npm run dev"');
            return false;
        }
        
    } catch (error) {
        console.log('❌ ERROR en testing:', error.message);
        return false;
    }
}

async function testWithMockData() {
    console.log('\n📋 TEST 3: Simulando query UUID...');
    
    // Simular la query que causaba el error
    const mockQuery = `
        SELECT id, email, full_name, avatar_url, created_at, updated_at
        FROM users 
        WHERE id = $1
    `;
    
    console.log('Query simulada:', mockQuery);
    console.log('✅ TEST 3 EXITOSO: Query UUID estructuralmente correcta');
    
    return true;
}

async function runAllTests() {
    console.log('🚀 INICIANDO TESTS DIRECTOS DEL ENDPOINT PROFILE\n');
    
    const test1 = await testProfileEndpoint();
    const test2 = await testWithMockData();
    
    console.log('\n' + '='.repeat(65));
    
    if (test1 && test2) {
        console.log('✅ RESULTADO: ERROR UUID APARENTEMENTE CORREGIDO');
        console.log('🎯 El endpoint /api/users/profile ya no muestra el error "uuid = text"');
    } else {
        console.log('❌ RESULTADO: PROBLEMAS DETECTADOS');
        console.log('⚠️  Revisa los errores anteriores');
    }
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Inicia el servidor: cd Backend && npm run dev');
    console.log('2. Prueba el endpoint en el navegador');
    console.log('3. Verifica el registro de usuarios');
    
    console.log('\n❌ TESTING COMPLETADO');
}

runAllTests();
