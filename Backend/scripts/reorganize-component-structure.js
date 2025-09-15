/**
 * 🗂️ SCRIPT: REORGANIZACIÓN AUTOMÁTICA DE ESTRUCTURA DE COMPONENTES
 * 
 * Script para reorganizar componentes por funcionalidad automáticamente
 * FASE 3: LIMPIEZA Y ESTRUCTURA
 */

const fs = require('fs');
const path = require('path');

// Configuración de rutas
const srcPath = path.join(__dirname, '..', 'src');
const componentsPath = path.join(srcPath, 'components');
const backupPath = path.join(__dirname, '..', '_backups', `structure-${Date.now()}`);

// Configuración de reorganización
const targetStructure = {
  'auth': {
    patterns: ['auth', 'login', 'register', 'signin', 'signup'],
    files: ['auth-provider.tsx', 'user-menu.tsx']
  },
  'ui': {
    patterns: ['ui', 'button', 'input', 'modal', 'form', 'card', 'avatar', 'stats', 'grid', 'activity'],
    files: [] // Ya existe, mantener archivos actuales
  },
  'property': {
    patterns: ['property', 'listing', 'detail', 'card'],
    files: []
  },
  'user': {
    patterns: ['user', 'profile', 'account'],
    files: []
  },
  'admin': {
    patterns: ['admin', 'dashboard'],
    files: []
  }
};

// Resultados de la reorganización
const results = {
  moved: [],
  created: [],
  updated: [],
  errors: [],
  backupCreated: false
};

/**
 * Función auxiliar para crear directorio si no existe
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`   📁 Directorio creado: ${path.relative(srcPath, dirPath)}`);
    results.created.push(path.relative(srcPath, dirPath));
    return true;
  }
  return false;
}

/**
 * Función auxiliar para obtener archivos recursivamente
 */
function getFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Crear backup de la estructura actual
 */
function createBackup() {
  console.log('\n💾 Creando backup de estructura actual...');
  
  try {
    ensureDirectoryExists(backupPath);
    
    // Copiar estructura actual
    const componentFiles = getFilesRecursively(componentsPath);
    
    componentFiles.forEach(filePath => {
      const relativePath = path.relative(componentsPath, filePath);
      const backupFilePath = path.join(backupPath, 'components', relativePath);
      
      ensureDirectoryExists(path.dirname(backupFilePath));
      fs.copyFileSync(filePath, backupFilePath);
    });
    
    console.log(`   ✅ Backup creado en: ${backupPath}`);
    results.backupCreated = true;
    
    // Crear archivo de información del backup
    const backupInfo = {
      timestamp: new Date().toISOString(),
      originalPath: componentsPath,
      filesBackedUp: componentFiles.length,
      purpose: 'Backup antes de reorganización de estructura'
    };
    
    fs.writeFileSync(
      path.join(backupPath, 'backup-info.json'), 
      JSON.stringify(backupInfo, null, 2)
    );
    
  } catch (error) {
    console.error(`   ❌ Error creando backup: ${error.message}`);
    results.errors.push(`Backup error: ${error.message}`);
    throw error;
  }
}

/**
 * Crear estructura de directorios objetivo
 */
function createTargetStructure() {
  console.log('\n📁 Creando estructura de directorios objetivo...');
  
  Object.keys(targetStructure).forEach(category => {
    const categoryPath = path.join(componentsPath, category);
    ensureDirectoryExists(categoryPath);
  });
}

/**
 * Categorizar archivo basado en nombre y contenido
 */
function categorizeFile(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
  const relativePath = path.relative(componentsPath, filePath);
  
  // Si ya está en un subdirectorio objetivo, mantenerlo
  for (const category of Object.keys(targetStructure)) {
    if (relativePath.startsWith(`${category}/`)) {
      return category;
    }
  }
  
  // Categorizar por nombre
  for (const [category, config] of Object.entries(targetStructure)) {
    // Verificar archivos específicos
    if (config.files.includes(path.basename(filePath))) {
      return category;
    }
    
    // Verificar patrones
    for (const pattern of config.patterns) {
      if (fileName.includes(pattern)) {
        return category;
      }
    }
  }
  
  // Si no se puede categorizar, mantener en raíz o mover a 'ui' por defecto
  return null;
}

/**
 * Mover archivo a nueva ubicación
 */
function moveFile(filePath, targetCategory) {
  const fileName = path.basename(filePath);
  const currentRelativePath = path.relative(componentsPath, filePath);
  const targetDir = path.join(componentsPath, targetCategory);
  const targetPath = path.join(targetDir, fileName);
  
  try {
    // Verificar si el archivo ya existe en el destino
    if (fs.existsSync(targetPath)) {
      console.log(`   ⚠️  Archivo ya existe en destino: ${targetCategory}/${fileName}`);
      return false;
    }
    
    // Mover archivo
    fs.renameSync(filePath, targetPath);
    console.log(`   ✅ Movido: ${currentRelativePath} → ${targetCategory}/${fileName}`);
    
    results.moved.push({
      from: currentRelativePath,
      to: `${targetCategory}/${fileName}`
    });
    
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error moviendo ${fileName}: ${error.message}`);
    results.errors.push(`Move error ${fileName}: ${error.message}`);
    return false;
  }
}

/**
 * Actualizar imports en archivos
 */
function updateImports() {
  console.log('\n🔗 Actualizando imports en archivos...');
  
  const allTsFiles = [
    ...getFilesRecursively(componentsPath).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')),
    ...getFilesRecursively(path.join(srcPath, 'app')).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')),
    ...getFilesRecursively(path.join(srcPath, 'hooks')).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  ];
  
  let updatedFiles = 0;
  
  allTsFiles.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let hasChanges = false;
      const relativePath = path.relative(srcPath, filePath);
      
      // Actualizar imports basados en los archivos movidos
      results.moved.forEach(move => {
        const oldImportPath = `@/components/${move.from.replace('.tsx', '').replace('.ts', '')}`;
        const newImportPath = `@/components/${move.to.replace('.tsx', '').replace('.ts', '')}`;
        
        // Buscar y reemplazar imports
        const importRegex = new RegExp(`from ['"]${oldImportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
        if (importRegex.test(content)) {
          content = content.replace(importRegex, `from '${newImportPath}'`);
          hasChanges = true;
        }
        
        // También buscar imports relativos
        const relativeRegex = new RegExp(`from ['"]\\.\\.?/.*${path.basename(move.from, '.tsx')}['"]`, 'g');
        if (relativeRegex.test(content)) {
          // Para imports relativos, necesitamos calcular la nueva ruta relativa
          const currentDir = path.dirname(filePath);
          const targetFile = path.join(componentsPath, move.to);
          const newRelativePath = path.relative(currentDir, targetFile).replace(/\\/g, '/');
          const newImport = newRelativePath.startsWith('.') ? newRelativePath : `./${newRelativePath}`;
          
          content = content.replace(relativeRegex, `from '${newImport.replace('.tsx', '').replace('.ts', '')}'`);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        fs.writeFileSync(filePath, content);
        console.log(`   ✅ Actualizado: ${relativePath}`);
        updatedFiles++;
        results.updated.push(relativePath);
      }
      
    } catch (error) {
      console.error(`   ❌ Error actualizando imports en ${filePath}: ${error.message}`);
      results.errors.push(`Import update error ${filePath}: ${error.message}`);
    }
  });
  
  console.log(`   📊 Archivos actualizados: ${updatedFiles}`);
}

/**
 * Reorganizar componentes
 */
function reorganizeComponents() {
  console.log('\n🗂️ Reorganizando componentes...');
  
  // Obtener todos los archivos de componentes en la raíz
  const componentFiles = fs.readdirSync(componentsPath)
    .filter(file => {
      const filePath = path.join(componentsPath, file);
      return fs.statSync(filePath).isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'));
    })
    .map(file => path.join(componentsPath, file));
  
  console.log(`   📊 Archivos a reorganizar: ${componentFiles.length}`);
  
  componentFiles.forEach(filePath => {
    const category = categorizeFile(filePath);
    
    if (category) {
      moveFile(filePath, category);
    } else {
      const fileName = path.basename(filePath);
      console.log(`   ⚠️  No se pudo categorizar: ${fileName} (se mantiene en raíz)`);
    }
  });
}

/**
 * Limpiar directorios vacíos
 */
function cleanupEmptyDirectories() {
  console.log('\n🧹 Limpiando directorios vacíos...');
  
  function isDirectoryEmpty(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      return files.length === 0;
    } catch (error) {
      return false;
    }
  }
  
  function removeEmptyDirectories(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        removeEmptyDirectories(filePath);
        
        if (isDirectoryEmpty(filePath)) {
          fs.rmdirSync(filePath);
          console.log(`   🗑️ Directorio vacío eliminado: ${path.relative(srcPath, filePath)}`);
        }
      }
    });
  }
  
  removeEmptyDirectories(componentsPath);
}

/**
 * Generar reporte final
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE FINAL - REORGANIZACIÓN DE ESTRUCTURA');
  console.log('='.repeat(60));
  
  console.log(`\n📈 RESUMEN:`);
  console.log(`   📁 Directorios creados: ${results.created.length}`);
  console.log(`   📦 Archivos movidos: ${results.moved.length}`);
  console.log(`   🔗 Archivos con imports actualizados: ${results.updated.length}`);
  console.log(`   ❌ Errores: ${results.errors.length}`);
  console.log(`   💾 Backup creado: ${results.backupCreated ? 'Sí' : 'No'}`);
  
  if (results.created.length > 0) {
    console.log(`\n📁 DIRECTORIOS CREADOS:`);
    results.created.forEach(dir => console.log(`   - ${dir}`));
  }
  
  if (results.moved.length > 0) {
    console.log(`\n📦 ARCHIVOS MOVIDOS:`);
    results.moved.forEach(move => console.log(`   - ${move.from} → ${move.to}`));
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORES:`);
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log(`\n💡 PRÓXIMOS PASOS:`);
  if (results.errors.length === 0) {
    console.log(`   1. ✅ Reorganización completada exitosamente`);
    console.log(`   2. 🧪 Ejecutar: node Backend/test-component-structure.js`);
    console.log(`   3. 🔨 Ejecutar: npm run build (verificar que no hay errores)`);
    console.log(`   4. 🚀 Continuar con Fase 4`);
  } else {
    console.log(`   1. ❌ Revisar y corregir errores reportados`);
    console.log(`   2. 🔄 Restaurar desde backup si es necesario: ${backupPath}`);
    console.log(`   3. 🔧 Corregir problemas manualmente`);
  }
  
  if (results.backupCreated) {
    console.log(`\n💾 BACKUP DISPONIBLE EN: ${backupPath}`);
    console.log(`   Para restaurar: cp -r ${backupPath}/components/* ${componentsPath}/`);
  }
  
  // Guardar reporte
  const reportPath = path.join(__dirname, '..', 'reorganize-structure-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);
}

/**
 * Función principal
 */
function main() {
  console.log('🗂️ INICIANDO REORGANIZACIÓN DE ESTRUCTURA DE COMPONENTES');
  console.log('='.repeat(60));
  console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
  console.log(`📁 Directorio base: ${componentsPath}`);
  
  try {
    // Verificar que existe el directorio de componentes
    if (!fs.existsSync(componentsPath)) {
      throw new Error(`Directorio de componentes no existe: ${componentsPath}`);
    }
    
    // Crear backup
    createBackup();
    
    // Crear estructura objetivo
    createTargetStructure();
    
    // Reorganizar componentes
    reorganizeComponents();
    
    // Actualizar imports
    updateImports();
    
    // Limpiar directorios vacíos
    cleanupEmptyDirectories();
    
    // Generar reporte
    generateReport();
    
    console.log('\n🎉 ¡REORGANIZACIÓN COMPLETADA EXITOSAMENTE!');
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LA REORGANIZACIÓN:');
    console.error(error.message);
    
    if (results.backupCreated) {
      console.log(`\n💾 Backup disponible para restaurar en: ${backupPath}`);
    }
    
    process.exit(1);
  }
}

// Ejecutar reorganización
main();
