#!/usr/bin/env node

/**
 * Script para agregar export const dynamic = 'force-dynamic' 
 * a todas las rutas API que usan cookies o request.url
 */

const fs = require('fs');
const path = require('path');

const ROUTES_TO_FIX = [
  // Rutas críticas de usuarios y autenticación
  'src/app/api/users/status/route.ts',
  'src/app/api/users/avatar/route.ts',
  'src/app/api/users/profile/route.ts',
  
  // Rutas de mensajes
  'src/app/api/messages/unread-count/route.ts',
  'src/app/api/messages/unified/route.ts',
  'src/app/api/messages/threads/route.ts',
  'src/app/api/messages/threads/[id]/route.ts',
  'src/app/api/messages/threads/[id]/delete/route.ts',
  
  // Rutas de salud y sistema
  'src/app/api/health-db/route.ts',
  
  // Rutas de comunidad
  'src/app/api/comunidad/messages/unread-count/route.ts',
  'src/app/api/comunidad/messages/route.ts',
  'src/app/api/comunidad/my-posts/route.ts',
  
  // Rutas dev
  'src/app/api/dev/analytics-smoketest/route.ts',
  'src/app/api/dev/test-presence-system/route.ts',
  'src/app/api/dev/test-displayname-resolution/route.ts',
  
  // Rutas debug con cookies
  'src/app/api/debug-user-agency-check/route.ts',
  'src/app/api/debug-thread-header/route.ts',
  'src/app/api/debug-displayname-issue/route.ts',
  'src/app/api/debug-my-user-type/route.ts',
  'src/app/api/debug-messages-threads/route.ts',
  'src/app/api/debug-messages-schema-complete/route.ts',
  'src/app/api/debug-properties-response/route.ts',
  'src/app/api/debug-inmobiliaria-feed-audit/route.ts',
  'src/app/api/debug-comunidad-posts/route.ts',
  'src/app/api/debug-favorites-issue/route.ts',
  'src/app/api/debug-conversations-schema/route.ts',
  'src/app/api/debug-chat-bubbles/route.ts',
  'src/app/api/debug-avatar-inmobiliaria/route.ts',
  'src/app/api/debug-displayname-live/route.ts',
  
  // Rutas debug con request.url
  'src/app/api/debug-inmobiliaria-mezcla-actual/route.ts',
  'src/app/api/debug-inmobiliaria-properties-detail/route.ts',
  'src/app/api/debug-inmobiliaria-properties/route.ts',
  'src/app/api/debug-inmobiliaria-images/route.ts',
  'src/app/api/debug-commercial-phone/route.ts',
  'src/app/api/debug-conversation-avatars/route.ts',
  
  // Sitemap
  'src/app/sitemap.ts'
];

function addDynamicExport(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificar si ya tiene el export
  if (content.includes('export const dynamic')) {
    console.log(`✓ Ya tiene dynamic export: ${filePath}`);
    return false;
  }
  
  // Buscar la primera línea de import
  const lines = content.split('\n');
  let insertIndex = 0;
  let foundImport = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Saltar comentarios y líneas vacías al inicio
    if (line.startsWith('//') || line.startsWith('/*') || line === '') {
      continue;
    }
    
    // Si encontramos un import, insertamos antes
    if (line.startsWith('import ')) {
      insertIndex = i;
      foundImport = true;
      break;
    }
    
    // Si encontramos código (export function, etc), insertamos aquí
    if (line.startsWith('export ') || line.startsWith('function ')) {
      insertIndex = i;
      break;
    }
  }
  
  // Insertar el export dynamic
  const dynamicExport = [
    '// Force dynamic rendering for Vercel',
    "export const dynamic = 'force-dynamic'",
    ''
  ];
  
  lines.splice(insertIndex, 0, ...dynamicExport);
  
  // Escribir el archivo
  fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
  
  console.log(`✅ Fixed: ${filePath}`);
  return true;
}

console.log('🔧 Iniciando fix de errores de build de Vercel...\n');

let fixed = 0;
let skipped = 0;

for (const route of ROUTES_TO_FIX) {
  if (addDynamicExport(route)) {
    fixed++;
  } else {
    skipped++;
  }
}

console.log('\n📊 Resumen:');
console.log(`  ✅ Archivos modificados: ${fixed}`);
console.log(`  ⏭️  Archivos omitidos: ${skipped}`);
console.log('\n✨ Fix de rutas API completado!');
