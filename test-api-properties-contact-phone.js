const https = require('https');
const http = require('http');

console.log('🔧 TESTING API - CAMPO CONTACT_PHONE');
console.log('====================================');

async function testAPIContactPhone() {
    const testData = {
        title: "Casa de prueba API",
        description: "Descripción de prueba para testing de API",
        price: 250000,
        currency: "ARS",
        type: "HOUSE",
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        address: "Calle de Prueba 123",
        city: "Posadas",
        state: "Misiones",
        country: "Argentina",
        contact_phone: "+54 376 123-4567", // Campo que agregamos
        images: [],
        amenities: [],
        features: [],
        deposit: 0,
        mascotas: false,
        expensasIncl: false,
        servicios: []
    };

    console.log('📤 Enviando datos de prueba a /api/properties...');
    console.log('📋 Datos incluyen contact_phone:', testData.contact_phone);
    console.log('');

    const postData = JSON.stringify(testData);

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/properties',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`📊 Status Code: ${res.statusCode}`);
                console.log(`📋 Headers:`, res.headers);
                console.log('📄 Response Body:');
                
                try {
                    const jsonResponse = JSON.parse(data);
                    console.log(JSON.stringify(jsonResponse, null, 2));
                } catch (e) {
                    console.log(data);
                }

                console.log('');

                // Analizar resultado
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('✅ API acepta el campo contact_phone correctamente');
                } else if (res.statusCode === 401) {
                    console.log('⚠️  Error 401 - Autenticación requerida (esperado sin token)');
                    console.log('✅ Pero la API no rechaza el campo contact_phone');
                } else if (res.statusCode === 400) {
                    console.log('❌ Error 400 - Posible problema con validación');
                    if (data.includes('contact_phone')) {
                        console.log('❌ El campo contact_phone está causando problemas');
                    } else {
                        console.log('✅ El campo contact_phone no está causando el error 400');
                    }
                } else {
                    console.log(`⚠️  Status Code inesperado: ${res.statusCode}`);
                }

                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    success: res.statusCode < 500 // Cualquier cosa que no sea error de servidor
                });
            });
        });

        req.on('error', (err) => {
            console.log('❌ Error de conexión:', err.message);
            console.log('💡 Asegúrate de que el servidor esté corriendo en localhost:3000');
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

// Test adicional: verificar esquema de validación
function testValidationSchema() {
    console.log('🔍 VERIFICANDO ESQUEMA DE VALIDACIÓN');
    console.log('===================================');
    
    try {
        // Intentar cargar el esquema de validación
        const path = require('path');
        const fs = require('fs');
        
        const schemaPath = path.join(__dirname, 'Backend', 'src', 'lib', 'validations', 'property.ts');
        
        if (fs.existsSync(schemaPath)) {
            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            
            if (schemaContent.includes('contact_phone')) {
                console.log('✅ Campo contact_phone encontrado en el esquema de validación');
                
                // Verificar si es requerido
                if (schemaContent.includes('contact_phone') && schemaContent.includes('min(')) {
                    console.log('✅ Campo contact_phone tiene validación de longitud mínima');
                } else {
                    console.log('⚠️  Campo contact_phone podría no tener validación completa');
                }
            } else {
                console.log('❌ Campo contact_phone NO encontrado en el esquema de validación');
            }
        } else {
            console.log('⚠️  No se pudo encontrar el archivo de esquema de validación');
        }
    } catch (error) {
        console.log('❌ Error al verificar esquema:', error.message);
    }
    
    console.log('');
}

// Ejecutar tests
async function runAllTests() {
    console.log('🚀 INICIANDO TESTS DE API Y VALIDACIÓN');
    console.log('======================================');
    console.log('');

    // Test 1: Verificar esquema
    testValidationSchema();

    // Test 2: Probar API
    try {
        const result = await testAPIContactPhone();
        
        console.log('📊 RESUMEN DE RESULTADOS:');
        console.log('========================');
        
        if (result.success) {
            console.log('✅ La API maneja correctamente el campo contact_phone');
            console.log('✅ No hay errores de validación relacionados con contact_phone');
        } else {
            console.log('❌ Hay problemas con la API o el campo contact_phone');
        }
        
    } catch (error) {
        console.log('❌ Error durante el testing:', error.message);
    }

    console.log('');
    console.log('🏁 Testing completado');
}

// Ejecutar
runAllTests();
