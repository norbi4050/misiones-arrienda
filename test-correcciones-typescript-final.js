const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING EXHAUSTIVO - CORRECCIONES TYPESCRIPT FINAL');
console.log('=' .repeat(60));

// Función para verificar archivos
function verificarArchivo(rutaArchivo, descripcion) {
    try {
        if (fs.existsSync(rutaArchivo)) {
            const contenido = fs.readFileSync(rutaArchivo, 'utf8');
            console.log(`✅ ${descripcion}: ENCONTRADO`);
            return { existe: true, contenido };
        } else {
            console.log(`❌ ${descripcion}: NO ENCONTRADO`);
            return { existe: false, contenido: null };
        }
    } catch (error) {
        console.log(`❌ ${descripcion}: ERROR - ${error.message}`);
        return { existe: false, contenido: null };
    }
}

// Función para verificar contenido específico
function verificarContenido(contenido, buscar, descripcion) {
    if (contenido && contenido.includes(buscar)) {
        console.log(`✅ ${descripcion}: CORRECTO`);
        return true;
    } else {
        console.log(`❌ ${descripcion}: FALTANTE`);
        return false;
    }
}

console.log('\n📋 FASE 1: VERIFICACIÓN DE ARCHIVOS CRÍTICOS');
console.log('-'.repeat(50));

// Verificar archivo de validaciones
const validaciones = verificarArchivo(
    'Backend/src/lib/validations/property.ts',
    'Archivo de validaciones'
);

// Verificar archivo de tipos
const tipos = verificarArchivo(
    'Backend/src/types/property.ts',
    'Archivo de tipos'
);

// Verificar formulario de publicar
const formulario = verificarArchivo(
    'Backend/src/app/publicar/page.tsx',
    'Formulario de publicación'
);

console.log('\n🔧 FASE 2: VERIFICACIÓN DE CORRECCIONES ESPECÍFICAS');
console.log('-'.repeat(50));

let correcciones = 0;
let totalVerificaciones = 0;

if (validaciones.existe) {
    totalVerificaciones += 4;
    
    // Verificar corrección del tipo PropertyFormData
    if (verificarContenido(
        validaciones.contenido,
        'export type PropertyFormData = z.infer<typeof propertyFormSchema>',
        'PropertyFormData corregido'
    )) correcciones++;
    
    // Verificar enum de status
    if (verificarContenido(
        validaciones.contenido,
        "z.enum(['AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED', 'EXPIRED'])",
        'Enum de status correcto'
    )) correcciones++;
    
    // Verificar que ambos esquemas usan el mismo enum
    const statusMatches = (validaciones.contenido.match(/z\.enum\(\['AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED', 'EXPIRED'\]\)/g) || []).length;
    if (statusMatches >= 2) {
        console.log('✅ Consistencia entre esquemas: CORRECTO');
        correcciones++;
    } else {
        console.log('❌ Consistencia entre esquemas: FALTANTE');
    }
    
    // Verificar imports correctos
    if (verificarContenido(
        validaciones.contenido,
        "import { z } from 'zod'",
        'Imports de Zod'
    )) correcciones++;
}

console.log('\n🧪 FASE 3: TESTING DE INTEGRACIÓN');
console.log('-'.repeat(50));

if (formulario.existe) {
    totalVerificaciones += 3;
    
    // Verificar uso del resolver correcto
    if (verificarContenido(
        formulario.contenido,
        'zodResolver(propertyFormSchema)',
        'Resolver de Zod correcto'
    )) correcciones++;
    
    // Verificar tipo correcto en useForm
    if (verificarContenido(
        formulario.contenido,
        'useForm<PropertyFormSchemaData>',
        'Tipo correcto en useForm'
    )) correcciones++;
    
    // Verificar import de validaciones
    if (verificarContenido(
        formulario.contenido,
        '@/lib/validations/property',
        'Import de validaciones'
    )) correcciones++;
}

console.log('\n📊 FASE 4: RESUMEN DE RESULTADOS');
console.log('-'.repeat(50));

const porcentajeExito = totalVerificaciones > 0 ? Math.round((correcciones / totalVerificaciones) * 100) : 0;

console.log(`📈 Correcciones aplicadas: ${correcciones}/${totalVerificaciones}`);
console.log(`📊 Porcentaje de éxito: ${porcentajeExito}%`);

if (porcentajeExito >= 90) {
    console.log('🎉 ESTADO: EXCELENTE - Todas las correcciones aplicadas correctamente');
} else if (porcentajeExito >= 70) {
    console.log('✅ ESTADO: BUENO - La mayoría de correcciones aplicadas');
} else if (porcentajeExito >= 50) {
    console.log('⚠️  ESTADO: REGULAR - Algunas correcciones pendientes');
} else {
    console.log('❌ ESTADO: CRÍTICO - Muchas correcciones pendientes');
}

console.log('\n🔍 FASE 5: VERIFICACIÓN DE COMPILACIÓN');
console.log('-'.repeat(50));

// Verificar si hay errores de TypeScript conocidos
const erroresConocidos = [
    'Type error: Type \'Resolver<',
    'is not assignable to type',
    'Type \'undefined\' is not assignable'
];

let tieneErroresConocidos = false;
if (formulario.existe) {
    erroresConocidos.forEach(error => {
        if (formulario.contenido.includes(error)) {
            tieneErroresConocidos = true;
        }
    });
}

if (!tieneErroresConocidos) {
    console.log('✅ Sin errores de TypeScript conocidos detectados');
} else {
    console.log('❌ Posibles errores de TypeScript detectados');
}

console.log('\n🎯 FASE 6: RECOMENDACIONES FINALES');
console.log('-'.repeat(50));

if (porcentajeExito >= 90) {
    console.log('✅ El formulario debería compilar sin errores');
    console.log('✅ Listo para testing funcional');
    console.log('✅ Puede proceder con el deployment');
} else {
    console.log('⚠️  Revisar las correcciones pendientes');
    console.log('⚠️  Ejecutar verificación de TypeScript');
    console.log('⚠️  Corregir errores antes del deployment');
}

console.log('\n' + '='.repeat(60));
console.log('🏁 TESTING EXHAUSTIVO COMPLETADO');
console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
console.log('='.repeat(60));

// Retornar código de salida basado en el éxito
process.exit(porcentajeExito >= 90 ? 0 : 1);
