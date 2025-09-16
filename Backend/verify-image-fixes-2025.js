#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando correcciones de imágenes...');

const filesToCheck = [
  'src/app/comunidad/page.tsx',
  'src/components/ImageCarousel.tsx',
  'src/components/property-card.tsx',
  'src/app/property/[id]/property-detail-client.tsx',
  'src/app/properties/[id]/PropertyDetailClient.tsx'
];

let issuesFound = 0;

filesToCheck.forEach(relativePath => {
  const fullPath = path.join(__dirname, relativePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Buscar Image components con fill pero sin sizes
    const imageWithFillRegex = /<Image[^>]*fill[^>]*>/g;
    const matches = content.match(imageWithFillRegex) || [];
    
    matches.forEach(match => {
      if (!match.includes('sizes=')) {
        console.log(`❌ ${relativePath}: Image con fill sin sizes prop`);
        console.log(`   ${match.substring(0, 100)}...`);
        issuesFound++;
      }
    });
  }
});

if (issuesFound === 0) {
  console.log('✅ No se encontraron problemas de imágenes');
} else {
  console.log(`⚠️ Se encontraron ${issuesFound} problemas`);
}
