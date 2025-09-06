#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO DEL SISTEMA
 * Análisis exhaustivo sin depender del servidor local
 */

const fs = require('fs');
const path = require('path');

// Configuración
const BACKEND_DIR = path.join(process.cwd(), 'Backend');
const SRC_DIR = path.join(BACKEND_DIR, 'src');

// Resultados del diagnóstico
let diagnostics = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFiles: 0,
    endpointsFound: 0,
    potentialIssues: 0,
    recommendations: []
  },
  endpoints: [],
  issues: [],
  recommendations: []
};

// Función para encontrar todos los archivos de rutas
function findRouteFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Función para analizar un endpoint
function analyzeEndpoint(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(BACKEND_DIR, filePath);
    const endpointPath = relativePath.replace('src/app', '').replace('/route.ts', '').replace('/route.js', '');

    let endpointInfo = {
      path: endpointPath,
      file: relativePath,
      methods: [],
      issues: [],
      recommendations: []
    };

    // Detectar métodos HTTP
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    httpMethods.forEach(method => {
      if (content.includes(`export async function ${method}`)) {
        endpointInfo.methods.push(method);
      }
    });

    // Análisis de problemas potenciales

    // 1. Falta de validación de entrada
    if (content.includes('request.json()') && !content.includes('safeParse') && !content.includes('validate')) {
      endpointInfo.issues.push('Falta validación de entrada en request.json()');
      endpointInfo.recommendations.push('Implementar validación con Zod o similar');
    }

    // 2. Uso de console.log en producción
    const consoleMatches = content.match(/console\.log/g);
    if (consoleMatches && consoleMatches.length > 3) {
      endpointInfo.issues.push(`Múltiples console.log (${consoleMatches.length}) - remover en producción`);
      endpointInfo.recommendations.push('Usar un logger como Winston o Pino');
    }

    // 3. Falta de manejo de errores
    if (!content.includes('try') || !content.includes('catch')) {
      endpointInfo.issues.push('Posible falta de manejo de errores try/catch');
      endpointInfo.recommendations.push('Implementar bloques try/catch apropiados');
    }

    // 4. Consultas SQL inseguras
    if (content.includes('.from(') && content.includes('${')) {
      endpointInfo.issues.push('Posible inyección SQL - uso de template literals en consultas');
      endpointInfo.recommendations.push('Usar parámetros preparados o ORM');
    }

    // 5. Variables de entorno no validadas
    const envMatches = content.match(/process\.env\.\w+/g);
    if (envMatches) {
      envMatches.forEach(match => {
        if (!content.includes(`${match} ||`) && !content.includes(`${match} ?`)) {
          endpointInfo.issues.push(`Variable de entorno no validada: ${match}`);
          endpointInfo.recommendations.push('Validar variables de entorno antes de usar');
        }
      });
    }

    // 6. Uso de any type
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 1) {
      endpointInfo.issues.push(`Múltiples usos de 'any' type (${anyMatches.length})`);
      endpointInfo.recommendations.push('Definir tipos específicos en lugar de any');
    }

    // 7. Respuestas sin código de status explícito
    if (content.includes('NextResponse.json') && !content.includes('status:')) {
      endpointInfo.issues.push('NextResponse.json sin código de status explícito');
      endpointInfo.recommendations.push('Especificar códigos de status apropiados');
    }

    // 8. Autenticación faltante en endpoints sensibles
    const sensitivePaths = ['profile', 'users', 'admin'];
    if (sensitivePaths.some(path => endpointPath.includes(path))) {
      if (!content.includes('getUser') && !content.includes('auth')) {
        endpointInfo.issues.push('Endpoint sensible sin verificación de autenticación');
        endpointInfo.recommendations.push('Implementar middleware de autenticación');
      }
    }

    return endpointInfo;

  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message);
    return null;
  }
}

// Función para verificar configuración del proyecto
function checkProjectConfiguration() {
  console.log('\n🔧 VERIFICANDO CONFIGURACIÓN DEL PROYECTO');

  const configIssues = [];
  const configRecommendations = [];

  // Verificar package.json
  const packagePath = path.join(BACKEND_DIR, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Verificar dependencias críticas
      const criticalDeps = ['next', 'react', '@supabase/supabase-js'];
      criticalDeps.forEach(dep => {
        if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
          configIssues.push(`Dependencia faltante: ${dep}`);
          configRecommendations.push(`Instalar ${dep} con npm install ${dep}`);
        }
      });

      // Verificar scripts
      if (!packageJson.scripts?.dev) {
        configIssues.push('Script "dev" faltante en package.json');
        configRecommendations.push('Agregar script dev para desarrollo');
      }

      if (!packageJson.scripts?.build) {
        configIssues.push('Script "build" faltante en package.json');
        configRecommendations.push('Agregar script build para producción');
      }

    } catch (error) {
      configIssues.push('Error parseando package.json');
      configRecommendations.push('Verificar sintaxis de package.json');
    }
  } else {
    configIssues.push('package.json no encontrado');
    configRecommendations.push('Crear package.json con configuración de Next.js');
  }

  // Verificar next.config.js
  const nextConfigPath = path.join(BACKEND_DIR, 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    configIssues.push('next.config.js no encontrado');
    configRecommendations.push('Crear next.config.js con configuración básica');
  }

  // Verificar .env.example
  const envExamplePath = path.join(BACKEND_DIR, '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    configIssues.push('.env.example no encontrado');
    configRecommendations.push('Crear .env.example con variables de entorno necesarias');
  }

  return { issues: configIssues, recommendations: configRecommendations };
}

