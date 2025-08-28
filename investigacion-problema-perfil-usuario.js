// Investigación completa del problema de perfil de usuario - Error 401
const fs = require('fs');
const path = require('path');

console.log('🔍 INVESTIGACIÓN PROBLEMA PERFIL DE USUARIO');
console.log('===========================================\n');

console.log('📋 PROBLEMA REPORTADO:');
console.log('- Error 401 al modificar perfil: "profile 401 fetch page-ef470dff36111561.js:1"');
console.log('- No puede modificar la foto de perfil');
console.log('- Problema de autenticación JWT\n');

let findings = {
  critical: [],
  warnings: [],
  info: []
};

function logFinding(type, title, details) {
  const symbols = { critical: '❌', warnings: '⚠️', info: 'ℹ️' };
  console.log(`${symbols[type]} ${title}`);
  if (details) console.log(`   ${details}`);
  findings[type].push({ title, details });
}

// =============================================================================
// 1. ANÁLISIS DE LA API DE PERFIL
// =============================================================================
console.log('1. 🔌 ANÁLISIS API DE PERFIL (/api/users/profile)');
console.log('================================================');

try {
  const profileApiPath = path.join(__dirname, 'Backend', 'src', 'app', 'api', 'users', 'profile', 'route.ts');
  const profileApiContent = fs.readFileSync(profileApiPath, 'utf8');
  
  // Verificar autenticación JWT
  if (profileApiContent.includes('jwt.verify')) {
    logFinding('info', 'JWT verification implementado', 'La API usa jwt.verify para validar tokens');
  } else {
    logFinding('critical', 'JWT verification NO encontrado', 'La API no valida tokens JWT');
  }
  
  // Verificar header Authorization
  if (profileApiContent.includes('authorization') && profileApiContent.includes('Bearer')) {
    logFinding('info', 'Header Authorization verificado', 'La API busca header "Bearer token"');
  } else {
    logFinding('critical', 'Header Authorization NO verificado', 'La API no busca el header correcto');
  }
  
  // Verificar JWT_SECRET
  if (profileApiContent.includes('JWT_SECRET')) {
    logFinding('info', 'JWT_SECRET configurado', 'La API usa variable de entorno JWT_SECRET');
  } else {
    logFinding('critical', 'JWT_SECRET NO configurado', 'Falta configuración de JWT_SECRET');
  }
  
  // Verificar manejo de errores 401
  if (profileApiContent.includes('401')) {
    logFinding('info', 'Respuestas 401 implementadas', 'La API retorna 401 para errores de auth');
  } else {
    logFinding('warnings', 'Manejo de 401 incompleto', 'Verificar respuestas de error');
  }
  
} catch (error) {
  logFinding('critical', 'Error leyendo API de perfil', error.message);
}

console.log('');

// =============================================================================
// 2. ANÁLISIS DEL HOOK DE AUTENTICACIÓN
// =============================================================================
console.log('2. 🎣 ANÁLISIS HOOK DE AUTENTICACIÓN');
console.log('===================================');

try {
  const authHookPath = path.join(__dirname, 'Backend', 'src', 'hooks', 'useAuth.ts');
  const authHookContent = fs.readFileSync(authHookPath, 'utf8');
  
  // Verificar almacenamiento de token
  if (authHookContent.includes('localStorage') || authHookContent.includes('sessionStorage')) {
    logFinding('info', 'Almacenamiento de token implementado', 'Hook usa localStorage/sessionStorage');
  } else {
    logFinding('critical', 'Almacenamiento de token NO encontrado', 'No se encuentra donde se guarda el token');
  }
  
  // Verificar función de obtener token
  if (authHookContent.includes('getToken') || authHookContent.includes('token')) {
    logFinding('info', 'Función de token encontrada', 'Hook tiene método para obtener token');
  } else {
    logFinding('critical', 'Función de token NO encontrada', 'No hay método para obtener el token');
  }
  
  // Verificar headers de autorización
  if (authHookContent.includes('Authorization') && authHookContent.includes('Bearer')) {
    logFinding('info', 'Headers Authorization configurados', 'Hook configura headers Bearer');
  } else {
    logFinding('critical', 'Headers Authorization NO configurados', 'Hook no configura headers correctamente');
  }
  
} catch (error) {
  logFinding('warnings', 'Hook useAuth no encontrado o error', error.message);
}

console.log('');

// =============================================================================
// 3. ANÁLISIS DE PÁGINAS DE PERFIL
// =============================================================================
console.log('3. 📄 ANÁLISIS PÁGINAS DE PERFIL');
console.log('================================');

const profilePages = [
  'Backend/src/app/profile/inquilino/page.tsx',
  'Backend/src/app/profile/[id]/page.tsx'
];

