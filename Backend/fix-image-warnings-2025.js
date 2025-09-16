const fs = require('fs');
const path = require('path');

console.log('🖼️ Iniciando corrección de warnings de Next.js Image...');

// Lista de archivos que pueden tener problemas con imágenes
const filesToCheck = [
  'src/app/comunidad/page.tsx',
  'src/components/ImageCarousel.tsx',
  'src/components/property-card.tsx',
  'src/app/property/[id]/property-detail-client.tsx'
];

const fixes = [];

filesToCheck.forEach(relativePath => {
  const filePath = path.join(__dirname, relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Archivo no encontrado: ${relativePath}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;
    
    console.log(`📖 Procesando: ${relativePath}`);
    
    // 1. Buscar Image components con fill pero sin sizes
    const imageWithFillRegex = /<Image[^>]*fill[^>]*(?!sizes=)[^>]*>/g;
    const matches = content.match(imageWithFillRegex);
    
    if (matches) {
      matches.forEach(match => {
        // Si ya tiene sizes, no hacer nada
        if (match.includes('sizes=')) return;
        
        // Agregar sizes prop apropiado
        let newMatch = match;
        
        // Determinar el sizes apropiado basado en el contexto
        let sizesValue = '"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"';
        
        // Para avatares o imágenes pequeñas
        if (match.includes('avatar') || match.includes('profile') || match.includes('w-') && match.includes('h-')) {
          sizesValue = '"(max-width: 768px) 100px, 150px"';
        }
        // Para carruseles o imágenes principales
        else if (match.includes('carousel') || match.includes('main') || match.includes('hero')) {
          sizesValue = '"(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"';
        }
        
        // Insertar sizes antes del último >
        newMatch = match.replace(/(\s*)>$/, `$1sizes=${sizesValue}$1>`);
        
        updatedContent = updatedContent.replace(match, newMatch);
        hasChanges = true;
        
        console.log(`  ✅ Agregado sizes prop a Image component`);
      });
    }
    
    // 2. Reemplazar URLs de Unsplash problemáticas
    const brokenUrls = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    ];
    
    const workingUrls = [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&auto=format'
    ];
    
    brokenUrls.forEach((brokenUrl, index) => {
      if (updatedContent.includes(brokenUrl)) {
        updatedContent = updatedContent.replace(new RegExp(brokenUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), workingUrls[index]);
        hasChanges = true;
        console.log(`  ✅ Reemplazada URL problemática de Unsplash`);
      }
    });
    
    // 3. Agregar manejo de errores mejorado para imágenes
    if (content.includes('<Image') && !content.includes('onError=')) {
      // Buscar Image components sin onError
      const imageWithoutErrorRegex = /<Image(?![^>]*onError=)[^>]*>/g;
      const imagesWithoutError = updatedContent.match(imageWithoutErrorRegex);
      
      if (imagesWithoutError) {
        imagesWithoutError.forEach(match => {
          const newMatch = match.replace(/(\s*)>$/, `$1onError={(e) => { const target = e.target as HTMLImageElement; target.style.display = 'none'; }}$1>`);
          updatedContent = updatedContent.replace(match, newMatch);
          hasChanges = true;
        });
        console.log(`  ✅ Agregado manejo de errores a Image components`);
      }
    }
    
    if (hasChanges) {
      // Crear backup
      const backupPath = filePath + '.backup-' + Date.now();
      fs.writeFileSync(backupPath, content);
      
      // Escribir archivo actualizado
      fs.writeFileSync(filePath, updatedContent);
      
      fixes.push({
        file: relativePath,
        backup: backupPath,
        changes: ['sizes prop agregado', 'URLs corregidas', 'manejo de errores mejorado']
      });
      
      console.log(`  💾 Archivo actualizado: ${relativePath}`);
    } else {
      console.log(`  ✓ No se necesitan cambios en: ${relativePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error procesando ${relativePath}:`, error.message);
  }
});

console.log('\n🎉 Corrección de warnings de imágenes completada!');

if (fixes.length > 0) {
  console.log('\n📋 Archivos modificados:');
  fixes.forEach(fix => {
    console.log(`   📁 ${fix.file}`);
    console.log(`      - Backup: ${fix.backup}`);
    console.log(`      - Cambios: ${fix.changes.join(', ')}`);
  });
} else {
  console.log('\n✓ No se encontraron problemas que corregir');
}

console.log('\n📝 Próximos pasos:');
console.log('   1. Verificar que no haya warnings en la consola del navegador');
console.log('   2. Probar que las imágenes carguen correctamente');
console.log('   3. Revisar la página de perfil del usuario');
