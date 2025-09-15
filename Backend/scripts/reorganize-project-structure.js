/**
 * 🏗️ SCRIPT DE REORGANIZACIÓN DE ESTRUCTURA DEL PROYECTO
 * 
 * Reorganiza la estructura de archivos y componentes según mejores prácticas
 * FASE 3: LIMPIEZA Y ESTRUCTURA
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const config = {
  projectRoot: path.join(__dirname, '..'),
  srcDir: path.join(__dirname, '..', 'src'),
  backupDir: path.join(__dirname, '..', '_backups', `reorganize-${Date.now()}`),
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose')
};

// Estadísticas de reorganización
const stats = {
  filesAnalyzed: 0,
  filesMoved: 0,
  directoriesCreated: 0,
  importsUpdated: 0,
  errors: [],
  startTime: new Date()
};

/**
 * Nueva estructura de directorios propuesta
 */
const newStructure = {
  // Componentes UI genéricos
  'src/components/ui/forms': [
    'src/components/ui/profile-form.tsx'
  ],
  'src/components/ui/buttons': [],
  'src/components/ui/modals': [],
  'src/components/ui/layout': [
    'src/components/user-menu.tsx'
  ],
  'src/components/ui/stats': [
    'src/components/ui/profile-stats-improved.tsx',
    'src/components/ui/profile-stats-enhanced.tsx',
    'src/components/ui/profile-stats-auditoria.tsx'
  ],
  'src/components/ui/grids': [
    'src/components/ui/quick-actions-grid.tsx'
  ],
  'src/components/ui/activity': [
    'src/components/ui/recent-activity.tsx'
  ],
  'src/components/ui/avatars': [
    'src/components/ui/profile-avatar.tsx',
    'src/components/ui/profile-avatar-enhanced.tsx'
  ],

  // Componentes por funcionalidad
  'src/components/features/auth': [
    'src/components/auth-provider.tsx'
  ],
  'src/components/features/properties': [],
  'src/components/features/profile': [
    'src/app/profile/inquilino/InquilinoProfilePage.tsx',
    'src/app/profile/inquilino/InquilinoProfilePageNew.tsx',
    'src/app/profile/inquilino/InquilinoProfilePageFixed.tsx'
  ],
  'src/components/features/community': [
    'src/components/comunidad'  // Mover todo el directorio
  ],

  // Hooks organizados
  'src/hooks/auth': [
    'src/hooks/useSupabaseAuth.ts'
  ],
  'src/hooks/api': [
    'src/hooks/useUserFavorites.ts',
    'src/hooks/useUserActivity.ts',
    'src/hooks/useUserStatsImproved.ts'
  ],

  // Librerías organizadas
  'src/lib/supabase': [
    'src/lib/supabase/server.ts',
    'src/lib/supabase/browser.ts',
    'src/lib/supabaseClient.ts'
  ],
  'src/lib/utils': [
    'src/lib/api.ts'
  ],

  // APIs organizadas por funcionalidad
  'src/app/api/auth': [],
  'src/app/api/properties': [
    'src/app/api/properties/route.ts',
    'src/app/api/properties/[id]/route.ts'
  ],
  'src/app/api/users': [
    'src/app/api/users/favorites/route.ts',
    'src/app/api/users/activity/route.ts',
    'src/app/api/users/stats/route.ts',
    'src/app/api/users/stats/route-fixed.ts',
    'src/app/api/users/stats/route-auditoria.ts',
    'src/app/api/users/profile-view/route.ts'
  ],
  'src/app/api/admin': [
    'src/app/api/admin/stats/route-secured.ts'
  ]
};

/**
 * Archivos a consolidar (eliminar duplicados)
 */
const filesToConsolidate = {
  // Mantener el mejor, eliminar los demás
  'profile-stats': {
    keep: 'src/components/ui/profile-stats-enhanced.tsx',
    remove: [
      'src/components/ui/profile-stats-improved.tsx',
      'src/components/ui/profile-stats-auditoria.tsx'
    ]
  },
  'profile-pages': {
    keep: 'src/app/profile/inquilino/InquilinoProfilePage.tsx',
    remove: [
      'src/app/profile/inquilino/InquilinoProfilePageNew.tsx',
      'src/app/profile/inquilino/InquilinoProfilePageFixed.tsx'
    ]
  },
  'user-stats-routes': {
    keep: 'src/app/api/users/stats/route.ts',
    remove: [
      'src/app/api/users/stats/route-fixed.ts',
      'src/app/api/users/stats/route-auditoria.ts'
    ]
  },
  'profile-avatars': {
    keep: 'src/components/ui/profile-avatar-enhanced.tsx',
    remove: [
      'src/components/ui/profile-avatar.tsx'
    ]
  }
};

