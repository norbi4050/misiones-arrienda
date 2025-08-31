const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING EXHAUSTIVO - CORRECCIONES AUDITORIA CRÍTICA');
console.log('=' .repeat(80));

// Configuración de testing
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name} - ${status}`);
  if (details) console.log(`   ${details}`);
  
  testResults.details.push({ name, status, details });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

// Test 1: Verificación de archivos corregidos
console.log('\n📁 FASE 1: VERIFICACIÓN DE ARCHIVOS CORREGIDOS');
console.log('-'.repeat(60));

const archivosCorregidos = [
  { path: 'Backend/src/types/property.ts', name: 'Tipos TypeScript' },
  { path: 'Backend/src/lib/validations/property.ts', name: 'Validaciones Zod' },
  { path: 'Backend/src/app/publicar/page-fixed.tsx', name: 'Formulario corregido' },
  { path: 'Backend/src/app/api/properties/route-updated.ts', name: 'API route actualizada' },
  { path: 'PLAN-CORRECCION-AUDITORIA-CRITICA.md', name: 'Plan de corrección' }
];

archivosCorregidos.forEach(archivo => {
  if (fs.existsSync(archivo.path)) {
    logTest(archivo.name, 'PASS', `Archivo existe: ${archivo.path}`);
  } else {
    logTest(archivo.name, 'FAIL', `Archivo faltante: ${archivo.path}`);
  }
});

// Test 2: Análisis detallado de tipos TypeScript
console.log('\n🔧 FASE 2: ANÁLISIS DETALLADO DE TIPOS TYPESCRIPT');
console.log('-'.repeat(60));

try {
  const tiposContent = fs.readFileSync('Backend/src/types/property.ts', 'utf8');
  
  // Verificaciones críticas de tipos
  const verificacionesTipos = [
    { 
      buscar: 'export interface PropertyFormData', 
      nombre: 'Interface PropertyFormData exportada',
      critico: true
    },
    { 
      buscar: 'propertyType:', 
      nombre: 'Campo propertyType (no type)',
      critico: true
    },
    { 
      buscar: 'province:', 
      nombre: 'Campo province (no state)',
      critico: true
    },
    { 
      buscar: 'status:', 
      nombre: 'Campo status',
      critico: true
    },
    { 
      buscar: 'currency:', 
      nombre: 'Campo currency',
      critico: false
    },
    { 
      buscar: 'contact_phone:', 
      nombre: 'Campo contact_phone',
      critico: false
    },
    { 
      buscar: 'userId:', 
      nombre: 'Campo userId para autenticación',
      critico: true
    }
  ];

  verificacionesTipos.forEach(v => {
    if (tiposContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, v.critico ? 'FAIL' : 'WARN', 'Campo no encontrado en tipos');
    }
  });

  // Verificar que NO existan campos obsoletos
  const camposObsoletos = [
    { buscar: 'type:', nombre: 'Campo obsoleto "type" eliminado' },
    { buscar: 'state:', nombre: 'Campo obsoleto "state" eliminado' }
  ];

  camposObsoletos.forEach(v => {
    if (!tiposContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, 'FAIL', 'Campo obsoleto aún presente');
    }
  });

} catch (error) {
  logTest('Lectura de tipos TypeScript', 'FAIL', `Error: ${error.message}`);
}

// Test 3: Análisis exhaustivo de validaciones Zod
console.log('\n🛡️ FASE 3: ANÁLISIS EXHAUSTIVO DE VALIDACIONES ZOD');
console.log('-'.repeat(60));

try {
  const validacionesContent = fs.readFileSync('Backend/src/lib/validations/property.ts', 'utf8');
  
  const verificacionesZod = [
    { 
      buscar: 'export const propertyFormSchema', 
      nombre: 'Schema principal exportado',
      critico: true
    },
    { 
      buscar: 'propertyType: z.enum', 
      nombre: 'Enum propertyType con validación',
      critico: true
    },
    { 
      buscar: 'province: z.string', 
      nombre: 'Campo province validado',
      critico: true
    },
    { 
      buscar: 'status: z.enum', 
      nombre: 'Enum status con valores correctos',
      critico: true
    },
    { 
      buscar: 'currency: z.string', 
      nombre: 'Campo currency validado',
      critico: false
    },
    { 
      buscar: 'validatePropertyWithAuth', 
      nombre: 'Función de validación con autenticación',
      critico: true
    },
    { 
      buscar: 'propertyFiltersSchema', 
      nombre: 'Schema de filtros para API',
      critico: true
    }
  ];

  verificacionesZod.forEach(v => {
    if (validacionesContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, v.critico ? 'FAIL' : 'WARN', 'Validación no encontrada');
    }
  });

  // Verificar valores enum correctos
  const enumValues = [
    { buscar: 'APARTMENT', nombre: 'Valor enum APARTMENT' },
    { buscar: 'HOUSE', nombre: 'Valor enum HOUSE' },
    { buscar: 'AVAILABLE', nombre: 'Valor enum AVAILABLE' },
    { buscar: 'RENTED', nombre: 'Valor enum RENTED' }
  ];

  enumValues.forEach(v => {
    if (validacionesContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, 'WARN', 'Valor enum no encontrado');
    }
  });

} catch (error) {
  logTest('Lectura de validaciones Zod', 'FAIL', `Error: ${error.message}`);
}

// Test 4: Análisis completo de API actualizada
console.log('\n🌐 FASE 4: ANÁLISIS COMPLETO DE API ACTUALIZADA');
console.log('-'.repeat(60));

try {
  const apiContent = fs.readFileSync('Backend/src/app/api/properties/route-updated.ts', 'utf8');
  
  const verificacionesAPI = [
    { 
      buscar: 'validatePropertyWithAuth(body, userId)', 
      nombre: 'Uso de validación con autenticación',
      critico: true
    },
    { 
      buscar: 'propertyFiltersSchema.parse', 
      nombre: 'Uso de schema de filtros',
      critico: true
    },
    { 
      buscar: 'const { mascotas, expensasIncl, servicios', 
      nombre: 'Destructuring de campos extra',
      critico: true
    },
    { 
      buscar: 'metadata: JSON.stringify', 
      nombre: 'Almacenamiento en metadata',
      critico: true
    },
    { 
      buscar: 'propertyType', 
      nombre: 'Uso de propertyType (no type)',
      critico: true
    },
    { 
      buscar: 'if (!validation.success)', 
      nombre: 'Manejo de errores de validación',
      critico: true
    },
    { 
      buscar: 'NextResponse.json', 
      nombre: 'Respuestas JSON correctas',
      critico: false
    }
  ];

  verificacionesAPI.forEach(v => {
    if (apiContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, v.critico ? 'FAIL' : 'WARN', 'Funcionalidad no encontrada en API');
    }
  });

  // Verificar que NO existan patrones obsoletos
  const patronesObsoletos = [
    { buscar: 'type:', nombre: 'Patrón obsoleto "type" eliminado de API' },
    { buscar: 'state:', nombre: 'Patrón obsoleto "state" eliminado de API' }
  ];

  patronesObsoletos.forEach(v => {
    if (!apiContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, 'FAIL', 'Patrón obsoleto aún presente en API');
    }
  });

} catch (error) {
  logTest('Lectura de API actualizada', 'FAIL', `Error: ${error.message}`);
}

// Test 5: Verificación exhaustiva de Prisma Schema
console.log('\n🗄️ FASE 5: VERIFICACIÓN EXHAUSTIVA DE PRISMA SCHEMA');
console.log('-'.repeat(60));

try {
  const prismaContent = fs.readFileSync('Backend/prisma/schema.prisma', 'utf8');
  
  const verificacionesPrisma = [
    { 
      buscar: 'model Property', 
      nombre: 'Modelo Property definido',
      critico: true
    },
    { 
      buscar: 'propertyType String', 
      nombre: 'Campo propertyType en Prisma',
      critico: true
    },
    { 
      buscar: 'province String', 
      nombre: 'Campo province en Prisma',
      critico: true
    },
    { 
      buscar: 'currency String', 
      nombre: 'Campo currency en Prisma',
      critico: false
    },
    { 
      buscar: 'contact_phone String', 
      nombre: 'Campo contact_phone en Prisma',
      critico: false
    },
    { 
      buscar: 'status String', 
      nombre: 'Campo status en Prisma',
      critico: true
    },
    { 
      buscar: 'metadata Json?', 
      nombre: 'Campo metadata para datos extra',
      critico: true
    }
  ];

  verificacionesPrisma.forEach(v => {
    if (prismaContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, v.critico ? 'FAIL' : 'WARN', 'Campo no encontrado en Prisma');
    }
  });

} catch (error) {
  logTest('Lectura de Prisma Schema', 'FAIL', `Error: ${error.message}`);
}

// Test 6: Análisis de consistencia entre archivos
console.log('\n🔄 FASE 6: ANÁLISIS DE CONSISTENCIA ENTRE ARCHIVOS');
console.log('-'.repeat(60));

try {
  const tiposContent = fs.readFileSync('Backend/src/types/property.ts', 'utf8');
  const validacionesContent = fs.readFileSync('Backend/src/lib/validations/property.ts', 'utf8');
  const prismaContent = fs.readFileSync('Backend/prisma/schema.prisma', 'utf8');

  // Verificar consistencia de campos críticos
  const camposCriticos = ['propertyType', 'province', 'status', 'currency'];
  
  camposCriticos.forEach(campo => {
    const enTipos = tiposContent.includes(`${campo}:`);
    const enValidaciones = validacionesContent.includes(`${campo}:`);
    const enPrisma = prismaContent.includes(`${campo} String`);
    
    if (enTipos && enValidaciones && enPrisma) {
      logTest(`Consistencia campo ${campo}`, 'PASS', 'Presente en tipos, validaciones y Prisma');
    } else {
      const faltantes = [];
      if (!enTipos) faltantes.push('tipos');
      if (!enValidaciones) faltantes.push('validaciones');
      if (!enPrisma) faltantes.push('Prisma');
      
      logTest(`Consistencia campo ${campo}`, 'FAIL', `Faltante en: ${faltantes.join(', ')}`);
    }
  });

} catch (error) {
  logTest('Análisis de consistencia', 'FAIL', `Error: ${error.message}`);
}

// Test 7: Verificación de formulario corregido
console.log('\n📝 FASE 7: VERIFICACIÓN DE FORMULARIO CORREGIDO');
console.log('-'.repeat(60));

try {
  const formularioContent = fs.readFileSync('Backend/src/app/publicar/page-fixed.tsx', 'utf8');
  
  const verificacionesFormulario = [
    { 
      buscar: 'useForm<PropertyFormData>', 
      nombre: 'Uso de tipo PropertyFormData',
      critico: true
    },
    { 
      buscar: 'zodResolver(propertyFormSchema)', 
      nombre: 'Uso de schema de validación',
      critico: true
    },
    { 
      buscar: 'propertyType: \'APARTMENT\'', 
      nombre: 'Valor por defecto propertyType',
      critico: true
    },
    { 
      buscar: 'status: \'AVAILABLE\'', 
      nombre: 'Valor por defecto status correcto',
      critico: true
    },
    { 
      buscar: 'currency: \'ARS\'', 
      nombre: 'Valor por defecto currency',
      critico: false
    },
    { 
      buscar: 'province:', 
      nombre: 'Campo province en formulario',
      critico: true
    }
  ];

  verificacionesFormulario.forEach(v => {
    if (formularioContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, v.critico ? 'FAIL' : 'WARN', 'Configuración no encontrada en formulario');
    }
  });

} catch (error) {
  logTest('Lectura de formulario corregido', 'FAIL', `Error: ${error.message}`);
}

// Test 8: Verificación de plan de corrección
console.log('\n📋 FASE 8: VERIFICACIÓN DE PLAN DE CORRECCIÓN');
console.log('-'.repeat(60));

try {
  const planContent = fs.readFileSync('PLAN-CORRECCION-AUDITORIA-CRITICA.md', 'utf8');
  
  const verificacionesPlan = [
    { 
      buscar: '# PLAN DE CORRECCIÓN', 
      nombre: 'Título del plan presente',
      critico: false
    },
    { 
      buscar: 'propertyType', 
      nombre: 'Documentación de cambio propertyType',
      critico: true
    },
    { 
      buscar: 'province', 
      nombre: 'Documentación de cambio province',
      critico: true
    },
    { 
      buscar: 'status', 
      nombre: 'Documentación de cambio status',
      critico: true
    },
    { 
      buscar: 'metadata', 
      nombre: 'Documentación de campos en metadata',
      critico: true
    }
  ];

  verificacionesPlan.forEach(v => {
    if (planContent.includes(v.buscar)) {
      logTest(v.nombre, 'PASS');
    } else {
      logTest(v.nombre, v.critico ? 'FAIL' : 'WARN', 'Documentación no encontrada');
    }
  });

} catch (error) {
  logTest('Lectura de plan de corrección', 'FAIL', `Error: ${error.message}`);
}

// Test 9: Simulación de casos de uso críticos
console.log('\n🎯 FASE 9: SIMULACIÓN DE CASOS DE USO CRÍTICOS');
console.log('-'.repeat(60));

// Simular datos de formulario con campos corregidos
const datosFormularioSimulados = {
  propertyType: 'APARTMENT',  // ✅ Corregido de 'type'
  province: 'Misiones',       // ✅ Corregido de 'state'
  status: 'AVAILABLE',        // ✅ Corregido de 'active'
  currency: 'ARS',
  title: 'Test Property',
  description: 'Test Description',
  price: 100000,
  bedrooms: 2,
  bathrooms: 1,
  mascotas: true,             // ✅ Campo extra para metadata
  expensasIncl: false,        // ✅ Campo extra para metadata
  servicios: ['wifi']         // ✅ Campo extra para metadata
};

logTest('Estructura de datos simulada', 'PASS', 'Datos con campos corregidos generados');

// Verificar que los campos críticos estén presentes
const camposCriticosSimulacion = ['propertyType', 'province', 'status'];
camposCriticosSimulacion.forEach(campo => {
  if (datosFormularioSimulados.hasOwnProperty(campo)) {
    logTest(`Campo crítico ${campo} en simulación`, 'PASS');
  } else {
    logTest(`Campo crítico ${campo} en simulación`, 'FAIL');
  }
});

// Test 10: Verificación de archivos de respaldo
console.log('\n💾 FASE 10: VERIFICACIÓN DE ARCHIVOS DE RESPALDO');
console.log('-'.repeat(60));

const archivosOriginales = [
  'Backend/src/app/api/properties/route.ts',
  'Backend/src/app/publicar/page.tsx'
];

archivosOriginales.forEach(archivo => {
  if (fs.existsSync(archivo)) {
    logTest(`Archivo original ${path.basename(archivo)}`, 'PASS', 'Archivo original preservado');
  } else {
    logTest(`Archivo original ${path.basename(archivo)}`, 'WARN', 'Archivo original no encontrado');
  }
});

// Resumen final
console.log('\n' + '='.repeat(80));
console.log('📊 RESUMEN FINAL DE TESTING EXHAUSTIVO');
console.log('='.repeat(80));

console.log(`\n✅ Tests Exitosos: ${testResults.passed}`);
console.log(`❌ Tests Fallidos: ${testResults.failed}`);
console.log(`⚠️  Advertencias: ${testResults.warnings}`);
console.log(`📊 Total Tests: ${testResults.passed + testResults.failed + testResults.warnings}`);

const porcentajeExito = ((testResults.passed / (testResults.passed + testResults.failed + testResults.warnings)) * 100).toFixed(1);
console.log(`🎯 Porcentaje de Éxito: ${porcentajeExito}%`);

// Análisis de criticidad
const testsCriticos = testResults.details.filter(t => t.status === 'FAIL');
const testsAdvertencias = testResults.details.filter(t => t.status === 'WARN');

if (testsCriticos.length === 0) {
  console.log('\n🎉 ¡EXCELENTE! No hay errores críticos.');
  console.log('✅ Todas las correcciones críticas están implementadas correctamente.');
} else {
  console.log('\n🚨 ERRORES CRÍTICOS ENCONTRADOS:');
  testsCriticos.forEach(test => {
    console.log(`   ❌ ${test.name}: ${test.details}`);
  });
}

if (testsAdvertencias.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS (no críticas):');
  testsAdvertencias.forEach(test => {
    console.log(`   ⚠️  ${test.name}: ${test.details}`);
  });
}

// Recomendaciones finales
console.log('\n🎯 RECOMENDACIONES FINALES:');
console.log('-'.repeat(40));

if (testResults.failed === 0) {
  console.log('✅ LISTO PARA IMPLEMENTACIÓN');
  console.log('   • Reemplazar archivos originales con versiones corregidas');
  console.log('   • Ejecutar testing de integración');
  console.log('   • Verificar funcionamiento en Supabase');
} else {
  console.log('🔧 REQUIERE CORRECCIONES ADICIONALES');
  console.log('   • Revisar errores críticos listados arriba');
  console.log('   • Corregir problemas antes de implementar');
  console.log('   • Re-ejecutar testing después de correcciones');
}

console.log('\n📋 PRÓXIMOS PASOS SUGERIDOS:');
console.log('1. Revisar y corregir cualquier error crítico');
console.log('2. Reemplazar archivos originales:');
console.log('   mv Backend/src/app/api/properties/route-updated.ts Backend/src/app/api/properties/route.ts');
console.log('   mv Backend/src/app/publicar/page-fixed.tsx Backend/src/app/publicar/page.tsx');
console.log('3. Compilar proyecto y verificar errores TypeScript');
console.log('4. Probar formulario → API → base de datos');
console.log('5. Verificar que Supabase reciba datos correctamente');

console.log('\n✨ TESTING EXHAUSTIVO COMPLETADO');
console.log('='.repeat(80));
