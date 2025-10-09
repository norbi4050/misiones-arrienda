#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Directorios a excluir del snapshot
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'coverage',
  'dist',
  'build',
  'legacy/_quarantine'
]);

// Extensiones de archivos de texto para calcular LOC
const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.css', '.scss',
  '.html', '.xml', '.yml', '.yaml', '.sql', '.sh', '.ps1', '.mjs', '.cjs'
]);

/**
 * Calcula el SHA1 del contenido de un archivo
 */
async function calculateSHA1(filePath) {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha1').update(content).digest('hex');
  } catch (error) {
    console.error(`Error calculating SHA1 for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Calcula las líneas de código (LOC) para archivos de texto
 */
async function calculateLOC(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) {
      return null;
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Contar líneas no vacías y que no sean solo espacios
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    return {
      total: lines.length,
      nonEmpty: nonEmptyLines.length
    };
  } catch (error) {
    // Si no se puede leer como texto, retornar null
    return null;
  }
}

/**
 * Verifica si un directorio debe ser excluido
 */
function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  
  // Verificar directorios exactos
  if (EXCLUDED_DIRS.has(dirName)) {
    return true;
  }
  
  // Verificar rutas específicas como legacy/_quarantine
  const relativePath = path.relative(process.cwd(), dirPath);
  if (relativePath.includes('legacy/_quarantine')) {
    return true;
  }
  
  return false;
}

/**
 * Recorre recursivamente el árbol de archivos
 */
async function walkDirectory(dirPath, files = []) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!shouldExcludeDir(fullPath)) {
          await walkDirectory(fullPath, files);
        }
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
    return files;
  }
}

/**
 * Crea el snapshot de todos los archivos
 */
async function createSnapshot() {
  console.error('🔍 Iniciando snapshot del proyecto...');
  
  const startTime = Date.now();
  const files = await walkDirectory(process.cwd());
  
  console.error(`📁 Encontrados ${files.length} archivos`);
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    files: []
  };
  
  let processed = 0;
  
  for (const filePath of files) {
    try {
      const stats = await fs.stat(filePath);
      const relativePath = path.relative(process.cwd(), filePath);
      
      const sha1 = await calculateSHA1(filePath);
      const loc = await calculateLOC(filePath);
      
      const fileInfo = {
        path: relativePath.replace(/\\/g, '/'), // Normalizar separadores para cross-platform
        size: stats.size,
        sha1: sha1,
        loc: loc
      };
      
      snapshot.files.push(fileInfo);
      
      processed++;
      if (processed % 100 === 0) {
        console.error(`⏳ Procesados ${processed}/${files.length} archivos...`);
      }
      
    } catch (error) {
      console.error(`❌ Error procesando ${filePath}:`, error.message);
    }
  }
  
  // Ordenar archivos por path para consistencia
  snapshot.files.sort((a, b) => a.path.localeCompare(b.path));
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.error(`✅ Snapshot completado en ${duration}s`);
  console.error(`📊 Total: ${snapshot.files.length} archivos procesados`);
  
  // Estadísticas adicionales
  const withLOC = snapshot.files.filter(f => f.loc !== null).length;
  const totalLOC = snapshot.files
    .filter(f => f.loc !== null)
    .reduce((sum, f) => sum + f.loc.nonEmpty, 0);
  
  console.error(`📝 Archivos de texto: ${withLOC}`);
  console.error(`📏 Total LOC (no vacías): ${totalLOC.toLocaleString()}`);
  
  return snapshot;
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const snapshot = await createSnapshot();
    console.log(JSON.stringify(snapshot, null, 2));
  } catch (error) {
    console.error('❌ Error creando snapshot:', error);
    process.exit(1);
  }
}

export { createSnapshot };
