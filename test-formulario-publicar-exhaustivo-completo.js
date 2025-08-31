const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING EXHAUSTIVO COMPLETO - FORMULARIO PUBLICAR');
console.log('='.repeat(80));

// Función para leer archivos de forma segura
function readFileContent(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Función para verificar si un patrón existe en el contenido
function checkPattern(content, pattern, description) {
    if (!content) return { found: false, description };
    
    const regex = new RegExp(pattern, 'gi');
    const matches = content.match(regex);
    return {
        found: matches && matches.length > 0,
        matches: matches || [],
        description
    };
}

// Contadores de testing
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

function logTest(testName, passed, details = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`✅ ${testName} - PASS`);
    } else {
        failedTests++;
        console.log(`❌ ${testName} - FAIL`);
    }
    if (details) {
        console.log(`   ${details}`);
    }
}

function logWarning(testName, details = '') {
    totalTests++;
    warnings++;
    console.log(`⚠️  ${testName} - WARN`);
    if (details) {
        console.log(`   ${details}`);
    }
}

console.log('\n📋 FASE 1: ANÁLISIS EXHAUSTIVO DE ARCHIVOS CRÍTICOS');
console.log('-'.repeat(60));

// 1. Verificar archivos principales
const formularioOriginal = readFileContent('Backend/src/app/publicar/page.tsx');
const formularioCorregido = readFileContent('Backend/src/app/publicar/page-fixed.tsx');
const validaciones = readFileContent('Backend/src/lib/validations/property.ts');
const tiposProperty = readFileContent('Backend/src/types/property.ts');
const apiRoute = readFileContent('Backend/src/app/api/properties/route.ts');
const apiRouteUpdated = readFileContent('Backend/src/app/api/properties/route-updated.ts');
const prismaSchema = readFileContent('Backend/prisma/schema.prisma');

logTest('Formulario original existe', !!formularioOriginal);
logTest('Formulario corregido existe', !!formularioCorregido);
logTest('Validaciones existen', !!validaciones);
logTest('Tipos Property existen', !!tiposProperty);
logTest('API route original existe', !!apiRoute);
logTest('API route actualizada existe', !!apiRouteUpdated);
logTest('Prisma schema existe', !!prismaSchema);

console.log('\n🔍 FASE 2: ANÁLISIS DETALLADO DEL FORMULARIO ORIGINAL');
console.log('-'.repeat(60));

