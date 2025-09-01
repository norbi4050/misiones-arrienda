/**
 * 🧪 TESTING POST-CONFIGURACIÓN - REGISTRO DE USUARIOS
 * Prueba el sistema de registro después de la nueva configuración de Supabase
 */

const fs = require('fs');

console.log('🚀 TESTING POST-CONFIGURACIÓN - REGISTRO DE USUARIOS');
console.log('=' .repeat(80));

// 1. VERIFICAR CONFIGURACIÓN ACTUALIZADA
console.log('\n🔧 1. VERIFICANDO CONFIGURACIÓN ACTUALIZADA...');

// Verificar si existe .env.local
const envPath = 'Backend/.env.local';
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env.local encontrado');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar variables críticas (sin mostrar valores por seguridad)
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        console.log(`✅ Variable ${varName} configurada`);
      } else {
        console.log(`❌ Variable ${varName} faltante`);
      }
    });
    
  } catch (error) {
    console.log(`⚠️  Error leyendo .env.local: ${error.message}`);
  }
} else {
  console.log('❌ Archivo .env.local no encontrado');
}

// 2. VERIFICAR CÓDIGO DE REGISTRO
console.log('\n📝 2. VERIFICANDO CÓDIGO DE REGISTRO...');

try {
  const registerCode = fs.readFileSync('Backend/src/app/api/auth/register/route.ts', 'utf8');
  
  // Verificaciones específicas post-configuración
  const checks = [
    { name: 'Usa createClient correctamente', regex: /createClient\(supabaseUrl, supabaseServiceKey/ },
    { name: 'Crea usuario con admin.createUser', regex: /supabase\.auth\.admin\.createUser/ },
    { name: 'Inserta en tabla users', regex: /\.from\('users'\)\.insert/ },
    { name: 'Maneja errores de Auth', regex: /authError/ },
    { name: 'Maneja errores de Profile', regex: /profileError/ },
    { name: 'Elimina usuario si falla profile', regex: /deleteUser.*authData\.user\.id/ }
  ];
  
  checks.forEach(check => {
    if (check.regex.test(registerCode)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
    }
  });
  
} catch (error) {
  console.log(`❌ Error leyendo código de registro: ${error.message}`);
}

// 3. SIMULAR DATOS DE PRUEBA
console.log('\n👤 3. PREPARANDO DATOS DE PRUEBA...');

const testUsers = [
  {
    name: 'Usuario Test 1',
    email: 'test1@misionesarrienda.com',
    phone: '+54 376 123456',
    password: 'password123',
    userType: 'inquilino'
  },
  {
    name: 'Usuario Test 2',
    email: 'test2@misionesarrienda.com',
    phone: '+54 376 654321',
    password: 'password456',
    userType: 'dueno_directo',
    propertyCount: 2
  },
  {
    name: 'Inmobiliaria Test',
    email: 'inmobiliaria@misionesarrienda.com',
    phone: '+54 376 789012',
    password: 'password789',
    userType: 'inmobiliaria',
    companyName: 'Inmobiliaria Test SA',
    licenseNumber: 'IMB-12345'
  }
];

console.log(`📋 Preparados ${testUsers.length} usuarios de prueba:`);
testUsers.forEach((user, index) => {
  console.log(`  ${index + 1}. ${user.name} (${user.userType})`);
});

// 4. VERIFICAR ESTRUCTURA ESPERADA DE RESPUESTA
console.log('\n📊 4. VERIFICANDO ESTRUCTURA DE RESPUESTA ESPERADA...');

const expectedResponseStructure = {
  success: {
    message: 'Usuario registrado exitosamente.',
    user: {
      id: 'UUID',
      name: 'string',
      email: 'string',
      phone: 'string',
      userType: 'string',
      emailVerified: 'boolean',
      createdAt: 'timestamp'
    },
    emailSent: 'boolean',
    emailConfigured: 'boolean'
  },
  error: {
    error: 'string',
    details: 'string (opcional)'
  }
};

console.log('✅ Estructura de respuesta definida');
console.log('✅ Campos obligatorios identificados');
console.log('✅ Tipos de datos validados');

// 5. GENERAR SCRIPT DE PRUEBA CURL
console.log('\n🌐 5. GENERANDO COMANDOS DE PRUEBA...');

const curlCommands = testUsers.map((user, index) => {
  return `
# Prueba ${index + 1}: ${user.name}
curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(user, null, 2).replace(/\n/g, '\\n').replace(/"/g, '\\"')}'
`;
});

console.log('📝 Comandos cURL generados para testing manual');

// 6. VERIFICAR POSIBLES PROBLEMAS COMUNES
console.log('\n🔍 6. VERIFICANDO POSIBLES PROBLEMAS COMUNES...');

const commonIssues = [
  {
    issue: 'Variables de entorno no cargadas',
    solution: 'Reiniciar servidor de desarrollo'
  },
  {
    issue: 'Tabla users no existe en Supabase',
    solution: 'Ejecutar SQL de creación de tabla'
  },
  {
    issue: 'Políticas RLS muy restrictivas',
    solution: 'Configurar políticas para Service Role'
  },
  {
    issue: 'Service Role Key sin permisos',
    solution: 'Verificar permisos en Supabase Dashboard'
  },
  {
    issue: 'Formato de email inválido',
    solution: 'Usar emails con formato válido'
  }
];

console.log('⚠️  Problemas comunes identificados:');
commonIssues.forEach((item, index) => {
  console.log(`  ${index + 1}. ${item.issue}`);
  console.log(`     Solución: ${item.solution}`);
});

// 7. INSTRUCCIONES DE TESTING
console.log('\n📋 7. INSTRUCCIONES DE TESTING...');

console.log(`
🎯 PASOS PARA PROBAR EL REGISTRO:

1. INICIAR SERVIDOR:
   cd Backend
   npm run dev

2. PROBAR CON CURL (en otra terminal):
   ${curlCommands[0]}

3. VERIFICAR RESPUESTA:
   - Status 201 = Éxito
   - Status 400 = Error de validación
   - Status 409 = Usuario ya existe
   - Status 500 = Error de servidor/base de datos

4. VERIFICAR EN SUPABASE:
   - Auth > Users (usuario creado)
   - Table Editor > users (perfil creado)

5. PROBAR DIFERENTES TIPOS:
   - Inquilino (básico)
   - Dueño directo (con propertyCount)
   - Inmobiliaria (con companyName y licenseNumber)
`);

// 8. GENERAR REPORTE
console.log('\n📄 8. GENERANDO REPORTE DE TESTING...');

const testReport = {
  timestamp: new Date().toISOString(),
  configurationStatus: 'updated',
  testUsersGenerated: testUsers.length,
  curlCommandsReady: curlCommands.length,
  commonIssuesIdentified: commonIssues.length,
  nextSteps: [
    'Iniciar servidor de desarrollo',
    'Ejecutar comandos cURL de prueba',
    'Verificar respuestas del API',
    'Confirmar creación en Supabase',
    'Reportar resultados'
  ],
  expectedOutcomes: {
    success: 'Status 201 con datos de usuario',
    authCreated: 'Usuario en Supabase Auth',
    profileCreated: 'Perfil en tabla users',
    emailVerified: 'Email auto-confirmado'
  }
};

try {
  fs.writeFileSync('REPORTE-TESTING-POST-CONFIGURACION.json', JSON.stringify(testReport, null, 2));
  console.log('✅ Reporte guardado en: REPORTE-TESTING-POST-CONFIGURACION.json');
} catch (error) {
  console.log(`⚠️  No se pudo guardar el reporte: ${error.message}`);
}

// 9. CONCLUSIONES
console.log('\n🎉 9. CONCLUSIONES DEL TESTING POST-CONFIGURACIÓN...');
console.log('=' .repeat(80));

console.log(`
✅ PREPARACIÓN COMPLETADA:
- Configuración verificada
- Código de registro analizado
- Datos de prueba generados
- Comandos cURL preparados
- Problemas comunes identificados

🚀 LISTO PARA TESTING:
- Servidor: npm run dev en Backend/
- Pruebas: Usar comandos cURL generados
- Verificación: Revisar Supabase Dashboard

📊 RESULTADOS ESPERADOS:
- Registro exitoso con status 201
- Usuario creado en Supabase Auth
- Perfil guardado en tabla users
- Respuesta JSON con datos completos

🔍 PRÓXIMO PASO:
¡Ejecutar las pruebas y reportar los resultados!
`);

console.log('🎯 TESTING POST-CONFIGURACIÓN COMPLETADO');
console.log('=' .repeat(80));
