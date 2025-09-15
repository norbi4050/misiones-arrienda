/**
 * Script para limpiar archivos duplicados y obsoletos en el proyecto
 * Busca archivos con sufijos como -fixed, -backup, -original y los elimina
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const duplicatePatterns = [
  /-fixed\./,
  /-backup\./,
  /-original\./,
  /\.backup-/,
  /\.temp\./,
  /\.old\./,
  /copy\./,
  /duplicate\./
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function isDuplicate(filePath) {
  return duplicatePatterns.some(pattern => pattern.test(filePath));
}

function cleanup() {
  const allFiles = walkDir(rootDir);
  const duplicates = allFiles.filter(isDuplicate);

  duplicates.forEach(file => {
    try {
      fs.unlinkSync(file);
      console.log(`Deleted duplicate file: ${file}`);
    } catch (err) {
      console.error(`Failed to delete file ${file}: ${err.message}`);
    }
  });

  console.log(`Cleanup complete. ${duplicates.length} files deleted.`);
}

cleanup();