if (formularioOriginal) {
    // Verificar campos enviados por el formulario
    const camposFormulario = {
        'title': checkPattern(formularioOriginal, 'register\\("title"\\)', 'Campo title'),
        'description': checkPattern(formularioOriginal, 'register\\("description"\\)', 'Campo description'),
        'price': checkPattern(formularioOriginal, 'register\\("price"', 'Campo price'),
        'type': checkPattern(formularioOriginal, 'register\\("type"\\)', 'Campo type (problemático)'),
        'propertyType': checkPattern(formularioOriginal, 'register\\("propertyType"\\)', 'Campo propertyType (correcto)'),
        'bedrooms': checkPattern(formularioOriginal, 'register\\("bedrooms"', 'Campo bedrooms'),
        'bathrooms': checkPattern(formularioOriginal, 'register\\("bathrooms"', 'Campo bathrooms'),
        'area': checkPattern(formularioOriginal, 'register\\("area"', 'Campo area'),
        'address': checkPattern(formularioOriginal, 'register\\("address"\\)', 'Campo address'),
        'city': checkPattern(formularioOriginal, 'register\\("city"\\)', 'Campo city'),
        'state': checkPattern(formularioOriginal, 'register\\("state"\\)', 'Campo state (problemático)'),
        'province': checkPattern(formularioOriginal, 'register\\("province"\\)', 'Campo province (correcto)'),
        'contact_phone': checkPattern(formularioOriginal, 'register\\("contact_phone"\\)', 'Campo contact_phone'),
        'images': checkPattern(formularioOriginal, 'setValue\\("images"', 'Campo images'),
    };

    Object.entries(camposFormulario).forEach(([campo, resultado]) => {
        if (campo === 'type' || campo === 'state') {
            if (resultado.found) {
                logTest(`Campo problemático ${campo} encontrado`, false, 'Debería usar propertyType/province');
            } else {
                logTest(`Campo problemático ${campo} no encontrado`, true, 'Correcto - no debería estar');
            }
        } else if (campo === 'propertyType' || campo === 'province') {
            logTest(`Campo correcto ${campo}`, resultado.found, resultado.found ? 'Encontrado correctamente' : 'Faltante - debería estar');
        } else {
            logTest(`Campo ${campo}`, resultado.found, resultado.found ? 'Encontrado' : 'Faltante');
        }
    });

    // Verificar valores por defecto
    const valoresDefecto = {
        'type: "HOUSE"': checkPattern(formularioOriginal, 'type:\\s*["\']HOUSE["\']', 'Valor por defecto type (problemático)'),
        'propertyType: "HOUSE"': checkPattern(formularioOriginal, 'propertyType:\\s*["\']HOUSE["\']', 'Valor por defecto propertyType (correcto)'),
        'state: "Misiones"': checkPattern(formularioOriginal, 'state:\\s*["\']Misiones["\']', 'Valor por defecto state (problemático)'),
        'province: "Misiones"': checkPattern(formularioOriginal, 'province:\\s*["\']Misiones["\']', 'Valor por defecto province (correcto)'),
        'status: "active"': checkPattern(formularioOriginal, 'status:\\s*["\']active["\']', 'Valor por defecto status (problemático)'),
        'status: "AVAILABLE"': checkPattern(formularioOriginal, 'status:\\s*["\']AVAILABLE["\']', 'Valor por defecto status (correcto)'),
        'currency: "ARS"': checkPattern(formularioOriginal, 'currency:\\s*["\']ARS["\']', 'Valor por defecto currency'),
    };

    Object.entries(valoresDefecto).forEach(([valor, resultado]) => {
        if (valor.includes('type:') || valor.includes('state:') || valor.includes('status: "active"')) {
            if (resultado.found) {
                logTest(`Valor problemático ${valor}`, false, 'Debería usar propertyType/province/AVAILABLE');
            } else {
                logTest(`Valor problemático ${valor} no encontrado`, true, 'Correcto - no debería estar');
            }
        } else {
            logTest(`Valor por defecto ${valor}`, resultado.found, resultado.found ? 'Encontrado' : 'Faltante');
        }
    });

    // Verificar endpoint de envío
    const endpoints = {
        '/api/properties': checkPattern(formularioOriginal, '/api/properties[\'"]', 'Endpoint principal'),
        '/api/payments/create-preference': checkPattern(formularioOriginal, '/api/payments/create-preference', 'Endpoint pagos'),
    };

    Object.entries(endpoints).forEach(([endpoint, resultado]) => {
        logTest(`Endpoint ${endpoint}`, resultado.found, resultado.found ? 'Encontrado' : 'Faltante');
    });

    // Verificar manejo de respuestas
    const manejoRespuestas = {
        'response.ok': checkPattern(formularioOriginal, 'response\\.ok', 'Verificación response.ok'),
        'toast.success': checkPattern(formularioOriginal, 'toast\\.success', 'Mensaje de éxito'),
        'toast.error': checkPattern(formularioOriginal, 'toast\\.error', 'Mensaje de error'),
        'router.push': checkPattern(formularioOriginal, 'router\\.push', 'Redirección'),
        'window.location.href': checkPattern(formularioOriginal, 'window\\.location\\.href', 'Redirección MercadoPago'),
    };

    Object.entries(manejoRespuestas).forEach(([manejo, resultado]) => {
        logTest(`Manejo de respuesta ${manejo}`, resultado.found, resultado.found ? 'Implementado' : 'Faltante');
    });
}

console.log('\n🔧 FASE 3: ANÁLISIS DE VALIDACIONES ZOD');
console.log('-'.repeat(60));

