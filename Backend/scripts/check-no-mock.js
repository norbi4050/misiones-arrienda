#!/usr/bin/env node

/**
 * Checker Anti-Mock
 * Objetivo: Búsqueda global que falle CI si hay "mockProperties" o "dataSource:'mock'"
 * 
 * Este script busca patrones de mock data que no deben existir en producción
 * y falla con exit code 1 si encuentra alguno.
 */

const fs = require('fs');
const path = require('path');

// Configuración
const SEARCH_PATTERNS = [
  {
    pattern: /mockProperties/g,
    description: 'Mock properties array',
    severity: 'CRITICAL'
  },
  {
    pattern: /dataSource:\s*['"`]mock['"`]/g,
    description: 'Mock data source in meta response',
    severity: 'CRITICAL'
  },
  {
    pattern: /dataSource\s*=\s*['"`]mock['"`]/g,
    description: 'Mock data source assignment',
    severity: 'CRITICAL'
  },
  {
    pattern: /let\s+mockProperties\s*=/g,
    description: 'Mock properties variable declaration',
    severity: 'CRITICAL'
  },
  {
    pattern: /const\s+mockProperties\s*=/g,
    description: 'Mock properties constant declaration',
    severity: 'CRITICAL'
  },
  // NUEVOS PATRONES CRÍTICOS PARA SIGNED URLs
  {
    pattern: /\/storage\/v1\/object\/public\/property-images/g,
    description: 'URLs públicas de property-images (debe ser privado con signed URLs)',
    severity: 'CRITICAL'
  },
  {
    pattern: /getPublicUrl.*property-images/g,
    description: 'getPublicUrl para property-images (debe usar signed URLs)',
    severity: 'CRITICAL'
  },
  {
    pattern: /\.from\(['"`]property-images['"`]\)\.getPublicUrl/g,
    description: 'getPublicUrl directo en bucket property-images',
    severity: 'CRITICAL'
  },
  // PATRONES PARA DETECTAR IMPORTS DESDE /legacy (PROHIBIDO)
  {
    pattern: /from\s+['"`][^'"`]*\/legacy\//g,
    description: 'Import desde carpeta /legacy (PROHIBIDO - usar versiones actuales)',
    severity: 'CRITICAL'
  },
  {
    pattern: /import\s+[^'"`]*from\s+['"`][^'"`]*legacy\//g,
    description: 'Import desde carpeta legacy/ (PROHIBIDO - usar versiones actuales)',
    severity: 'CRITICAL'
  },
  {
    pattern: /require\(['"`][^'"`]*\/legacy\//g,
    description: 'Require desde carpeta /legacy (PROHIBIDO - usar versiones actuales)',
    severity: 'CRITICAL'
  }
];

const SEARCH_DIRECTORIES = [
  'src',
  '__tests__'
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.next/,
  /dist/,
  /build/,
  /coverage/,
  // Excluir este mismo script
  /scripts\/check-no-mock\.js$/,
  // Excluir archivos de documentación/reportes
  /REPORTE.*\.md$/,
  /README\.md$/,
  // Excluir carpeta legacy (archivos deprecated)
  /src[\\\/]legacy[\\\/]/,
  /legacy[\\\/]/
];

const INCLUDE_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx'
];

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Verificar si el directorio debe ser excluido
      const shouldExclude = EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
      if (!shouldExclude) {
        getAllFiles(filePath, fileList);
      }
    } else {
      // Verificar extensión y exclusiones
      const hasValidExtension = INCLUDE_EXTENSIONS.some(ext => filePath.endsWith(ext));
      const shouldExclude = EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
      
      if (hasValidExtension && !shouldExclude) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function searchInFile(filePath, content) {
  const violations = [];
  
  SEARCH_PATTERNS.forEach(({ pattern, description, severity }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      const lineContent = lines[lineNumber - 1].trim();
      
      violations.push({
        pattern: pattern.source,
        description,
        severity,
        lineNumber,
        lineContent,
        match: match[0]
      });
    }
    // Reset regex lastIndex para próxima búsqueda
    pattern.lastIndex = 0;
  });
  
  return violations;
}

function main() {
  log('🔍 CHECKER ANTI-MOCK - Buscando patrones prohibidos...', 'blue');
  log('', 'reset');
  
  let totalViolations = 0;
  let totalFiles = 0;
  const violationsByFile = {};
  
  // Obtener todos los archivos a verificar
  const allFiles = [];
  SEARCH_DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      getAllFiles(dir, allFiles);
    }
  });
  
  log(`📁 Analizando ${allFiles.length} archivos...`, 'blue');
  log('', 'reset');
  
  // Buscar en cada archivo
  allFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const violations = searchInFile(filePath, content);
      
      if (violations.length > 0) {
        violationsByFile[filePath] = violations;
        totalViolations += violations.length;
        totalFiles++;
      }
    } catch (error) {
      log(`⚠️ Error leyendo ${filePath}: ${error.message}`, 'yellow');
    }
  });
  
  // Mostrar resultados
  if (totalViolations === 0) {
    log('✅ ÉXITO: No se encontraron patrones de mock prohibidos', 'green');
    log('', 'reset');
    log('🎉 El código está limpio de mock data', 'green');
    process.exit(0);
  } else {
    log(`❌ FALLO: Se encontraron ${totalViolations} violaciones en ${totalFiles} archivos`, 'red');
    log('', 'reset');
    
    // Mostrar detalles de cada violación
    Object.entries(violationsByFile).forEach(([filePath, violations]) => {
      log(`📄 ${filePath}:`, 'bold');
      
      violations.forEach(violation => {
        const severityColor = violation.severity === 'CRITICAL' ? 'red' : 'yellow';
        log(`  ❌ Línea ${violation.lineNumber}: ${violation.description}`, severityColor);
        log(`     Patrón: ${violation.pattern}`, 'reset');
        log(`     Encontrado: "${violation.match}"`, 'reset');
        log(`     Código: ${violation.lineContent}`, 'reset');
        log('', 'reset');
      });
    });
    
    log('🚨 ACCIÓN REQUERIDA:', 'red');
    log('   1. Eliminar todos los patrones de mock encontrados', 'red');
    log('   2. Asegurar que dataSource siempre sea "db"', 'red');
    log('   3. Ejecutar este script nuevamente hasta que pase', 'red');
    log('', 'reset');
    
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, SEARCH_PATTERNS, getAllFiles, searchInFile };
