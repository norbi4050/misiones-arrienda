const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS EXHAUSTIVO DEL SCHEMA - PROYECTO MISIONES ARRIENDA');
console.log('================================================================');

// Función para leer archivos
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return null;
    }
}

// Función para extraer campos de un schema Zod
function extractZodFields(content) {
    const fields = {};
    const lines = content.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        if (line.includes(':') && line.includes('z.')) {
            const fieldMatch = line.match(/(\w+):\s*z\.(\w+)/);
            if (fieldMatch) {
                const [, fieldName, fieldType] = fieldMatch;
                const isRequired = !line.includes('.optional()');
                const hasMin = line.includes('.min(');
                const hasMax = line.includes('.max(');
                
                fields[fieldName] = {
                    type: fieldType,
                    required: isRequired,
                    hasMin,
                    hasMax,
                    line: line
                };
            }
        }
    }
    
    return fields;
}

// Función para extraer campos del schema Prisma
function extractPrismaFields(content) {
    const fields = {};
    const lines = content.split('\n');
    let inPropertyModel = false;
    
    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('model Property')) {
            inPropertyModel = true;
            continue;
        }
        
        if (inPropertyModel && line.startsWith('}')) {
            break;
        }
        
        if (inPropertyModel && line.includes(' ') && !line.startsWith('//') && !line.startsWith('@@')) {
            const fieldMatch = line.match(/(\w+)\s+(\w+)(\?)?/);
            if (fieldMatch) {
                const [, fieldName, fieldType, optional] = fieldMatch;
                const isRequired = !optional;
                const hasDefault = line.includes('@default');
                
                fields[fieldName] = {
                    type: fieldType,
                    required: isRequired,
                    hasDefault,
                    line: line
                };
            }
        }
    }
    
    return fields;
}

// Función para extraer campos del API
function extractAPIFields(content) {
    const fields = {};
    
    // Buscar destructuring en POST
    const destructuringMatch = content.match(/const\s*{\s*([\s\S]*?)\s*}\s*=\s*body/);
    if (destructuringMatch) {
        const destructuredFields = destructuringMatch[1];
        const fieldMatches = destructuredFields.match(/(\w+)/g);
        
        if (fieldMatches) {
            fieldMatches.forEach(field => {
                fields[field] = {
                    extracted: true,
                    line: `${field} (from destructuring)`
                };
            });
        }
    }
    
    // Buscar validación básica
    const validationMatch = content.match(/if\s*\(([^)]+)\)\s*{[\s\S]*?Missing required fields/);
    if (validationMatch) {
        const validationCondition = validationMatch[1];
        const requiredFields = validationCondition.match(/!\w+/g);
        
        if (requiredFields) {
            requiredFields.forEach(field => {
                const fieldName = field.substring(1); // Remove !
                if (fields[fieldName]) {
                    fields[fieldName].required = true;
                }
            });
        }
    }
    
    return fields;
}

// Función para extraer campos del formulario
function extractFormFields(content) {
    const fields = {};
    
    // Buscar register calls
    const registerMatches = content.match(/register\("(\w+)"\)/g);
    if (registerMatches) {
        registerMatches.forEach(match => {
            const fieldName = match.match(/register\("(\w+)"\)/)[1];
            fields[fieldName] = {
                inForm: true,
                line: `register("${fieldName}")`
            };
        });
    }
    
    // Buscar defaultValues
    const defaultValuesMatch = content.match(/defaultValues:\s*{([\s\S]*?)}/);
    if (defaultValuesMatch) {
        const defaultValues = defaultValuesMatch[1];
        const fieldMatches = defaultValues.match(/(\w+):\s*[^,\n}]+/g);
        
        if (fieldMatches) {
            fieldMatches.forEach(match => {
                const fieldName = match.match(/(\w+):/)[1];
                if (fields[fieldName]) {
                    fields[fieldName].hasDefault = true;
                } else {
                    fields[fieldName] = {
                        hasDefault: true,
                        line: match.trim()
                    };
                }
            });
        }
    }
    
    return fields;
}