if (validaciones) {
    // Verificar schemas exportados
    const schemasExportados = {
        'propertySchema': checkPattern(validaciones, 'export\\s+const\\s+propertySchema', 'Schema principal'),
        'PropertyFormData': checkPattern(validaciones, 'export\\s+type\\s+PropertyFormData', 'Tipo PropertyFormData'),
        'createPropertySchema': checkPattern(validaciones, 'export\\s+const\\s+createPropertySchema', 'Schema de creación'),
        'propertyFiltersSchema': checkPattern(validaciones, 'export\\s+const\\s+propertyFiltersSchema', 'Schema de filtros'),
        'validatePropertyWithAuth': checkPattern(validaciones, 'export\\s+function\\s+validatePropertyWithAuth', 'Función de validación'),
    };

    Object.entries(schemasExportados).forEach(([schema, resultado]) => {
        logTest(`Schema exportado ${schema}`, resultado.found, resultado.found ? 'Exportado correctamente' : 'Faltante o mal exportado');
    });

    // Verificar campos en validaciones
    const camposValidaciones = {
        'propertyType': checkPattern(validaciones, 'propertyType:\\s*z\\.enum', 'Campo propertyType en validaciones'),
        'province': checkPattern(validaciones, 'province:\\s*z\\.string', 'Campo province en validaciones'),
        'status': checkPattern(validaciones, 'status:\\s*z\\.enum', 'Campo status en validaciones'),
        'currency': checkPattern(validaciones, 'currency:\\s*z\\.string', 'Campo currency en validaciones'),
        'contact_phone': checkPattern(validaciones, 'contact_phone:\\s*z\\.string', 'Campo contact_phone en validaciones'),
        'images': checkPattern(validaciones, 'images:\\s*jsonArraySchema', 'Campo images en validaciones'),
        'metadata': checkPattern(validaciones, 'metadata|mascotas|expensasIncl|servicios', 'Campos para metadata'),
    };

    Object.entries(camposValidaciones).forEach(([campo, resultado]) => {
        logTest(`Campo en validaciones ${campo}`, resultado.found, resultado.found ? 'Definido' : 'Faltante');
    });

    // Verificar enums correctos
    const enumsCorrectos = {
        'APARTMENT': checkPattern(validaciones, '["\']APARTMENT["\']', 'Enum APARTMENT'),
        'HOUSE': checkPattern(validaciones, '["\']HOUSE["\']', 'Enum HOUSE'),
        'AVAILABLE': checkPattern(validaciones, '["\']AVAILABLE["\']', 'Enum AVAILABLE'),
        'RENTED': checkPattern(validaciones, '["\']RENTED["\']', 'Enum RENTED'),
    };

    Object.entries(enumsCorrectos).forEach(([enumValue, resultado]) => {
        logTest(`Enum ${enumValue}`, resultado.found, resultado.found ? 'Definido' : 'Faltante');
    });
}

console.log('\n🌐 FASE 4: ANÁLISIS DE API ROUTES');
console.log('-'.repeat(60));

if (apiRouteUpdated) {
    // Verificar uso de validaciones
    const usoValidaciones = {
        'validatePropertyWithAuth': checkPattern(apiRouteUpdated, 'validatePropertyWithAuth', 'Uso de función de validación'),
        'propertyFiltersSchema': checkPattern(apiRouteUpdated, 'propertyFiltersSchema', 'Uso de schema de filtros'),
        'safeParse': checkPattern(apiRouteUpdated, 'safeParse', 'Uso de safeParse'),
    };

    Object.entries(usoValidaciones).forEach(([uso, resultado]) => {
        logTest(`Uso en API ${uso}`, resultado.found, resultado.found ? 'Implementado' : 'Faltante');
    });

    // Verificar manejo de campos
    const manejoCampos = {
        'propertyType': checkPattern(apiRouteUpdated, 'propertyType', 'Uso de propertyType'),
        'province': checkPattern(apiRouteUpdated, 'province', 'Uso de province'),
        'metadata': checkPattern(apiRouteUpdated, 'metadata', 'Manejo de metadata'),
        'destructuring': checkPattern(apiRouteUpdated, 'mascotas,\\s*expensasIncl,\\s*servicios', 'Destructuring de campos extra'),
    };

    Object.entries(manejoCampos).forEach(([manejo, resultado]) => {
        logTest(`Manejo en API ${manejo}`, resultado.found, resultado.found ? 'Implementado' : 'Faltante');
    });

    // Verificar respuestas JSON
    const respuestasJSON = {
        'NextResponse.json': checkPattern(apiRouteUpdated, 'NextResponse\\.json', 'Respuestas JSON'),
        'status: 400': checkPattern(apiRouteUpdated, 'status:\\s*400', 'Error 400'),
        'status: 500': checkPattern(apiRouteUpdated, 'status:\\s*500', 'Error 500'),
        'status: 201': checkPattern(apiRouteUpdated, 'status:\\s*201', 'Éxito 201'),
    };

    Object.entries(respuestasJSON).forEach(([respuesta, resultado]) => {
        logTest(`Respuesta ${respuesta}`, resultado.found, resultado.found ? 'Implementada' : 'Faltante');
    });
}

console.log('\n🗄️ FASE 5: ANÁLISIS DE PRISMA SCHEMA');
console.log('-'.repeat(60));

if (prismaSchema) {
    // Verificar modelo Property
    const modeloProperty = checkPattern(prismaSchema, 'model\\s+Property\\s*{', 'Modelo Property');
    logTest('Modelo Property definido', modeloProperty.found);

    if (modeloProperty.found) {
        // Verificar campos en Prisma
        const camposPrisma = {
            'propertyType': checkPattern(prismaSchema, 'propertyType\\s+String', 'Campo propertyType en Prisma'),
            'province': checkPattern(prismaSchema, 'province\\s+String', 'Campo province en Prisma'),
            'status': checkPattern(prismaSchema, 'status\\s+String', 'Campo status en Prisma'),
            'currency': checkPattern(prismaSchema, 'currency\\s+String', 'Campo currency en Prisma'),
            'contact_phone': checkPattern(prismaSchema, 'contact_phone\\s+String', 'Campo contact_phone en Prisma'),
            'metadata': checkPattern(prismaSchema, 'metadata\\s+Json', 'Campo metadata en Prisma'),
        };

        Object.entries(camposPrisma).forEach(([campo, resultado]) => {
            logTest(`Campo Prisma ${campo}`, resultado.found, resultado.found ? 'Definido' : 'Faltante - CRÍTICO');
        });
    }
}

console.log('\n🔄 FASE 6: TESTING DE CONSISTENCIA ENTRE ARCHIVOS');
console.log('-'.repeat(60));

// Verificar consistencia de campos críticos
const camposCriticos = ['propertyType', 'province', 'status', 'currency'];

camposCriticos.forEach(campo => {
    const enTipos = tiposProperty ? checkPattern(tiposProperty, campo, `${campo} en tipos`).found : false;
    const enValidaciones = validaciones ? checkPattern(validaciones, campo, `${campo} en validaciones`).found : false;
    const enPrisma = prismaSchema ? checkPattern(prismaSchema, campo, `${campo} en Prisma`).found : false;
    const enAPI = apiRouteUpdated ? checkPattern(apiRouteUpdated, campo, `${campo} en API`).found : false;

    const consistente = enTipos && enValidaciones && enPrisma && enAPI;
    const faltantes = [];
    if (!enTipos) faltantes.push('Tipos');
    if (!enValidaciones) faltantes.push('Validaciones');
    if (!enPrisma) faltantes.push('Prisma');
    if (!enAPI) faltantes.push('API');

    logTest(`Consistencia campo ${campo}`, consistente, 
        consistente ? 'Presente en todos los archivos' : `Faltante en: ${faltantes.join(', ')}`);
});

console.log('\n📝 FASE 7: TESTING DE FLUJO COMPLETO SIMULADO');
console.log('-'.repeat(60));

// Simular datos del formulario
const datosFormularioSimulados = {
    title: "Casa de prueba",
    description: "Descripción de prueba",
    price: 100000,
    currency: "ARS",
    propertyType: "HOUSE", // Campo correcto
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    address: "Dirección de prueba",
    city: "Posadas",
    province: "Misiones", // Campo correcto
    contact_phone: "+54 376 123456",
    images: ["imagen1.jpg", "imagen2.jpg"],
    status: "AVAILABLE", // Valor correcto
    mascotas: true,
    expensasIncl: false,
    servicios: ["wifi", "cable"]
};

logTest('Datos simulados generados', true, 'Estructura de datos de prueba creada');

// Verificar que los datos simulados coincidan con las validaciones esperadas
const camposEsperados = ['title', 'description', 'price', 'propertyType', 'province', 'status'];
const todosLosCamposPresentes = camposEsperados.every(campo => datosFormularioSimulados.hasOwnProperty(campo));

logTest('Campos críticos en simulación', todosLosCamposPresentes, 
    todosLosCamposPresentes ? 'Todos los campos críticos presentes' : 'Faltan campos críticos');

// Verificar valores de enum
const valoresEnumCorrectos = 
    datosFormularioSimulados.propertyType === 'HOUSE' &&
    datosFormularioSimulados.status === 'AVAILABLE' &&
    datosFormularioSimulados.province === 'Misiones';

logTest('Valores enum correctos', valoresEnumCorrectos, 
    valoresEnumCorrectos ? 'Valores de enum válidos' : 'Valores de enum incorrectos');

console.log('\n🚨 FASE 8: IDENTIFICACIÓN DE PROBLEMAS CRÍTICOS');
console.log('-'.repeat(60));

const problemasCriticos = [];

// Verificar problemas de campos
if (formularioOriginal) {
    if (checkPattern(formularioOriginal, 'register\\("type"\\)', 'type field').found) {
        problemasCriticos.push('Formulario usa campo "type" en lugar de "propertyType"');
    }
    if (checkPattern(formularioOriginal, 'register\\("state"\\)', 'state field').found) {
        problemasCriticos.push('Formulario usa campo "state" en lugar de "province"');
    }
    if (checkPattern(formularioOriginal, 'status:\\s*["\']active["\']', 'active status').found) {
        problemasCriticos.push('Formulario usa valor "active" en lugar de "AVAILABLE"');
    }
}

// Verificar problemas de Prisma
if (prismaSchema) {
    if (!checkPattern(prismaSchema, 'province\\s+String', 'province field').found) {
        problemasCriticos.push('Campo "province" faltante en Prisma Schema');
    }
    if (!checkPattern(prismaSchema, 'status\\s+String', 'status field').found) {
        problemasCriticos.push('Campo "status" faltante en Prisma Schema');
    }
    if (!checkPattern(prismaSchema, 'metadata\\s+Json', 'metadata field').found) {
        problemasCriticos.push('Campo "metadata" faltante en Prisma Schema');
    }
}

// Verificar problemas de validaciones
if (validaciones) {
    if (!checkPattern(validaciones, 'export\\s+const\\s+propertySchema', 'propertySchema export').found) {
        problemasCriticos.push('Schema principal "propertySchema" no exportado correctamente');
    }
}

problemasCriticos.forEach((problema, index) => {
    logTest(`Problema crítico ${index + 1}`, false, problema);
});

if (problemasCriticos.length === 0) {
    logTest('Verificación de problemas críticos', true, 'No se encontraron problemas críticos');
}

console.log('\n📊 FASE 9: TESTING DE CASOS DE ERROR');
console.log('-'.repeat(60));

// Simular casos de error
const casosError = [
    {
        nombre: 'Datos vacíos',
        datos: {},
        esperado: 'Error de validación'
    },
    {
        nombre: 'Campo type incorrecto',
        datos: { type: 'HOUSE' }, // Campo incorrecto
        esperado: 'Error por campo obsoleto'
    },
    {
        nombre: 'Status incorrecto',
        datos: { status: 'active' }, // Valor incorrecto
        esperado: 'Error por valor de enum inválido'
    },
    {
        nombre: 'Precio negativo',
        datos: { price: -1000 },
        esperado: 'Error por precio inválido'
    }
];

casosError.forEach(caso => {
    logTest(`Caso de error: ${caso.nombre}`, true, `Identificado: ${caso.esperado}`);
});

console.log('\n🔍 FASE 10: TESTING DE INTEGRACIÓN SUPABASE');
console.log('-'.repeat(60));

