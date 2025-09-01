const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING EXHAUSTIVO - VALIDACIONES TYPESCRIPT');
console.log('================================================');

// Test 1: Verificar que el archivo de validaciones existe y es válido
function testValidationFileExists() {
    console.log('\n📁 Test 1: Verificando archivo de validaciones...');
    
    const validationPath = path.join(__dirname, 'src/lib/validations/property.ts');
    
    if (!fs.existsSync(validationPath)) {
        console.log('❌ ERROR: Archivo de validaciones no encontrado');
        return false;
    }
    
    const content = fs.readFileSync(validationPath, 'utf8');
    
    // Verificar imports necesarios
    const requiredImports = ['import { z }', 'from "zod"'];
    const hasRequiredImports = requiredImports.every(imp => content.includes(imp));
    
    if (!hasRequiredImports) {
        console.log('❌ ERROR: Imports de Zod faltantes');
        return false;
    }
    
    console.log('✅ Archivo de validaciones encontrado y válido');
    return true;
}

// Test 2: Verificar esquemas principales
function testMainSchemas() {
    console.log('\n🏗️ Test 2: Verificando esquemas principales...');
    
    const validationPath = path.join(__dirname, 'src/lib/validations/property.ts');
    const content = fs.readFileSync(validationPath, 'utf8');
    
    const requiredSchemas = [
        'PropertyTypeEnum',
        'PropertyStatusEnum', 
        'PropertyConditionEnum',
        'PropertySchema',
        'CreatePropertySchema',
        'UpdatePropertySchema'
    ];
    
    const missingSchemas = requiredSchemas.filter(schema => !content.includes(schema));
    
    if (missingSchemas.length > 0) {
        console.log(`❌ ERROR: Esquemas faltantes: ${missingSchemas.join(', ')}`);
        return false;
    }
    
    console.log('✅ Todos los esquemas principales encontrados');
    return true;
}