profilePages.forEach(pagePath => {
  try {
    const fullPath = path.join(__dirname, pagePath);
    const pageContent = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar uso de useAuth
    if (pageContent.includes('useAuth')) {
      logFinding('info', `${pagePath} usa useAuth`, 'Página implementa hook de autenticación');
    } else {
      logFinding('warnings', `${pagePath} NO usa useAuth`, 'Página no usa hook de autenticación');
    }
    
    // Verificar llamadas a API
    if (pageContent.includes('/api/users/profile') || pageContent.includes('profile')) {
      logFinding('info', `${pagePath} llama API de perfil`, 'Página hace requests a API de perfil');
    } else {
      logFinding('warnings', `${pagePath} NO llama API`, 'Página no hace requests a API');
    }
    
    // Verificar manejo de errores
    if (pageContent.includes('catch') || pageContent.includes('error')) {
      logFinding('info', `${pagePath} maneja errores`, 'Página tiene manejo de errores');
    } else {
      logFinding('warnings', `${pagePath} NO maneja errores`, 'Página no maneja errores');
    }
    
  } catch (error) {
    logFinding('warnings', `Error leyendo ${pagePath}`, error.message);
  }
});

console.log('');

// =============================================================================
// 4. ANÁLISIS DEL COMPONENTE DE CARGA DE IMÁGENES
// =============================================================================
console.log('4. 🖼️  ANÁLISIS COMPONENTE CARGA DE IMÁGENES');
console.log('============================================');

try {
  const imageUploadPath = path.join(__dirname, 'Backend', 'src', 'components', 'ui', 'image-upload.tsx');
  const imageUploadContent = fs.readFileSync(imageUploadPath, 'utf8');
  
  // Verificar ProfileImageUpload
  if (imageUploadContent.includes('ProfileImageUpload')) {
    logFinding('info', 'ProfileImageUpload implementado', 'Componente específico para foto de perfil existe');
  } else {
    logFinding('critical', 'ProfileImageUpload NO encontrado', 'No hay componente específico para foto de perfil');
  }
  
  // Verificar validación de archivos
  if (imageUploadContent.includes('validateFile')) {
    logFinding('info', 'Validación de archivos implementada', 'Componente valida tipo y tamaño de archivos');
  } else {
    logFinding('warnings', 'Validación de archivos limitada', 'Verificar validaciones de archivos');
  }
  
  // Verificar conversión a base64
  if (imageUploadContent.includes('base64') || imageUploadContent.includes('FileReader')) {
    logFinding('info', 'Conversión a base64 implementada', 'Componente convierte imágenes a base64');
  } else {
    logFinding('warnings', 'Conversión de imágenes no clara', 'Verificar cómo se procesan las imágenes');
  }
  
} catch (error) {
  logFinding('critical', 'Error leyendo componente de imágenes', error.message);
}

console.log('');

// =============================================================================
// 5. ANÁLISIS DE VARIABLES DE ENTORNO
// =============================================================================
console.log('5. 🔧 ANÁLISIS VARIABLES DE ENTORNO');
console.log('===================================');