/**
 * Patrones de imports a actualizar
 */
const importPatterns = [
  {
    from: /from ['"]@\/components\/ui\/profile-stats-improved['"]/, 
    to: "from '@/components/ui/stats/profile-stats'"
  },
  {
    from: /from ['"]@\/components\/auth-provider['"]/, 
    to: "from '@/components/features/auth/auth-provider'"
  },
  {
    from: /from ['"]@\/hooks\/useSupabaseAuth['"]/, 
    to: "from '@/hooks/auth/useSupabaseAuth'"
  },
  {
    from: /from ['"]@\/lib\/supabaseClient['"]/, 
    to: "from '@/lib/supabase/client'"
  }
];

/**
 * Crea backup de archivos antes de mover
 */
function createBackup(filePath) {
  if (config.dryRun) return;

  try {
    const relativePath = path.relative(config.projectRoot, filePath);
    const backupPath = path.join(config.backupDir, relativePath);
    const backupDir = path.dirname(backupPath);

    fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(filePath, backupPath);

    if (config.verbose) {
      console.log(`   📦 Backup: ${relativePath}`);
    }
  } catch (error) {
    stats.errors.push(`Error creando backup de ${filePath}: ${error.message}`);
  }
}

/**
 * Crea directorio si no existe
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    if (!config.dryRun) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    stats.directoriesCreated++;
    
    if (config.verbose) {
      console.log(`   📁 Directorio creado: ${path.relative(config.projectRoot, dirPath)}`);
    }
  }
}

/**
 * Mueve archivo a nueva ubicación
 */
function moveFile(fromPath, toPath) {
  try {
    const fromRelative = path.relative(config.projectRoot, fromPath);
    const toRelative = path.relative(config.projectRoot, toPath);
    
    if (!fs.existsSync(fromPath)) {
      if (config.verbose) {
        console.log(`   ⚠️  Archivo no existe: ${fromRelative}`);
      }
      return false;
    }

    // Crear backup
    createBackup(fromPath);
    
    // Asegurar que el directorio destino existe
    ensureDirectory(path.dirname(toPath));
    
    console.log(`   📦 Moviendo: ${fromRelative} → ${toRelative}`);
    
    if (!config.dryRun) {
      fs.renameSync(fromPath, toPath);
    }
    
    stats.filesMoved++;
    return true;
  } catch (error) {
    stats.errors.push(`Error moviendo ${fromPath} a ${toPath}: ${error.message}`);
    return false;
  }
}

/**
 * Consolida archivos duplicados
 */
function consolidateFiles() {
  console.log('\n🔄 Consolidando archivos duplicados...');
  
  Object.entries(filesToConsolidate).forEach(([name, config]) => {
    console.log(`\n   📋 Consolidando ${name}:`);
    
    const keepPath = path.join(config.projectRoot, config.keep);
    const keepRelative = path.relative(config.projectRoot, keepPath);
    
    console.log(`   ✅ Mantener: ${keepRelative}`);
    
    config.remove.forEach(removePath => {
      const fullRemovePath = path.join(config.projectRoot, removePath);
      const removeRelative = path.relative(config.projectRoot, fullRemovePath);
      
      if (fs.existsSync(fullRemovePath)) {
        console.log(`   🗑️  Eliminar: ${removeRelative}`);
        
        if (!config.dryRun) {
          createBackup(fullRemovePath);
          fs.unlinkSync(fullRemovePath);
        }
      }
    });
  });
}

/**
 * Reorganiza archivos según nueva estructura
 */
function reorganizeFiles() {
  console.log('\n🏗️  Reorganizando estructura de archivos...');
  
  Object.entries(newStructure).forEach(([newDir, files]) => {
    if (files.length === 0) return;
    
    console.log(`\n   📁 Procesando directorio: ${newDir}`);
    
    const fullNewDir = path.join(config.projectRoot, newDir);
    ensureDirectory(fullNewDir);
    
    files.forEach(filePath => {
      const fullFromPath = path.join(config.projectRoot, filePath);
      const fileName = path.basename(filePath);
      const fullToPath = path.join(fullNewDir, fileName);
      
      stats.filesAnalyzed++;
      
      if (moveFile(fullFromPath, fullToPath)) {
        // Archivo movido exitosamente
      }
    });
  });
}

/**
 * Actualiza imports en archivos
 */
function updateImports() {
  console.log('\n🔗 Actualizando imports...');
  
  const findFiles = (dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) => {
    let files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(findFiles(fullPath, extensions));
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      stats.errors.push(`Error leyendo directorio ${dir}: ${error.message}`);
    }
    
    return files;
  };
  
  const files = findFiles(config.srcDir);
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let updatedContent = content;
      let hasChanges = false;
      
      importPatterns.forEach(pattern => {
        if (pattern.from.test(content)) {
          updatedContent = updatedContent.replace(pattern.from, pattern.to);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        const relativePath = path.relative(config.projectRoot, filePath);
        console.log(`   🔗 Actualizando imports: ${relativePath}`);
        
        if (!config.dryRun) {
          createBackup(filePath);
          fs.writeFileSync(filePath, updatedContent);
        }
        
        stats.importsUpdated++;
      }
    } catch (error) {
      stats.errors.push(`Error actualizando imports en ${filePath}: ${error.message}`);
    }
  });
}

/**
 * Limpia directorios vacíos
 */
function cleanupEmptyDirectories() {
  console.log('\n🧹 Limpiando directorios vacíos...');
  
  const cleanEmptyDirs = (dir) => {
    try {
      const items = fs.readdirSync(dir);
      
      if (items.length === 0) {
        const relativePath = path.relative(config.projectRoot, dir);
        console.log(`   🗑️  Eliminando directorio vacío: ${relativePath}`);
        
        if (!config.dryRun) {
          fs.rmdirSync(dir);
        }
        return true;
      }
      
      let isEmpty = true;
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!cleanEmptyDirs(fullPath)) {
            isEmpty = false;
          }
        } else {
          isEmpty = false;
        }
      });
      
      if (isEmpty && items.length === 0) {
        const relativePath = path.relative(config.projectRoot, dir);
        console.log(`   🗑️  Eliminando directorio vacío: ${relativePath}`);
        
        if (!config.dryRun) {
          fs.rmdirSync(dir);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };
  
  // Limpiar directorios específicos
  const dirsToCheck = [
    path.join(config.srcDir, 'components'),
    path.join(config.srcDir, 'hooks'),
    path.join(config.srcDir, 'lib'),
    path.join(config.srcDir, 'app')
  ];
  
  dirsToCheck.forEach(dir => {
    if (fs.existsSync(dir)) {
      cleanEmptyDirs(dir);
    }
  });
}

/**
 * Crea archivo de índice para cada directorio
 */
function createIndexFiles() {
  console.log('\n📄 Creando archivos de índice...');
  
  const indexesToCreate = {
    'src/components/ui/index.ts': [
      'export * from "./forms"',
      'export * from "./buttons"',
      'export * from "./modals"',
      'export * from "./layout"',
      'export * from "./stats"',
      'export * from "./grids"',
      'export * from "./activity"',
      'export * from "./avatars"'
    ],
    'src/components/features/index.ts': [
      'export * from "./auth"',
      'export * from "./properties"',
      'export * from "./profile"',
      'export * from "./community"'
    ],
    'src/hooks/index.ts': [
      'export * from "./auth"',
      'export * from "./api"'
    ],
    'src/lib/index.ts': [
      'export * from "./supabase"',
      'export * from "./utils"'
    ]
  };
  
  Object.entries(indexesToCreate).forEach(([indexPath, exports]) => {
    const fullPath = path.join(config.projectRoot, indexPath);
    const content = exports.join(';\n') + ';\n';
    
    console.log(`   📄 Creando: ${indexPath}`);
    
    if (!config.dryRun) {
      ensureDirectory(path.dirname(fullPath));
      fs.writeFileSync(fullPath, content);
    }
  });
}

/**
 * Genera reporte de reorganización
 */
function generateReport() {
  const endTime = new Date();
  const duration = (endTime - stats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Exportar todas las utilidades
export * from './api';
export * from './storage';
export * from './validation';
`
  }
];

// Contadores para estadísticas
let stats = {
  directoriesCreated: 0,
  filesMoved: 0,
  filesCreated: 0,
  errors: 0,
  startTime: Date.now()
};

/**
 * Crea un directorio si no existe
 */
function ensureDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      if (DRY_RUN) {
        console.log(`📁 [DRY RUN] Crearía directorio: ${dirPath}`);
      } else {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Directorio creado: ${dirPath}`);
      }
      stats.directoriesCreated++;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error creando directorio ${dirPath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Mueve un archivo de una ubicación a otra
 */
function moveFile(fromPath, toPath) {
  try {
    const fullFromPath = path.join(PROJECT_ROOT, fromPath);
    const fullToPath = path.join(PROJECT_ROOT, toPath);
    
    if (!fs.existsSync(fullFromPath)) {
      console.log(`⏭️  Archivo no existe: ${fromPath}`);
      return false;
    }
    
    // Crear directorio destino si no existe
    const toDir = path.dirname(fullToPath);
    ensureDirectory(toDir);
    
    if (DRY_RUN) {
      console.log(`📄 [DRY RUN] Movería: ${fromPath} → ${toPath}`);
    } else {
      fs.renameSync(fullFromPath, fullToPath);
      console.log(`📄 Archivo movido: ${fromPath} → ${toPath}`);
    }
    
    stats.filesMoved++;
    return true;
  } catch (error) {
    console.error(`❌ Error moviendo ${fromPath} → ${toPath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Crea un archivo con contenido
 */
function createFile(filePath, content) {
  try {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const dir = path.dirname(fullPath);
    
    // Crear directorio si no existe
    ensureDirectory(dir);
    
    if (DRY_RUN) {
      console.log(`📝 [DRY RUN] Crearía archivo: ${filePath}`);
    } else {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`📝 Archivo creado: ${filePath}`);
    }
    
    stats.filesCreated++;
    return true;
  } catch (error) {
    console.error(`❌ Error creando archivo ${filePath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Busca archivos que coincidan con un patrón
 */
function findFilesByPattern(pattern) {
  const glob = require('glob');
  try {
    return glob.sync(pattern, { cwd: PROJECT_ROOT });
  } catch (error) {
    console.error(`❌ Error buscando archivos con patrón ${pattern}:`, error.message);
    return [];
  }
}

/**
 * Actualiza las importaciones en un archivo
 */
function updateImports(filePath, importMappings) {
  try {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let updated = false;
    
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      const regex = new RegExp(`from ['"]${oldImport}['"]`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, `from "${newImport}"`);
        updated = true;
      }
    }
    
    if (updated) {
      if (DRY_RUN) {
        console.log(`🔄 [DRY RUN] Actualizaría imports en: ${filePath}`);
      } else {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`🔄 Imports actualizados en: ${filePath}`);
      }
    }
    
    return updated;
  } catch (error) {
    console.error(`❌ Error actualizando imports en ${filePath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Función principal de reorganización
 */
async function reorganizeProject() {
  console.log('📁 Iniciando reorganización de estructura del proyecto...\n');
  
  if (DRY_RUN) {
    console.log('🔍 MODO DRY RUN - Solo se mostrarán los cambios\n');
  }
  
  // 1. Crear estructura de directorios objetivo
  console.log('📁 Creando estructura de directorios...');
  for (const [dirPath, description] of Object.entries(TARGET_STRUCTURE)) {
    const fullPath = path.join(PROJECT_ROOT, dirPath);
    ensureDirectory(fullPath);
  }
  
  // 2. Crear archivos de configuración
  console.log('\n📝 Creando archivos de configuración...');
  for (const configFile of CONFIG_FILES) {
    createFile(configFile.path, configFile.content);
  }
  
  // 3. Mover archivos según mapeo
  console.log('\n📄 Moviendo archivos...');
  for (const mapping of FILE_MAPPINGS) {
    if (mapping.pattern) {
      // Buscar archivos por patrón
      const files = findFilesByPattern(mapping.pattern);
      for (const file of files) {
        const fileName = path.basename(file);
        const toPath = path.join(mapping.to, fileName);
        moveFile(file, toPath);
      }
    } else if (mapping.from && mapping.to) {
      // Mover archivo específico
      if (mapping.create && !fs.existsSync(path.join(PROJECT_ROOT, mapping.from))) {
        // Crear archivo si no existe
        createFile(mapping.to, '// TODO: Implementar contenido\nexport {};\n');
      } else {
        moveFile(mapping.from, mapping.to);
      }
    }
  }
  
  // 4. Actualizar importaciones
  console.log('\n🔄 Actualizando importaciones...');
  const importMappings = {
    '../lib/types': '../types',
    '../lib/utils': '../utils',
    '@/lib/types': '@/types',
    '@/lib/utils': '@/utils',
    '../lib/config': '../lib/config',
    '@/lib/config': '@/lib/config',
  };
  
  // Buscar archivos TypeScript y JavaScript para actualizar
  const codeFiles = [
    ...findFilesByPattern('src/**/*.ts'),
    ...findFilesByPattern('src/**/*.tsx'),
    ...findFilesByPattern('src/**/*.js'),
    ...findFilesByPattern('src/**/*.jsx'),
  ];
  
  for (const file of codeFiles) {
    updateImports(file, importMappings);
  }
  
  // 5. Crear archivos de documentación
  console.log('\n📚 Creando documentación...');
  const docFiles = [
    {
      path: 'docs/README.md',
      content: '# Documentación del Proyecto\n\nEsta carpeta contiene toda la documentación técnica del proyecto.\n'
    },
    {
      path: 'docs/api/README.md',
      content: '# Documentación de APIs\n\nDocumentación de todas las APIs del proyecto.\n'
    },
    {
      path: 'docs/components/README.md',
      content: '# Documentación de Componentes\n\nDocumentación de todos los componentes React.\n'
    },
    {
      path: 'docs/deployment/README.md',
      content: '# Guías de Despliegue\n\nInstrucciones para desplegar el proyecto en diferentes entornos.\n'
    }
  ];
  
  for (const docFile of docFiles) {
    createFile(docFile.path, docFile.content);
  }
  
  // Estadísticas finales
  const duration = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE REORGANIZACIÓN');
  console.log('='.repeat(60));
  console.log(`⏱️  Duración: ${duration.toFixed(2)} segundos`);
  console.log(`📁 Directorios creados: ${stats.directoriesCreated}`);
  console.log(`📄 Archivos movidos: ${stats.filesMoved}`);
  console.log(`📝 Archivos creados: ${stats.filesCreated}`);
  console.log(`❌ Errores: ${stats.errors}`);
  
  if (DRY_RUN) {
    console.log('\n💡 Para ejecutar los cambios realmente, ejecuta sin --dry-run');
  } else if (stats.errors === 0) {
    console.log('\n🎉 ¡Reorganización completada exitosamente!');
    console.log('💡 Recuerda probar que todo funciona correctamente después de los cambios');
  } else {
    console.log(`\n⚠️  Reorganización completada con ${stats.errors} errores`);
  }
}

/**
 * Función de verificación post-reorganización
 */
function verifyReorganization() {
  console.log('\n🔍 Verificando reorganización...');
  
  let issuesFound = 0;
  
  // Verificar que los directorios objetivo existen
  for (const dirPath of Object.keys(TARGET_STRUCTURE)) {
    const fullPath = path.join(PROJECT_ROOT, dirPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Directorio faltante: ${dirPath}`);
      issuesFound++;
    } else {
      console.log(`✅ Directorio presente: ${dirPath}`);
    }
  }
  
  // Verificar archivos de configuración críticos
  const criticalFiles = [
    'src/lib/config/index.ts',
    'src/types/index.ts',
    'src/utils/index.ts'
  ];
  
  for (const filePath of criticalFiles) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Archivo crítico faltante: ${filePath}`);
      issuesFound++;
    } else {
      console.log(`✅ Archivo crítico presente: ${filePath}`);
    }
  }
  
  if (issuesFound === 0) {
    console.log('\n✅ ¡Verificación completada sin problemas!');
  } else {
    console.log(`\n⚠️  Se encontraron ${issuesFound} problemas que requieren atención`);
  }
}

// Ejecutar reorganización
if (require.main === module) {
  (async () => {
    try {
      await reorganizeProject();
      if (!DRY_RUN) {
        verifyReorganization();
      }
    } catch (error) {
      console.error('❌ Error fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  reorganizeProject,
  verifyReorganization
};