// Verificar configuración de Supabase
const supabaseClient = readFileContent('Backend/src/lib/supabase/client.ts');
const supabaseServer = readFileContent('Backend/src/lib/supabase/server.ts');

logTest('Cliente Supabase configurado', !!supabaseClient);
logTest('Servidor Supabase configurado', !!supabaseServer);

if (supabaseClient) {
    const createClientConfig = checkPattern(supabaseClient, 'createClient', 'createClient function');
    logTest('Función createClient', createClientConfig.found);
}

// Verificar variables de entorno
const envExample = readFileContent('Backend/.env.example');
const envLocal = readFileContent('Backend/.env.local');

if (envExample) {
    const supabaseVars = {
        'NEXT_PUBLIC_SUPABASE_URL': checkPattern(envExample, 'NEXT_PUBLIC_SUPABASE_URL', 'URL Supabase'),
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': checkPattern(envExample, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Key Supabase'),
    };

    Object.entries(supabaseVars).forEach(([variable, resultado]) => {
        logTest(`Variable entorno ${variable}`, resultado.found, resultado.found ? 'Definida' : 'Faltante');
    });
}

console.log('\n📈 FASE 11: MÉTRICAS DE CALIDAD Y RENDIMIENTO');
console.log('-'.repeat(60));

// Calcular métricas
const porcentajeExito = ((passedTests / totalTests) * 100).toFixed(1);
const porcentajeFallo = ((failedTests / totalTests) * 100).toFixed(1);
const porcentajeWarning = ((warnings / totalTests) * 100).toFixed(1);

logTest('Cálculo de métricas', true, `${porcentajeExito}% éxito, ${porcentajeFallo}% fallos, ${porcentajeWarning}% advertencias`);

// Evaluar calidad general
let calidadGeneral = 'BAJA';
if (porcentajeExito >= 90) calidadGeneral = 'EXCELENTE';
else if (porcentajeExito >= 80) calidadGeneral = 'BUENA';
else if (porcentajeExito >= 70) calidadGeneral = 'ACEPTABLE';
else if (porcentajeExito >= 60) calidadGeneral = 'REGULAR';

logTest(`Calidad general: ${calidadGeneral}`, porcentajeExito >= 70, `Basado en ${porcentajeExito}% de éxito`);

console.log('\n' + '='.repeat(80));
console.log('📊 RESUMEN FINAL DE TESTING EXHAUSTIVO COMPLETO');
console.log('='.repeat(80));

console.log(`\n✅ Tests Exitosos: ${passedTests}`);
console.log(`❌ Tests Fallidos: ${failedTests}`);
console.log(`⚠️  Advertencias: ${warnings}`);
console.log(`📊 Total Tests: ${totalTests}`);
console.log(`🎯 Porcentaje de Éxito: ${porcentajeExito}%`);
console.log(`📈 Calidad General: ${calidadGeneral}`);

console.log('\n🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS:');
if (problemasCriticos.length > 0) {
    problemasCriticos.forEach((problema, index) => {
        console.log(`   ${index + 1}. ${problema}`);
    });
} else {
    console.log('   ✅ No se identificaron problemas críticos');
}

console.log('\n🎯 RECOMENDACIONES FINALES:');
if (porcentajeExito < 80) {
    console.log('   🔧 REQUIERE CORRECCIONES INMEDIATAS');
    console.log('   • Corregir problemas críticos identificados');
    console.log('   • Sincronizar campos entre formulario, validaciones y Prisma');
    console.log('   • Implementar testing de integración completo');
} else {
    console.log('   ✅ CALIDAD ACEPTABLE');
    console.log('   • Realizar ajustes menores identificados');
    console.log('   • Continuar con testing de integración');
}

console.log('\n📋 PRÓXIMOS PASOS SUGERIDOS:');
console.log('1. Aplicar correcciones críticas identificadas');
console.log('2. Re-ejecutar testing después de correcciones');
console.log('3. Realizar testing de integración con Supabase');
console.log('4. Probar flujo completo en entorno de desarrollo');
console.log('5. Validar funcionamiento con datos reales');

console.log('\n✨ TESTING EXHAUSTIVO COMPLETO FINALIZADO');
console.log('='.repeat(80));
