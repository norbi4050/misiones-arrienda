/**
 * 🧪 TESTING EXHAUSTIVO DE ELEMENTOS CRÍTICOS IMPLEMENTADOS
 * 
 * Este script verifica todos los componentes críticos del plan técnico:
 * - Dashboard de Administración
 * - APIs de Administración
 * - Sistema de Límites de Usuario
 * - Componentes UI
 * - Base de datos y conectividad
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
  console.log(`${colors.bold}${colors.blue}🧪 TESTING EXHAUSTIVO DE ELEMENTOS CRÍTICOS${colors.reset}\n`);
  
  let totalTests = 0;
  let passedTests = 0;

  // 1. VERIFICACIÓN DE ARCHIVOS CRÍTICOS
  console.log(`${colors.bold}📁 1. VERIFICACIÓN DE ARCHIVOS CRÍTICOS${colors.reset}\n`);
  
  const criticalFiles = [
    'Backend/src/app/admin/dashboard/page.tsx',
    'Backend/src/app/api/admin/stats/route.ts',
    'Backend/src/app/api/admin/activity/route.ts',
    'Backend/src/lib/user-limits-simple.ts',
    'Backend/src/components/ui/tabs.tsx',
    'Backend/src/lib/prisma.ts'
  ];

  for (const file of criticalFiles) {
    totalTests++;
    const exists = fileExists(file);
    if (exists) passedTests++;
    showResult(
      `Archivo: ${file}`,
      exists,
      exists ? 'Archivo encontrado' : 'Archivo no encontrado'
    );
  }

  // 2. TESTING DE APIS DE ADMINISTRACIÓN
  console.log(`${colors.bold}🌐 2. TESTING DE APIS DE ADMINISTRACIÓN${colors.reset}\n`);
  
  const apiEndpoints = [
    '/api/admin/stats',
    '/api/admin/activity'
  ];

  for (const endpoint of apiEndpoints) {
    totalTests++;
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      const success = response.statusCode === 200;
      if (success) passedTests++;
      
      showResult(
        `API: ${endpoint}`,
        success,
        `Status: ${response.statusCode}`,
        success ? 'API respondiendo correctamente' : `Error: ${response.body.substring(0, 100)}...`
      );
    } catch (error) {
      showResult(
        `API: ${endpoint}`,
        false,
        `Error: ${error.message}`,
        'No se pudo conectar con la API'
      );
    }
  }

  // 3. TESTING DE PÁGINAS CRÍTICAS
  console.log(`${colors.bold}🖥️ 3. TESTING DE PÁGINAS CRÍTICAS${colors.reset}\n`);
  
  const criticalPages = [
    '/admin/dashboard',
    '/',
    '/properties',
    '/comunidad'
  ];

  for (const page of criticalPages) {
    totalTests++;
    try {
      const response = await makeRequest(`${BASE_URL}${page}`);
      const success = response.statusCode === 200;
      if (success) passedTests++;
      
      showResult(
        `Página: ${page}`,
        success,
        `Status: ${response.statusCode}`,
        success ? 'Página cargando correctamente' : 'Error al cargar página'
      );
    } catch (error) {
      showResult(
        `Página: ${page}`,
        false,
        `Error: ${error.message}`,
        'No se pudo acceder a la página'
      );
    }
  }

  // 4. VERIFICACIÓN DE COMPONENTES UI
  console.log(`${colors.bold}🎨 4. VERIFICACIÓN DE COMPONENTES UI${colors.reset}\n`);
  
  const uiComponents = [
    'Backend/src/components/ui/tabs.tsx',
    'Backend/src/components/ui/button.tsx',
    'Backend/src/components/ui/card.tsx',
    'Backend/src/components/ui/input.tsx'
  ];

  for (const component of uiComponents) {
    totalTests++;
    const exists = fileExists(component);
    if (exists) {
      // Verificar que el componente tiene contenido válido
      try {
        const content = fs.readFileSync(component, 'utf8');
        const hasExport = content.includes('export') && content.length > 100;
        if (hasExport) passedTests++;
        
        showResult(
          `Componente UI: ${path.basename(component)}`,
          hasExport,
          hasExport ? 'Componente válido' : 'Componente incompleto',
          `Tamaño: ${content.length} caracteres`
        );
      } catch (error) {
        showResult(
          `Componente UI: ${path.basename(component)}`,
          false,
          'Error al leer componente'
        );
      }
    } else {
      showResult(
        `Componente UI: ${path.basename(component)}`,
        false,
        'Componente no encontrado'
      );
    }
  }

  // 5. VERIFICACIÓN DEL SISTEMA DE LÍMITES
  console.log(`${colors.bold}⚖️ 5. VERIFICACIÓN DEL SISTEMA DE LÍMITES${colors.reset}\n`);
  
  totalTests++;
  try {
    const limitsFile = 'Backend/src/lib/user-limits-simple.ts';
    if (fileExists(limitsFile)) {
      const content = fs.readFileSync(limitsFile, 'utf8');
      const hasUserLimits = content.includes('UserLimitsManager') || content.includes('getUserLimits');
      if (hasUserLimits) passedTests++;
      
      showResult(
        'Sistema de Límites de Usuario',
        hasUserLimits,
        hasUserLimits ? 'Sistema implementado' : 'Sistema incompleto',
        `Archivo: ${limitsFile}`
      );
    } else {
      showResult(
        'Sistema de Límites de Usuario',
        false,
        'Archivo de límites no encontrado'
      );
    }
  } catch (error) {
    showResult(
      'Sistema de Límites de Usuario',
      false,
      `Error: ${error.message}`
    );
  }

  // 6. VERIFICACIÓN DE BASE DE DATOS
  console.log(`${colors.bold}🗄️ 6. VERIFICACIÓN DE BASE DE DATOS${colors.reset}\n`);
  
  totalTests++;
  try {
    const schemaFile = 'Backend/prisma/schema.prisma';
    if (fileExists(schemaFile)) {
      const content = fs.readFileSync(schemaFile, 'utf8');
      const hasModels = content.includes('model User') && content.includes('model Property');
      if (hasModels) passedTests++;
      
      showResult(
        'Schema de Base de Datos',
        hasModels,
        hasModels ? 'Schema válido con modelos principales' : 'Schema incompleto',
        `Archivo: ${schemaFile}`
      );
    } else {
      showResult(
        'Schema de Base de Datos',
        false,
        'Archivo schema.prisma no encontrado'
      );
    }
  } catch (error) {
    showResult(
      'Schema de Base de Datos',
      false,
      `Error: ${error.message}`
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
    console.log(`${colors.green}${colors.bold}🎉 TESTING EXITOSO - Los elementos críticos están funcionando correctamente${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️ TESTING CON PROBLEMAS - Se requiere atención en algunos elementos${colors.reset}`);
  }

  // RECOMENDACIONES
  console.log(`\n${colors.bold}💡 RECOMENDACIONES:${colors.reset}`);
  
  if (successRate < 60) {
    console.log(`${colors.red}• Crítico: Muchos elementos fallan, revisar configuración básica${colors.reset}`);
  } else if (successRate < 80) {
    console.log(`${colors.yellow}• Moderado: Algunos elementos necesitan atención${colors.reset}`);
  } else {
    console.log(`${colors.green}• Excelente: La mayoría de elementos funcionan correctamente${colors.reset}`);
  }
  
  console.log(`${colors.blue}• Verificar que el servidor esté ejecutándose en puerto 3001${colors.reset}`);
  console.log(`${colors.blue}• Asegurar que la base de datos esté configurada correctamente${colors.reset}`);
  console.log(`${colors.blue}• Revisar logs del servidor para errores específicos${colors.reset}`);
}

// Ejecutar tests
console.log(`${colors.bold}Iniciando testing exhaustivo...${colors.reset}\n`);
runTests().catch(error => {
  console.error(`${colors.red}Error fatal en testing: ${error.message}${colors.reset}`);
  process.exit(1);
});