// Función para generar recomendaciones generales
function generateGeneralRecommendations() {
  const recommendations = [];

  recommendations.push('Implementar logging estructurado con Winston o Pino');
  recommendations.push('Configurar middleware de autenticación global');
  recommendations.push('Implementar validación de entrada con Zod');
  recommendations.push('Configurar variables de entorno con validación');
  recommendations.push('Implementar tests unitarios e integración');
  recommendations.push('Configurar CI/CD con GitHub Actions');
  recommendations.push('Implementar rate limiting para endpoints públicos');
  recommendations.push('Configurar monitoring y alertas');

  return recommendations;
}

// Función principal
async function main() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA');
  console.log('=' .repeat(50));

  // Verificar que existe el directorio Backend
  if (!fs.existsSync(BACKEND_DIR)) {
    console.error(`❌ Directorio Backend no encontrado: ${BACKEND_DIR}`);
    process.exit(1);
  }

  console.log(`📁 Analizando proyecto en: ${BACKEND_DIR}`);

  // Encontrar archivos de rutas
  const routeFiles = findRouteFiles(SRC_DIR);
  console.log(`\n📋 Encontrados ${routeFiles.length} archivos de rutas`);

  // Analizar cada endpoint
  routeFiles.forEach(filePath => {
    const endpointInfo = analyzeEndpoint(filePath);
    if (endpointInfo) {
      diagnostics.endpoints.push(endpointInfo);
      diagnostics.summary.endpointsFound++;

      if (endpointInfo.issues.length > 0) {
        diagnostics.summary.potentialIssues += endpointInfo.issues.length;
        diagnostics.issues.push(...endpointInfo.issues.map(issue => ({
          endpoint: endpointInfo.path,
          issue
        })));
      }

      if (endpointInfo.recommendations.length > 0) {
        diagnostics.recommendations.push(...endpointInfo.recommendations.map(rec => ({
          endpoint: endpointInfo.path,
          recommendation: rec
        })));
      }
    }
  });

  // Verificar configuración del proyecto
  const configCheck = checkProjectConfiguration();
  diagnostics.issues.push(...configCheck.issues.map(issue => ({
    endpoint: 'Configuración',
    issue
  })));
  diagnostics.recommendations.push(...configCheck.recommendations.map(rec => ({
    endpoint: 'Configuración',
    recommendation: rec
  })));

  // Agregar recomendaciones generales
  const generalRecs = generateGeneralRecommendations();
  diagnostics.recommendations.push(...generalRecs.map(rec => ({
    endpoint: 'General',
    recommendation: rec
  })));

  // Actualizar estadísticas
  diagnostics.summary.totalFiles = routeFiles.length;

  // Mostrar resultados
  console.log('\n📊 RESULTADOS DEL DIAGNÓSTICO');
  console.log('=' .repeat(50));

  console.log(`\n📈 Estadísticas:`);
  console.log(`   Archivos analizados: ${diagnostics.summary.totalFiles}`);
  console.log(`   Endpoints encontrados: ${diagnostics.summary.endpointsFound}`);
  console.log(`   Problemas potenciales: ${diagnostics.summary.potentialIssues}`);

  // Mostrar endpoints encontrados
  console.log(`\n🔗 Endpoints Analizados:`);
  diagnostics.endpoints.forEach(endpoint => {
    console.log(`   ${endpoint.methods.join(',')} ${endpoint.path}`);
    if (endpoint.issues.length > 0) {
      console.log(`     ❌ ${endpoint.issues.length} problema(s)`);
    }
  });

  // Mostrar problemas críticos
  if (diagnostics.issues.length > 0) {
    console.log(`\n❌ Problemas Encontrados:`);
    diagnostics.issues.slice(0, 10).forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.endpoint}] ${issue.issue}`);
    });

    if (diagnostics.issues.length > 10) {
      console.log(`   ... y ${diagnostics.issues.length - 10} problemas más`);
    }
  }

  // Mostrar recomendaciones
  if (diagnostics.recommendations.length > 0) {
    console.log(`\n💡 Recomendaciones:`);
    const uniqueRecs = [...new Set(diagnostics.recommendations.map(r => r.recommendation))];
    uniqueRecs.slice(0, 10).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    if (uniqueRecs.length > 10) {
      console.log(`   ... y ${uniqueRecs.length - 10} recomendaciones más`);
    }
  }

  // Guardar reporte detallado
  const reportPath = path.join(process.cwd(), 'REPORTE-DIAGNOSTICO-COMPLETO-SISTEMA.json');
  fs.writeFileSync(reportPath, JSON.stringify(diagnostics, null, 2));

  console.log(`\n💾 Reporte guardado en: ${reportPath}`);

  // Evaluación final
  const healthScore = diagnostics.summary.potentialIssues === 0 ? 100 :
    Math.max(0, 100 - (diagnostics.summary.potentialIssues * 5));

  console.log(`\n🏥 Puntaje de Salud del Sistema: ${healthScore}/100`);

  if (healthScore >= 80) {
    console.log('🎉 ¡Excelente! El sistema está en buen estado');
  } else if (healthScore >= 60) {
    console.log('⚠️  Bueno, pero se recomiendan mejoras');
  } else {
    console.log('🚨 Crítico: Se requieren correcciones urgentes');
  }

  console.log('\n' + '=' .repeat(50));
}

// Ejecutar diagnóstico
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error durante el diagnóstico:', error);
    process.exit(1);
  });
}

module.exports = { main };
