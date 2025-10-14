const fs = require('fs');
const path = require('path');

const DYNAMIC_EXPORT = `
// Marcar esta ruta como dinámica para evitar errores de build
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
`;

function addDynamicExport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has dynamic export
    if (content.includes('export const dynamic')) {
      return { status: 'skipped', reason: 'already has dynamic export' };
    }
    
    // Skip if doesn't use createClient()
    if (!content.includes('createClient()')) {
      return { status: 'skipped', reason: 'does not use createClient()' };
    }
    
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex === -1) {
      return { status: 'error', reason: 'no imports found' };
    }
    
    // Insert dynamic export after last import
    lines.splice(lastImportIndex + 1, 0, DYNAMIC_EXPORT);
    
    // Write back
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    
    return { status: 'fixed' };
  } catch (error) {
    return { status: 'error', reason: error.message };
  }
}

function findRouteFiles(dir) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`🔍 Found ${routeFiles.length} route files\n`);

const results = {
  fixed: 0,
  skipped: 0,
  errors: 0
};

for (const file of routeFiles) {
  const relativePath = path.relative(process.cwd(), file);
  const result = addDynamicExport(file);
  
  if (result.status === 'fixed') {
    console.log(`✅ Fixed: ${relativePath}`);
    results.fixed++;
  } else if (result.status === 'skipped') {
    results.skipped++;
  } else {
    console.log(`❌ Error in ${relativePath}: ${result.reason}`);
    results.errors++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`  ✅ Fixed: ${results.fixed}`);
console.log(`  ⏭️  Skipped: ${results.skipped}`);
console.log(`  ❌ Errors: ${results.errors}`);
