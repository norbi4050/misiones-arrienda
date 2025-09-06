#!/usr/bin/env node

/**
 * ANÁLISIS ESTÁTICO DE ENDPOINTS
 * Script para analizar el código de los endpoints y detectar posibles problemas
 */

const fs = require('fs');
const path = require('path');

// Configuración de colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

let totalFiles = 0;
let issuesFound = 0;
let warningsFound = 0;

// Función para leer archivos recursivamente
function readFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      readFilesRecursively(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Función para analizar un archivo
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    let fileIssues = [];
    let fileWarnings = [];

    console.log(`\n${colors.blue}📄 Analizando: ${relativePath}${colors.reset}`);

    // 1. Verificar manejo de errores básico
    if (!content.includes('try') || !content.includes('catch')) {
      fileWarnings.push('Posible falta de manejo de errores (try/catch)');
    }

    // 2. Verificar uso de console.log en producción
    const consoleLogMatches = content.match(/console\.log/g);
    if (consoleLogMatches && consoleLogMatches.length > 5) {
      fileWarnings.push(`Múltiples console.log encontrados (${consoleLogMatches.length}) - considerar remover en producción`);
    }

    // 3. Verificar validación de entrada
    if (content.includes('request.json()') && !content.includes('safeParse') && !content.includes('validate')) {
      fileWarnings.push('Posible falta de validación de entrada en request.json()');
    }

    // 4. Verificar consultas SQL potencialmente peligrosas
    if (content.includes('.from(') && content.includes('${')) {
      fileIssues.push('Posible inyección SQL - uso de template literals en consultas');
    }

    // 5. Verificar NextResponse sin status code apropiado
    if (content.includes('NextResponse.json') && !content.includes('status:')) {
      fileWarnings.push('NextResponse.json sin código de status explícito');
    }

    // 6. Verificar uso de process.env sin validación
    const envMatches = content.match(/process\.env\.\w+/g);
    if (envMatches) {
      envMatches.forEach(match => {
        if (!content.includes(`${match} ||`) && !content.includes(`${match} ?`)) {
          fileWarnings.push(`Variable de entorno no validada: ${match}`);
        }
      });
    }

    // 7. Verificar imports no utilizados
    const importMatches = content.match(/import.*from ['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(importMatch => {
        const importedModule = importMatch.match(/from ['"]([^'"]+)['"]/)[1];
        const importName = importMatch.match(/import\s+{?([^}]+)}?\s+from/)[1];

        // Verificar si el import se usa en el archivo
        if (!content.includes(importName.trim())) {
          fileWarnings.push(`Import posiblemente no utilizado: ${importName.trim()} from ${importedModule}`);
        }
      });
    }

    // 8. Verificar funciones async sin await
    const asyncFunctions = content.match(/async\s+\w+\s*\(/g);
    if (asyncFunctions) {
      asyncFunctions.forEach(func => {
        const funcName = func.match(/async\s+(\w+)/)[1];
        if (!content.includes(`await ${funcName}`) && content.includes(funcName + '(')) {
          fileWarnings.push(`Función async llamada sin await: ${funcName}`);
        }
      });
    }

    // 9. Verificar errores de Next.js comunes
    if (content.includes('getServerSideProps') && !content.includes('export')) {
      fileIssues.push('getServerSideProps debe ser exportado');
    }

    // 10. Verificar uso de any type
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 2) {
      fileWarnings.push(`Múltiples usos de 'any' type (${anyMatches.length}) - considerar tipado más específico`);
    }

    // Reportar resultados
    if (fileIssues.length > 0) {
      console.log(`${colors.red}❌ PROBLEMAS CRÍTICOS:${colors.reset}`);
      fileIssues.forEach(issue => {
        console.log(`   ${colors.red}• ${issue}${colors.reset}`);
        issuesFound++;
      });
    }

    if (fileWarnings.length > 0) {
      console.log(`${colors.yellow}⚠️  ADVERTENCIAS:${colors.reset}`);
      fileWarnings.forEach(warning => {
        console.log(`   ${colors.yellow}• ${warning}${colors.reset}`);
        warningsFound++;
      });
    }

    if (fileIssues.length === 0 && fileWarnings.length === 0) {
      console.log(`${colors.green}✅ Sin problemas detectados${colors.reset}`);
    }

    totalFiles++;
    return { issues: fileIssues, warnings: fileWarnings };

  } catch (error) {
    console.error(`${colors.red}❌ Error analizando ${filePath}: ${error.message}${colors.reset}`);
    return { issues: [], warnings: [] };
  }
}

// Función principal
function main() {
  console.log(`${colors.magenta}🔍 ANÁLISIS ESTÁTICO DE ENDPOINTS${colors.reset}`);
  console.log(`${colors.magenta}=================================${colors.reset}`);

  const backendDir = path.join(process.cwd(), 'Backend');
  const srcDir = path.join(backendDir, 'src');

  if (!fs.existsSync(srcDir)) {
    console.error(`${colors.red}❌ Directorio Backend/src no encontrado${colors.reset}`);
    process.exit(1);
  }

  // Encontrar todos los archivos de rutas
  const routeFiles = readFilesRecursively(srcDir).filter(file =>
    file.includes('/api/') && (file.endsWith('.ts') || file.endsWith('.js'))
  );

  console.log(`\n${colors.cyan}📊 Archivos encontrados: ${routeFiles.length}${colors.reset}`);

  let allResults = [];

  // Analizar cada archivo de ruta
  routeFiles.forEach(filePath => {
    const result = analyzeFile(filePath);
    allResults.push({
      file: path.relative(process.cwd(), filePath),
      ...result
    });
  });

  // Resultados finales
  console.log(`\n${colors.magenta}=================================${colors.reset}`);
  console.log(`${colors.magenta}📊 RESULTADOS DEL ANÁLISIS${colors.reset}`);
  console.log(`${colors.magenta}=================================${colors.reset}`);

  console.log(`\n📈 Estadísticas:`);
  console.log(`   Archivos analizados: ${totalFiles}`);
  console.log(`   ${colors.red}Problemas críticos: ${issuesFound}${colors.reset}`);
  console.log(`   ${colors.yellow}Advertencias: ${warningsFound}${colors.reset}`);

  if (issuesFound === 0 && warningsFound === 0) {
    console.log(`\n${colors.green}🎉 ¡EXCELENTE! No se encontraron problemas críticos${colors.reset}`);
    console.log(`${colors.green}🚀 El código está en buen estado${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}📝 Recomendaciones:${colors.reset}`);
    if (issuesFound > 0) {
      console.log(`   ${colors.red}• Revisar y corregir los ${issuesFound} problemas críticos${colors.reset}`);
    }
    if (warningsFound > 0) {
      console.log(`   ${colors.yellow}• Considerar mejorar las ${warningsFound} advertencias${colors.reset}`);
    }
    console.log(`   • Ejecutar tests unitarios para validar correcciones`);
    console.log(`   • Revisar logs de producción para confirmar funcionamiento`);
  }

  // Guardar reporte detallado
  const reportPath = path.join(process.cwd(), 'REPORTE-ANALISIS-ESTATICO-ENDPOINTS.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles,
      issuesFound,
      warningsFound
    },
    details: allResults
  }, null, 2));

  console.log(`\n${colors.cyan}💾 Reporte guardado en: ${reportPath}${colors.reset}`);

  process.exit(issuesFound > 0 ? 1 : 0);
}

// Ejecutar análisis
if (require.main === module) {
  main();
}

module.exports = { analyzeFile, main };