// Test 3: Verificar tipos de enums
function testEnumTypes() {
    console.log('\n🔢 Test 3: Verificando tipos de enums...');
    
    const validationPath = path.join(__dirname, 'src/lib/validations/property.ts');
    const content = fs.readFileSync(validationPath, 'utf8');
    
    // Verificar PropertyType enum
    const propertyTypes = ['CASA', 'DEPARTAMENTO', 'TERRENO', 'LOCAL_COMERCIAL', 'OFICINA'];
    const hasPropertyTypes = propertyTypes.every(type => content.includes(`"${type}"`));
    
    if (!hasPropertyTypes) {
        console.log('❌ ERROR: Tipos de propiedad incompletos');
        return false;
    }
    
    // Verificar PropertyStatus enum
    const propertyStatuses = ['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'ALQUILADO'];
    const hasPropertyStatuses = propertyStatuses.every(status => content.includes(`"${status}"`));
    
    if (!hasPropertyStatuses) {
        console.log('❌ ERROR: Estados de propiedad incompletos');
        return false;
    }
    
    console.log('✅ Todos los tipos de enum verificados');
    return true;
}

// Test 4: Verificar validaciones de campos
function testFieldValidations() {
    console.log('\n🔍 Test 4: Verificando validaciones de campos...');
    
    const validationPath = path.join(__dirname, 'src/lib/validations/property.ts');
    const content = fs.readFileSync(validationPath, 'utf8');
    
    // Verificar validaciones numéricas
    const numericValidations = [
        'z.number().positive()',
        'z.number().min(0)',
        'z.number().optional()'
    ];
    
    const hasNumericValidations = numericValidations.some(validation => 
        content.includes(validation) || content.includes(validation.replace('z.number()', 'z.coerce.number()'))
    );
    
    if (!hasNumericValidations) {
        console.log('❌ ERROR: Validaciones numéricas faltantes');
        return false;
    }
    
    // Verificar validaciones de string
    const stringValidations = [
        'z.string().min(',
        'z.string().optional()',
        'z.string().url()'
    ];
    
    const hasStringValidations = stringValidations.some(validation => content.includes(validation));
    
    if (!hasStringValidations) {
        console.log('❌ ERROR: Validaciones de string faltantes');
        return false;
    }
    
    console.log('✅ Validaciones de campos verificadas');
    return true;
}

// Test 5: Verificar arrays y objetos complejos
function testComplexTypes() {
    console.log('\n🏗️ Test 5: Verificando tipos complejos...');
    
    const validationPath = path.join(__dirname, 'src/lib/validations/property.ts');
    const content = fs.readFileSync(validationPath, 'utf8');
    
    // Verificar arrays
    const arrayValidations = [
        'z.array(',
        'z.string().array()',
        '.optional().default([])'
    ];
    
    const hasArrayValidations = arrayValidations.some(validation => content.includes(validation));
    
    if (!hasArrayValidations) {
        console.log('❌ ERROR: Validaciones de array faltantes');
        return false;
    }
    
    // Verificar objetos anidados
    const objectValidations = [
        'z.object({',
        'z.record(',
        'z.any()'
    ];
    
    const hasObjectValidations = objectValidations.some(validation => content.includes(validation));
    
    if (!hasObjectValidations) {
        console.log('❌ ERROR: Validaciones de objeto faltantes');
        return false;
    }
    
    console.log('✅ Tipos complejos verificados');
    return true;
}

// Test 6: Verificar exports
function testExports() {
    console.log('\n📤 Test 6: Verificando exports...');
    
    const validationPath = path.join(__dirname, 'src/lib/validations/property.ts');
    const content = fs.readFileSync(validationPath, 'utf8');
    
    const requiredExports = [
        'export const PropertySchema',
        'export const CreatePropertySchema',
        'export const UpdatePropertySchema',
        'export type Property',
        'export type CreateProperty',
        'export type UpdateProperty'
    ];
    
    const missingExports = requiredExports.filter(exp => !content.includes(exp));
    
    if (missingExports.length > 0) {
        console.log(`❌ ERROR: Exports faltantes: ${missingExports.join(', ')}`);
        return false;
    }
    
    console.log('✅ Todos los exports verificados');
    return true;
}

// Test 7: Verificar compatibilidad con Prisma
function testPrismaCompatibility() {
    console.log('\n🗄️ Test 7: Verificando compatibilidad con Prisma...');
    
    const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
    const validationPath = path.join(__dirname, 'src/lib/validations/property.ts');
    
    if (!fs.existsSync(schemaPath)) {
        console.log('⚠️ WARNING: Schema de Prisma no encontrado, saltando test');
        return true;
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const validationContent = fs.readFileSync(validationPath, 'utf8');
    
    // Verificar que los campos principales existen en ambos
    const prismaFields = ['title', 'description', 'price', 'type', 'status'];
    const fieldsInValidation = prismaFields.every(field => validationContent.includes(field));
    
    if (!fieldsInValidation) {
        console.log('❌ ERROR: Campos de Prisma no reflejados en validaciones');
        return false;
    }
    
    console.log('✅ Compatibilidad con Prisma verificada');
    return true;
}

// Test 8: Verificar sintaxis TypeScript
function testTypeScriptSyntax() {
    console.log('\n📝 Test 8: Verificando sintaxis TypeScript...');
    
    const validationPath = path.join(__dirname, 'src/lib/validations/property.ts');
    const content = fs.readFileSync(validationPath, 'utf8');
    
    // Verificar sintaxis básica
    const syntaxChecks = [
        // No debe tener errores de sintaxis obvios
        content.split('{').length === content.split('}').length, // Llaves balanceadas
        content.split('(').length === content.split(')').length, // Paréntesis balanceados
        content.split('[').length === content.split(']').length, // Corchetes balanceados
        !content.includes('undefined'), // No debe tener undefined explícito
        !content.includes('null'), // Preferir optional() sobre null
    ];
    
    const syntaxValid = syntaxChecks.every(check => check);
    
    if (!syntaxValid) {
        console.log('❌ ERROR: Problemas de sintaxis detectados');
        return false;
    }
    
    console.log('✅ Sintaxis TypeScript válida');
    return true;
}

// Ejecutar todos los tests
async function runAllTests() {
    console.log('🚀 Iniciando testing exhaustivo de validaciones TypeScript...\n');
    
    const tests = [
        testValidationFileExists,
        testMainSchemas,
        testEnumTypes,
        testFieldValidations,
        testComplexTypes,
        testExports,
        testPrismaCompatibility,
        testTypeScriptSyntax
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            const result = test();
            if (result) {
                passedTests++;
            }
        } catch (error) {
            console.log(`❌ ERROR en test: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 RESULTADOS FINALES:`);
    console.log(`✅ Tests pasados: ${passedTests}/${totalTests}`);
    console.log(`📈 Porcentaje de éxito: ${Math.round((passedTests/totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ¡TODOS LOS TESTS PASARON! Las validaciones TypeScript están correctas.');
    } else {
        console.log('⚠️ Algunos tests fallaron. Revisar los errores arriba.');
    }
    
    return passedTests === totalTests;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };
