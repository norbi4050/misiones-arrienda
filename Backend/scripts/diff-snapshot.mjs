#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { createSnapshot } from './make-snapshot.mjs';

/**
 * Compara dos snapshots y genera un reporte de diferencias
 */
async function compareSnapshots(prevSnapshot, currentSnapshot) {
  console.error('🔍 Comparando snapshots...');
  
  // Crear mapas para búsqueda rápida
  const prevFiles = new Map();
  const currentFiles = new Map();
  
  prevSnapshot.files.forEach(file => {
    prevFiles.set(file.path, file);
  });
  
  currentSnapshot.files.forEach(file => {
    currentFiles.set(file.path, file);
  });
  
  const report = {
    timestamp: new Date().toISOString(),
    prevSnapshot: {
      timestamp: prevSnapshot.timestamp,
      totalFiles: prevSnapshot.totalFiles
    },
    currentSnapshot: {
      timestamp: currentSnapshot.timestamp,
      totalFiles: currentSnapshot.totalFiles
    },
    added: [],
    removed: [],
    modified: [],
    moved: []
  };
  
  // Encontrar archivos agregados
  for (const [filePath, fileInfo] of currentFiles) {
    if (!prevFiles.has(filePath)) {
      report.added.push({
        path: filePath,
        size: fileInfo.size,
        sha1: fileInfo.sha1,
        loc: fileInfo.loc
      });
    }
  }
  
  // Encontrar archivos removidos
  for (const [filePath, fileInfo] of prevFiles) {
    if (!currentFiles.has(filePath)) {
      report.removed.push({
        path: filePath,
        size: fileInfo.size,
        sha1: fileInfo.sha1,
        loc: fileInfo.loc
      });
    }
  }
  
  // Encontrar archivos modificados
  for (const [filePath, currentFile] of currentFiles) {
    const prevFile = prevFiles.get(filePath);
    if (prevFile && prevFile.sha1 !== currentFile.sha1) {
      report.modified.push({
        path: filePath,
        prev: {
          size: prevFile.size,
          sha1: prevFile.sha1,
          loc: prevFile.loc
        },
        current: {
          size: currentFile.size,
          sha1: currentFile.sha1,
          loc: currentFile.loc
        },
        sizeDiff: currentFile.size - prevFile.size,
        locDiff: currentFile.loc && prevFile.loc ? 
          currentFile.loc.nonEmpty - prevFile.loc.nonEmpty : null
      });
    }
  }
  
  // Detectar archivos movidos (mismo SHA1, diferente path)
  const prevBySha1 = new Map();
  const currentBySha1 = new Map();
  
  prevSnapshot.files.forEach(file => {
    if (file.sha1) {
      if (!prevBySha1.has(file.sha1)) {
        prevBySha1.set(file.sha1, []);
      }
      prevBySha1.get(file.sha1).push(file);
    }
  });
  
  currentSnapshot.files.forEach(file => {
    if (file.sha1) {
      if (!currentBySha1.has(file.sha1)) {
        currentBySha1.set(file.sha1, []);
      }
      currentBySha1.get(file.sha1).push(file);
    }
  });
  
  // Buscar movimientos (archivos con mismo SHA1 pero diferente path)
  for (const [sha1, currentFileList] of currentBySha1) {
    const prevFileList = prevBySha1.get(sha1);
    if (prevFileList && prevFileList.length === 1 && currentFileList.length === 1) {
      const prevFile = prevFileList[0];
      const currentFile = currentFileList[0];
      
      if (prevFile.path !== currentFile.path) {
        // Verificar que no esté ya en added/removed
        const isInAdded = report.added.some(f => f.path === currentFile.path);
        const isInRemoved = report.removed.some(f => f.path === prevFile.path);
        
        if (isInAdded && isInRemoved) {
          // Remover de added y removed, agregar a moved
          report.added = report.added.filter(f => f.path !== currentFile.path);
          report.removed = report.removed.filter(f => f.path !== prevFile.path);
          
          report.moved.push({
            sha1: sha1,
            from: prevFile.path,
            to: currentFile.path,
            size: currentFile.size,
            loc: currentFile.loc
          });
        }
      }
    }
  }
  
  // Estadísticas del reporte
  const stats = {
    totalChanges: report.added.length + report.removed.length + report.modified.length + report.moved.length,
    addedFiles: report.added.length,
    removedFiles: report.removed.length,
    modifiedFiles: report.modified.length,
    movedFiles: report.moved.length
  };
  
  console.error(`📊 Resumen de cambios:`);
  console.error(`   ➕ Agregados: ${stats.addedFiles}`);
  console.error(`   ➖ Removidos: ${stats.removedFiles}`);
  console.error(`   📝 Modificados: ${stats.modifiedFiles}`);
  console.error(`   📁 Movidos: ${stats.movedFiles}`);
  console.error(`   🔄 Total cambios: ${stats.totalChanges}`);
  
  report.stats = stats;
  
  return report;
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  let prevSnapshotPath = 'scripts/snapshot.json';
  let outputPath = 'scripts/change-report.json';
  
  // Parsear argumentos
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prev' && i + 1 < args.length) {
      prevSnapshotPath = args[i + 1];
      i++;
    } else if (args[i] === '--out' && i + 1 < args.length) {
      outputPath = args[i + 1];
      i++;
    }
  }
  
  try {
    // Leer snapshot previo
    console.error(`📖 Leyendo snapshot previo: ${prevSnapshotPath}`);
    const prevSnapshotContent = await fs.readFile(prevSnapshotPath, 'utf-8');
    const prevSnapshot = JSON.parse(prevSnapshotContent);
    
    // Crear snapshot actual
    console.error('📸 Creando snapshot actual...');
    const currentSnapshot = await createSnapshot();
    
    // Comparar snapshots
    const report = await compareSnapshots(prevSnapshot, currentSnapshot);
    
    // Verificar si hay archivos removidos (fallar si es así)
    if (report.removed.length > 0) {
      console.error('❌ ERROR: Se detectaron archivos removidos:');
      report.removed.forEach(file => {
        console.error(`   - ${file.path}`);
      });
      console.error('');
      console.error('⚠️  La política del proyecto prohíbe borrar archivos.');
      console.error('   Si necesitas remover archivos, muévelos a legacy/_quarantine/');
      
      // Guardar el reporte antes de fallar
      if (outputPath) {
        await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
        console.error(`📄 Reporte guardado en: ${outputPath}`);
      }
      
      process.exit(1);
    }
    
    // Guardar reporte
    if (outputPath) {
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
      console.error(`📄 Reporte guardado en: ${outputPath}`);
    } else {
      console.log(JSON.stringify(report, null, 2));
    }
    
    console.error('✅ Comparación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { compareSnapshots };