async function analyzeSchema() {
    console.log('\n📋 FASE 1: CARGANDO ARCHIVOS');
    console.log('============================');
    
    // Cargar archivos
    const validationSchema = readFile(path.join(__dirname, 'Backend', 'src', 'lib', 'validations', 'property.ts'));
    const prismaSchema = readFile(path.join(__dirname, 'Backend', 'prisma', 'schema.prisma'));
    const apiRoute = readFile(path.join(__dirname, 'Backend', 'src', 'app', 'api', 'properties', 'route.ts'));
    const formComponent = readFile(path.join(__dirname, 'Backend', 'src', 'app', 'publicar', 'page.tsx'));
    
    console.log(`✅ Schema de validación: ${validationSchema ? 'Cargado' : '❌ No encontrado'}`);
    console.log(`✅ Schema de Prisma: ${prismaSchema ? 'Cargado' : '❌ No encontrado'}`);
    console.log(`✅ API Route: ${apiRoute ? 'Cargado' : '❌ No encontrado'}`);
    console.log(`✅ Formulario: ${formComponent ? 'Cargado' : '❌ No encontrado'}`);
    
    if (!validationSchema || !prismaSchema || !apiRoute || !formComponent) {
        console.log('❌ No se pudieron cargar todos los archivos necesarios');
        return;
    }
    
    console.log('\n📋 FASE 2: EXTRAYENDO CAMPOS');
    console.log('============================');
    
    // Extraer campos de cada fuente
    const zodFields = extractZodFields(validationSchema);
    const prismaFields = extractPrismaFields(prismaSchema);
    const apiFields = extractAPIFields(apiRoute);
    const formFields = extractFormFields(formComponent);
    
    console.log(`📊 Campos en schema Zod: ${Object.keys(zodFields).length}`);
    console.log(`📊 Campos en schema Prisma: ${Object.keys(prismaFields).length}`);
    console.log(`📊 Campos en API: ${Object.keys(apiFields).length}`);
    console.log(`📊 Campos en formulario: ${Object.keys(formFields).length}`);
    
    console.log('\n📋 FASE 3: ANÁLISIS DE ALINEACIÓN');
    console.log('=================================');
    
    // Obtener todos los campos únicos
    const allFields = new Set([
        ...Object.keys(zodFields),
        ...Object.keys(prismaFields),
        ...Object.keys(apiFields),
        ...Object.keys(formFields)
    ]);
    
    console.log(`📊 Total de campos únicos encontrados: ${allFields.size}`);
    
    const results = {
        aligned: [],
        misaligned: [],
        missing: [],
        extra: []
    };
    
    // Analizar cada campo
    for (const field of allFields) {
        const analysis = {
            field,
            inZod: !!zodFields[field],
            inPrisma: !!prismaFields[field],
            inAPI: !!apiFields[field],
            inForm: !!formFields[field],
            zodRequired: zodFields[field]?.required || false,
            prismaRequired: prismaFields[field]?.required || false,
            apiRequired: apiFields[field]?.required || false,
            formHasDefault: formFields[field]?.hasDefault || false
        };
        
        // Determinar estado
        const locations = [analysis.inZod, analysis.inPrisma, analysis.inAPI, analysis.inForm];
        const presentCount = locations.filter(Boolean).length;
        
        if (presentCount === 4) {
            // Verificar consistencia de requerimientos
            if (analysis.zodRequired === analysis.prismaRequired) {
                results.aligned.push(analysis);
            } else {
                results.misaligned.push(analysis);
            }
        } else if (presentCount >= 2) {
            results.misaligned.push(analysis);
        } else {
            results.missing.push(analysis);
        }
    }
    
    console.log('\n📊 RESULTADOS DEL ANÁLISIS');
    console.log('==========================');
    console.log(`✅ Campos alineados: ${results.aligned.length}`);
    console.log(`⚠️  Campos desalineados: ${results.misaligned.length}`);
    console.log(`❌ Campos faltantes: ${results.missing.length}`);
    
    // Mostrar detalles de campos alineados
    if (results.aligned.length > 0) {
        console.log('\n✅ CAMPOS PERFECTAMENTE ALINEADOS:');
        console.log('==================================');
        results.aligned.forEach(field => {
            const reqStatus = field.zodRequired ? 'REQUERIDO' : 'OPCIONAL';
            console.log(`  📌 ${field.field} (${reqStatus})`);
            console.log(`     ✓ Zod: ${field.inZod ? '✅' : '❌'} | Prisma: ${field.inPrisma ? '✅' : '❌'} | API: ${field.inAPI ? '✅' : '❌'} | Form: ${field.inForm ? '✅' : '❌'}`);
        });
    }
    
    // Mostrar detalles de campos desalineados
    if (results.misaligned.length > 0) {
        console.log('\n⚠️  CAMPOS DESALINEADOS:');
        console.log('========================');
        results.misaligned.forEach(field => {
            console.log(`  🔧 ${field.field}`);
            console.log(`     Zod: ${field.inZod ? '✅' : '❌'} | Prisma: ${field.inPrisma ? '✅' : '❌'} | API: ${field.inAPI ? '✅' : '❌'} | Form: ${field.inForm ? '✅' : '❌'}`);
            
            if (field.inZod && field.inPrisma && field.zodRequired !== field.prismaRequired) {
                console.log(`     ⚠️  Inconsistencia: Zod=${field.zodRequired ? 'REQ' : 'OPT'}, Prisma=${field.prismaRequired ? 'REQ' : 'OPT'}`);
            }
            
            if (field.inZod && !field.inForm && field.zodRequired) {
                console.log(`     ❌ Campo requerido en Zod pero falta en formulario`);
            }
            
            if (field.inAPI && !field.inZod) {
                console.log(`     ❌ Campo en API pero no en validación Zod`);
            }
        });
    }
    
    // Mostrar campos faltantes
    if (results.missing.length > 0) {
        console.log('\n❌ CAMPOS CON PRESENCIA MÍNIMA:');
        console.log('===============================');
        results.missing.forEach(field => {
            console.log(`  🔍 ${field.field}`);
            console.log(`     Zod: ${field.inZod ? '✅' : '❌'} | Prisma: ${field.inPrisma ? '✅' : '❌'} | API: ${field.inAPI ? '✅' : '❌'} | Form: ${field.inForm ? '✅' : '❌'}`);
        });
    }
    
    console.log('\n📋 FASE 4: VERIFICACIÓN ESPECÍFICA DEL PROBLEMA');
    console.log('===============================================');
    
    // Verificar específicamente contact_phone
    const contactPhone = allFields.has('contact_phone');
    console.log(`🔍 Campo 'contact_phone' encontrado: ${contactPhone ? '✅' : '❌'}`);
    
    if (contactPhone) {
        const cpAnalysis = {
            inZod: !!zodFields['contact_phone'],
            inPrisma: !!prismaFields['contact_phone'],
            inAPI: !!apiFields['contact_phone'],
            inForm: !!formFields['contact_phone'],
            zodRequired: zodFields['contact_phone']?.required || false,
            prismaRequired: prismaFields['contact_phone']?.required || false
        };
        
        console.log('📊 Análisis detallado de contact_phone:');
        console.log(`   Schema Zod: ${cpAnalysis.inZod ? '✅' : '❌'} ${cpAnalysis.zodRequired ? '(REQUERIDO)' : '(OPCIONAL)'}`);
        console.log(`   Schema Prisma: ${cpAnalysis.inPrisma ? '✅' : '❌'} ${cpAnalysis.prismaRequired ? '(REQUERIDO)' : '(OPCIONAL)'}`);
        console.log(`   API Route: ${cpAnalysis.inAPI ? '✅' : '❌'}`);
        console.log(`   Formulario: ${cpAnalysis.inForm ? '✅' : '❌'}`);
        
        if (cpAnalysis.inZod && cpAnalysis.inPrisma && cpAnalysis.inAPI && cpAnalysis.inForm) {
            console.log('✅ contact_phone está presente en todos los componentes');
        } else {
            console.log('❌ contact_phone tiene problemas de alineación');
        }
    }
    
    console.log('\n📋 FASE 5: RECOMENDACIONES');
    console.log('==========================');
    
    if (results.aligned.length === allFields.size) {
        console.log('🎉 ¡PERFECTO! Todos los campos están perfectamente alineados');
    } else {
        console.log('🔧 ACCIONES RECOMENDADAS:');
        
        if (results.misaligned.length > 0) {
            console.log('\n1. Corregir campos desalineados:');
            results.misaligned.forEach(field => {
                if (field.inZod && field.zodRequired && !field.inForm) {
                    console.log(`   - Agregar ${field.field} al formulario (es requerido en Zod)`);
                }
                if (field.inForm && !field.inZod) {
                    console.log(`   - Agregar ${field.field} al schema de validación Zod`);
                }
                if (field.inAPI && !field.inZod) {
                    console.log(`   - Agregar validación Zod para ${field.field} usado en API`);
                }
                if (field.inZod && field.inPrisma && field.zodRequired !== field.prismaRequired) {
                    console.log(`   - Sincronizar requerimientos de ${field.field} entre Zod y Prisma`);
                }
            });
        }
        
        if (results.missing.length > 0) {
            console.log('\n2. Revisar campos con presencia mínima:');
            results.missing.forEach(field => {
                console.log(`   - Evaluar si ${field.field} es necesario o debe eliminarse`);
            });
        }
    }
    
    console.log('\n📊 RESUMEN FINAL');
    console.log('================');
    console.log(`Total de campos analizados: ${allFields.size}`);
    console.log(`Campos alineados: ${results.aligned.length} (${((results.aligned.length / allFields.size) * 100).toFixed(1)}%)`);
    console.log(`Campos desalineados: ${results.misaligned.length} (${((results.misaligned.length / allFields.size) * 100).toFixed(1)}%)`);
    console.log(`Campos con presencia mínima: ${results.missing.length} (${((results.missing.length / allFields.size) * 100).toFixed(1)}%)`);
    
    const healthScore = (results.aligned.length / allFields.size) * 100;
    console.log(`\n🏥 PUNTUACIÓN DE SALUD DEL SCHEMA: ${healthScore.toFixed(1)}%`);
    
    if (healthScore >= 90) {
        console.log('🟢 Estado: EXCELENTE');
    } else if (healthScore >= 75) {
        console.log('🟡 Estado: BUENO - Algunas mejoras necesarias');
    } else if (healthScore >= 50) {
        console.log('🟠 Estado: REGULAR - Requiere atención');
    } else {
        console.log('🔴 Estado: CRÍTICO - Requiere refactorización');
    }
    
    return {
        totalFields: allFields.size,
        aligned: results.aligned.length,
        misaligned: results.misaligned.length,
        missing: results.missing.length,
        healthScore: healthScore,
        contactPhoneStatus: contactPhone ? 'PRESENTE' : 'AUSENTE'
    };
}

// Ejecutar análisis
analyzeSchema().then(results => {
    console.log('\n✅ Análisis completado exitosamente');
}).catch(error => {
    console.error('❌ Error durante el análisis:', error);
});