try {
  const envPath = path.join(__dirname, 'Backend', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar JWT_SECRET
  if (envContent.includes('JWT_SECRET')) {
    logFinding('info', 'JWT_SECRET configurado en .env', 'Variable de entorno JWT_SECRET existe');
  } else {
    logFinding('critical', 'JWT_SECRET NO configurado', 'Falta JWT_SECRET en variables de entorno');
  }
  
  // Verificar otras variables relacionadas
  if (envContent.includes('NEXTAUTH') || envContent.includes('AUTH')) {
    logFinding('info', 'Variables de autenticación encontradas', 'Hay configuración de autenticación');
  } else {
    logFinding('warnings', 'Variables de autenticación limitadas', 'Verificar configuración de auth');
  }
  
} catch (error) {
  logFinding('warnings', 'Error leyendo .env', 'No se pudo verificar variables de entorno');
}

console.log('');

// =============================================================================
// 6. ANÁLISIS DE MIDDLEWARE DE AUTENTICACIÓN
// =============================================================================
console.log('6. 🛡️  ANÁLISIS MIDDLEWARE DE AUTENTICACIÓN');
console.log('===========================================');

try {
  const middlewarePath = path.join(__dirname, 'Backend', 'src', 'lib', 'auth-middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  // Verificar funciones de validación
  if (middlewareContent.includes('validateToken') || middlewareContent.includes('verifyToken')) {
    logFinding('info', 'Funciones de validación implementadas', 'Middleware tiene validación de tokens');
  } else {
    logFinding('warnings', 'Funciones de validación no claras', 'Verificar validación en middleware');
  }
  
  // Verificar manejo de headers
  if (middlewareContent.includes('Authorization') && middlewareContent.includes('Bearer')) {
    logFinding('info', 'Manejo de headers implementado', 'Middleware procesa headers Authorization');
  } else {
    logFinding('warnings', 'Manejo de headers no claro', 'Verificar procesamiento de headers');
  }
  
} catch (error) {
  logFinding('warnings', 'Middleware de auth no encontrado', 'No se encontró middleware específico');
}

console.log('');

// =============================================================================
// 7. ANÁLISIS DE APIS DE AUTENTICACIÓN
// =============================================================================
console.log('7. 🔐 ANÁLISIS APIs DE AUTENTICACIÓN');
console.log('===================================');

const authApis = [
  'Backend/src/app/api/auth/login/route.ts',
  'Backend/src/app/api/auth/register/route.ts'
];

authApis.forEach(apiPath => {
  try {
    const fullPath = path.join(__dirname, apiPath);
    const apiContent = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar generación de JWT
    if (apiContent.includes('jwt.sign') || apiContent.includes('jsonwebtoken')) {
      logFinding('info', `${apiPath} genera JWT`, 'API genera tokens JWT correctamente');
    } else {
      logFinding('critical', `${apiPath} NO genera JWT`, 'API no genera tokens JWT');
    }
    
    // Verificar estructura del token
    if (apiContent.includes('userId') && apiContent.includes('email')) {
      logFinding('info', `${apiPath} incluye datos en token`, 'Token incluye userId y email');
    } else {
      logFinding('warnings', `${apiPath} estructura de token incompleta`, 'Verificar datos en token');
    }
    
  } catch (error) {
    logFinding('warnings', `Error leyendo ${apiPath}`, error.message);
  }
});

console.log('');

// =============================================================================
// 8. DIAGNÓSTICO DE PROBLEMAS POTENCIALES
// =============================================================================
console.log('8. 🩺 DIAGNÓSTICO DE PROBLEMAS POTENCIALES');
console.log('==========================================');

// Problema 1: Token no se envía
logFinding('critical', 'PROBLEMA POTENCIAL: Token no se envía', 
  'El frontend puede no estar enviando el token en el header Authorization');

// Problema 2: Token expirado
logFinding('warnings', 'PROBLEMA POTENCIAL: Token expirado', 
  'El token JWT puede haber expirado y necesita renovación');

// Problema 3: JWT_SECRET incorrecto
logFinding('critical', 'PROBLEMA POTENCIAL: JWT_SECRET incorrecto', 
  'El JWT_SECRET usado para firmar puede ser diferente al usado para verificar');

// Problema 4: Formato de header incorrecto
logFinding('warnings', 'PROBLEMA POTENCIAL: Formato de header incorrecto', 
  'El header Authorization puede no tener el formato "Bearer <token>"');

// Problema 5: CORS o middleware
logFinding('warnings', 'PROBLEMA POTENCIAL: CORS o middleware', 
  'Problemas de CORS o middleware pueden estar bloqueando las requests');

console.log('');

// =============================================================================
// 9. RESUMEN DE HALLAZGOS
// =============================================================================
console.log('📊 RESUMEN DE HALLAZGOS');
console.log('=======================');
console.log(`❌ Problemas Críticos: ${findings.critical.length}`);
console.log(`⚠️  Advertencias: ${findings.warnings.length}`);
console.log(`ℹ️  Información: ${findings.info.length}`);

console.log('\n🔥 PROBLEMAS CRÍTICOS IDENTIFICADOS:');
findings.critical.forEach((finding, index) => {
  console.log(`${index + 1}. ${finding.title}`);
  if (finding.details) console.log(`   ${finding.details}`);
});

console.log('\n⚠️  ADVERTENCIAS IMPORTANTES:');
findings.warnings.slice(0, 5).forEach((finding, index) => {
  console.log(`${index + 1}. ${finding.title}`);
  if (finding.details) console.log(`   ${finding.details}`);
});

console.log('\n🎯 PLAN DE ACCIÓN RECOMENDADO:');
console.log('1. Verificar y corregir JWT_SECRET en variables de entorno');
console.log('2. Asegurar que el frontend envíe el token en headers Authorization');
console.log('3. Verificar que el formato del header sea "Bearer <token>"');
console.log('4. Implementar manejo de errores 401 en el frontend');
console.log('5. Agregar logs para debugging del flujo de autenticación');
console.log('6. Corregir el componente de carga de fotos de perfil');
console.log('7. Implementar renovación automática de tokens expirados');

console.log('\n🔧 PRÓXIMOS PASOS:');
console.log('1. Crear versión corregida de la API de perfil');
console.log('2. Actualizar hook useAuth con manejo correcto de tokens');
console.log('3. Corregir páginas de perfil con autenticación adecuada');
console.log('4. Implementar componente de foto de perfil funcional');
console.log('5. Agregar testing exhaustivo del flujo de autenticación');

console.log('\n✨ Investigación completada!');
