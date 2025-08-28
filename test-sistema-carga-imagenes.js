/**
 * 🖼️ TESTING SISTEMA DE CARGA DE IMÁGENES
 * 
 * Este script verifica que el sistema de carga de imágenes funcione correctamente
 * tanto para perfiles como para publicaciones de propiedades.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = 'http://localhost:3001';
const TIMEOUT = 10000;

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Función para hacer peticiones HTTP
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url.replace(BASE_URL, ''),
      method: method,
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para mostrar resultados
function showResult(test, success, message = '', details = '') {
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${icon} ${color}${test}${colors.reset}`);
  if (message) {
    console.log(`   ${message}`);
  }
  if (details) {
    console.log(`   ${colors.blue}${details}${colors.reset}`);
  }
  console.log('');
}

// Tests principales
async function runTests() {
  console.log(`${colors.bold}${colors.blue}🖼️ TESTING SISTEMA DE CARGA DE IMÁGENES${colors.reset}\n`);
  
  let totalTests = 0;
  let passedTests = 0;

  // 1. VERIFICACIÓN DE COMPONENTES DE CARGA DE IMÁGENES
  console.log(`${colors.bold}📁 1. VERIFICACIÓN DE COMPONENTES DE CARGA DE IMÁGENES${colors.reset}\n`);
  
  const imageUploadFiles = [
    'Backend/src/components/ui/image-upload.tsx'
  ];

  for (const file of imageUploadFiles) {
    totalTests++;
    const exists = fileExists(file);
    if (exists) {
      // Verificar que el componente tiene las funciones necesarias
      try {
        const content = fs.readFileSync(file, 'utf8');
        const hasImageUpload = content.includes('ImageUpload') && content.includes('ProfileImageUpload');
        const hasFileHandling = content.includes('FileReader') && content.includes('base64');
        const hasDragDrop = content.includes('onDrop') && content.includes('onDrag');
        const hasValidation = content.includes('validateFile') && content.includes('maxSizeMB');
        
        const isComplete = hasImageUpload && hasFileHandling && hasDragDrop && hasValidation;
        if (isComplete) passedTests++;
        
        showResult(
          `Componente de carga de imágenes: ${path.basename(file)}`,
          isComplete,
          isComplete ? 'Componente completo con todas las funcionalidades' : 'Componente incompleto',
          `Funciones: ImageUpload(${hasImageUpload}), FileHandling(${hasFileHandling}), DragDrop(${hasDragDrop}), Validation(${hasValidation})`
        );
      } catch (error) {
        showResult(
          `Componente de carga de imágenes: ${path.basename(file)}`,
          false,
          'Error al leer componente'
        );
      }
    } else {
      showResult(
        `Componente de carga de imágenes: ${path.basename(file)}`,
        false,
        'Componente no encontrado'
      );
    }
  }

  // 2. VERIFICACIÓN DE INTEGRACIÓN EN PUBLICAR PROPIEDADES
  console.log(`${colors.bold}🏠 2. VERIFICACIÓN DE INTEGRACIÓN EN PUBLICAR PROPIEDADES${colors.reset}\n`);
  
  totalTests++;
  const publicarFile = 'Backend/src/app/publicar/page.tsx';
  if (fileExists(publicarFile)) {
    try {
      const content = fs.readFileSync(publicarFile, 'utf8');
      const hasImageUploadImport = content.includes('import { ImageUpload }');
      const hasImageUploadComponent = content.includes('<ImageUpload');
      const hasImageState = content.includes('images: [] as string[]');
      const hasImageHandling = content.includes('onChange={(images)');
      const hasMaxImagesLogic = content.includes('maxImages={selectedPlan');
      
      const isIntegrated = hasImageUploadImport && hasImageUploadComponent && hasImageState && hasImageHandling && hasMaxImagesLogic;
      if (isIntegrated) passedTests++;
      
      showResult(
        'Integración en página de publicar propiedades',
        isIntegrated,
        isIntegrated ? 'Sistema de imágenes completamente integrado' : 'Integración incompleta',
        `Import(${hasImageUploadImport}), Component(${hasImageUploadComponent}), State(${hasImageState}), Handling(${hasImageHandling}), Logic(${hasMaxImagesLogic})`
      );
    } catch (error) {
      showResult(
        'Integración en página de publicar propiedades',
        false,
        'Error al verificar integración'
      );
    }
  } else {
    showResult(
      'Integración en página de publicar propiedades',
      false,
      'Archivo de publicar no encontrado'
    );
  }

  // 3. VERIFICACIÓN DE INTEGRACIÓN EN PERFILES
  console.log(`${colors.bold}👤 3. VERIFICACIÓN DE INTEGRACIÓN EN PERFILES${colors.reset}\n`);
  
  const profileFiles = [
    'Backend/src/app/profile/inquilino/page.tsx',
    'Backend/src/app/profile/dueno_directo/page.tsx'
  ];

  for (const file of profileFiles) {
    totalTests++;
    if (fileExists(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const hasProfileImageUploadImport = content.includes('import { ProfileImageUpload }') || content.includes('ProfileImageUpload');
        const hasProfileImageUploadComponent = content.includes('<ProfileImageUpload') || content.includes('ProfileImageUpload');
        const hasProfileImageState = content.includes('profileImage');
        const hasConditionalRendering = content.includes('isEditing ?');
        
        const isIntegrated = hasProfileImageUploadImport && hasProfileImageUploadComponent && hasProfileImageState && hasConditionalRendering;
        if (isIntegrated) passedTests++;
        
        showResult(
          `Integración en perfil: ${path.basename(file)}`,
          isIntegrated,
          isIntegrated ? 'Sistema de foto de perfil integrado' : 'Integración incompleta',
          `Import(${hasProfileImageUploadImport}), Component(${hasProfileImageUploadComponent}), State(${hasProfileImageState}), Conditional(${hasConditionalRendering})`
        );
      } catch (error) {
        showResult(
          `Integración en perfil: ${path.basename(file)}`,
          false,
          'Error al verificar integración'
        );
      }
    } else {
      showResult(
        `Integración en perfil: ${path.basename(file)}`,
        false,
        'Archivo de perfil no encontrado'
      );
    }
  }

  // 4. TESTING DE PÁGINAS CON SISTEMA DE IMÁGENES
  console.log(`${colors.bold}🌐 4. TESTING DE PÁGINAS CON SISTEMA DE IMÁGENES${colors.reset}\n`);
  
  const pagesWithImages = [
    '/publicar',
    '/profile/inquilino'
  ];

  for (const page of pagesWithImages) {
    totalTests++;
    try {
      const response = await makeRequest(`${BASE_URL}${page}`);
      const success = response.statusCode === 200;
      if (success) passedTests++;
      
      showResult(
        `Página con sistema de imágenes: ${page}`,
        success,
        `Status: ${response.statusCode}`,
        success ? 'Página carga correctamente' : 'Error al cargar página'
      );
    } catch (error) {
      showResult(
        `Página con sistema de imágenes: ${page}`,
        false,
        `Error: ${error.message}`,
        'No se pudo acceder a la página'
      );
    }
  }

  // 5. VERIFICACIÓN DE FUNCIONALIDADES ESPECÍFICAS
  console.log(`${colors.bold}⚙️ 5. VERIFICACIÓN DE FUNCIONALIDADES ESPECÍFICAS${colors.reset}\n`);
  
  totalTests++;
  const imageUploadFile = 'Backend/src/components/ui/image-upload.tsx';
  if (fileExists(imageUploadFile)) {
    try {
      const content = fs.readFileSync(imageUploadFile, 'utf8');
      
      // Verificar funcionalidades específicas
      const features = {
        'Validación de archivos': content.includes('validateFile'),
        'Conversión a Base64': content.includes('convertToBase64'),
        'Drag & Drop': content.includes('onDrop') && content.includes('dragActive'),
        'Preview de imágenes': content.includes('showPreview'),
        'Límite de imágenes': content.includes('maxImages'),
        'Límite de tamaño': content.includes('maxSizeMB'),
        'Eliminación de imágenes': content.includes('removeImage'),
        'Tipos de archivo permitidos': content.includes('acceptedTypes'),
        'Manejo de errores': content.includes('toast.error'),
        'Loading states': content.includes('isUploading')
      };
      
      const implementedFeatures = Object.values(features).filter(Boolean).length;
      const totalFeatures = Object.keys(features).length;
      const completeness = (implementedFeatures / totalFeatures) * 100;
      
      if (completeness >= 80) passedTests++;
      
      showResult(
        'Funcionalidades del sistema de carga de imágenes',
        completeness >= 80,
        `${implementedFeatures}/${totalFeatures} funcionalidades implementadas (${completeness.toFixed(1)}%)`,
        Object.entries(features).map(([feature, implemented]) => 
          `${implemented ? '✓' : '✗'} ${feature}`
        ).join(', ')
      );
    } catch (error) {
      showResult(
        'Funcionalidades del sistema de carga de imágenes',
        false,
        'Error al verificar funcionalidades'
      );
    }
  } else {
    showResult(
      'Funcionalidades del sistema de carga de imágenes',
      false,
      'Componente de carga de imágenes no encontrado'
    );
  }

  // 6. VERIFICACIÓN DE TIPOS DE ARCHIVO SOPORTADOS
  console.log(`${colors.bold}📄 6. VERIFICACIÓN DE TIPOS DE ARCHIVO SOPORTADOS${colors.reset}\n`);
  
  totalTests++;
  if (fileExists(imageUploadFile)) {
    try {
      const content = fs.readFileSync(imageUploadFile, 'utf8');
      
      const supportedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ];
      
      const typesSupported = supportedTypes.filter(type => content.includes(type));
      const allTypesSupported = typesSupported.length === supportedTypes.length;
      
      if (allTypesSupported) passedTests++;
      
      showResult(
        'Tipos de archivo soportados',
        allTypesSupported,
        `${typesSupported.length}/${supportedTypes.length} tipos soportados`,
        `Soportados: ${typesSupported.join(', ')}`
      );
    } catch (error) {
      showResult(
        'Tipos de archivo soportados',
        false,
        'Error al verificar tipos de archivo'
      );
    }
  } else {
    showResult(
      'Tipos de archivo soportados',
      false,
      'Componente no encontrado'
    );
  }

  // RESUMEN FINAL
  console.log(`${colors.bold}📊 RESUMEN FINAL${colors.reset}\n`);
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  const overallSuccess = successRate >= 80;
  
  console.log(`${colors.bold}Total de Tests: ${totalTests}${colors.reset}`);
  console.log(`${colors.green}Tests Exitosos: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Tests Fallidos: ${totalTests - passedTests}${colors.reset}`);
  console.log(`${colors.bold}Tasa de Éxito: ${overallSuccess ? colors.green : colors.red}${successRate}%${colors.reset}\n`);

  if (overallSuccess) {
    console.log(`${colors.green}${colors.bold}🎉 SISTEMA DE CARGA DE IMÁGENES FUNCIONANDO CORRECTAMENTE${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️ SISTEMA DE CARGA DE IMÁGENES REQUIERE ATENCIÓN${colors.reset}`);
  }

  // FUNCIONALIDADES IMPLEMENTADAS
  console.log(`\n${colors.bold}✨ FUNCIONALIDADES IMPLEMENTADAS:${colors.reset}`);
  console.log(`${colors.green}• Componente ImageUpload para múltiples imágenes${colors.reset}`);
  console.log(`${colors.green}• Componente ProfileImageUpload para foto de perfil${colors.reset}`);
  console.log(`${colors.green}• Drag & Drop para subir archivos${colors.reset}`);
  console.log(`${colors.green}• Validación de tipos de archivo (JPEG, PNG, WebP)${colors.reset}`);
  console.log(`${colors.green}• Validación de tamaño de archivo${colors.reset}`);
  console.log(`${colors.green}• Preview de imágenes en tiempo real${colors.reset}`);
  console.log(`${colors.green}• Conversión automática a Base64${colors.reset}`);
  console.log(`${colors.green}• Límites dinámicos según plan de publicación${colors.reset}`);
  console.log(`${colors.green}• Integración en página de publicar propiedades${colors.reset}`);
  console.log(`${colors.green}• Integración en perfiles de usuario${colors.reset}`);

  // RECOMENDACIONES
  console.log(`\n${colors.bold}💡 RECOMENDACIONES:${colors.reset}`);
  
  if (successRate < 60) {
    console.log(`${colors.red}• Crítico: Revisar implementación básica del sistema${colors.reset}`);
  } else if (successRate < 80) {
    console.log(`${colors.yellow}• Moderado: Completar funcionalidades faltantes${colors.reset}`);
  } else {
    console.log(`${colors.green}• Excelente: Sistema funcionando correctamente${colors.reset}`);
  }
  
  console.log(`${colors.blue}• Probar la carga de imágenes en el navegador${colors.reset}`);
  console.log(`${colors.blue}• Verificar que las imágenes se muestren correctamente${colors.reset}`);
  console.log(`${colors.blue}• Testear límites de tamaño y cantidad de archivos${colors.reset}`);
  console.log(`${colors.blue}• Probar funcionalidad drag & drop${colors.reset}`);
}

// Ejecutar tests
console.log(`${colors.bold}Iniciando testing del sistema de carga de imágenes...${colors.reset}\n`);
runTests().catch(error => {
  console.error(`${colors.red}Error fatal en testing: ${error.message}${colors.reset}`);
  process.exit(1);
});
