/**
 * AUDITORÍA COMPLETA DE VARIABLES DE ENTORNO
 * ==========================================
 * 
 * Script para identificar qué variables de entorno se utilizan realmente
 * en el proyecto y cuáles se pueden eliminar
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO AUDITORÍA DE VARIABLES DE ENTORNO...\n');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SEARCH_DIRECTORIES = [
  'Backend/src',
  'Backend/prisma',
  'Backend/supabase',
  'Backend'
];

const ENV_FILES = [
  'Backend/.env',
  'Backend/.env.local',
  'Backend/.env.example',
  'Backend/.env.development',
  'Backend/.env.production'
];

const VARIABLES_ENCONTRADAS = new Set();
const ARCHIVOS_ANALIZADOS = [];
const VARIABLES_DEFINIDAS = new Set();

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

function buscarEnArchivo(rutaArchivo, contenido) {
  const variablesEncontradas = [];
  
  // Buscar process.env.VARIABLE_NAME
  const regexProcessEnv = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  let match;
  
  while ((match = regexProcessEnv.exec(contenido)) !== null) {
    const variable = match[1];
    variablesEncontradas.push(variable);
    VARIABLES_ENCONTRADAS.add(variable);
  }
  
  return variablesEncontradas;
}

function analizarDirectorio(directorio) {
  try {
    if (!fs.existsSync(directorio)) {
      console.log(`⚠️ Directorio no existe: ${directorio}`);
      return;
    }
    
    const archivos = fs.readdirSync(directorio, { withFileTypes: true });
    
    for (const archivo of archivos) {
      const rutaCompleta = path.join(directorio, archivo.name);
      
      if (archivo.isDirectory()) {
        // Recursivo para subdirectorios
        analizarDirectorio(rutaCompleta);
      } else if (archivo.isFile()) {
        // Solo analizar archivos relevantes
        const extension = path.extname(archivo.name).toLowerCase();
        const extensionesRelevantes = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.prisma'];
        
        if (extensionesRelevantes.includes(extension)) {
          try {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            const variables = buscarEnArchivo(rutaCompleta, contenido);
            
            if (variables.length > 0) {
              ARCHIVOS_ANALIZADOS.push({
                archivo: rutaCompleta,
                variables: variables
              });
            }
          } catch (error) {
            console.log(`⚠️ Error leyendo archivo: ${rutaCompleta}`);
          }
        }
      }
    }
  } catch (error) {
    console.log(`⚠️ Error analizando directorio: ${directorio}`);
  }
}

function analizarArchivosEnv() {
  for (const archivoEnv of ENV_FILES) {
    try {
      if (fs.existsSync(archivoEnv)) {
        console.log(`📄 Analizando: ${archivoEnv}`);
        const contenido = fs.readFileSync(archivoEnv, 'utf8');
        const lineas = contenido.split('\n');
        
        for (const linea of lineas) {
          const lineaTrimmed = linea.trim();
          if (lineaTrimmed && !lineaTrimmed.startsWith('#')) {
            const match = lineaTrimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
            if (match) {
              VARIABLES_DEFINIDAS.add(match[1]);
            }
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Error leyendo archivo env: ${archivoEnv}`);
    }
  }
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

console.log('📁 Analizando directorios...');
for (const directorio of SEARCH_DIRECTORIES) {
  console.log(`   Analizando: ${directorio}`);
  analizarDirectorio(directorio);
}

console.log('\n📄 Analizando archivos .env...');
analizarArchivosEnv();

// ============================================================================
// RESULTADOS
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 RESULTADOS DE LA AUDITORÍA');
console.log('='.repeat(60));

console.log(`\n🔍 VARIABLES UTILIZADAS EN EL CÓDIGO (${VARIABLES_ENCONTRADAS.size}):`);
const variablesUtilizadas = Array.from(VARIABLES_ENCONTRADAS).sort();
variablesUtilizadas.forEach(variable => {
  console.log(`   ✅ ${variable}`);
});

console.log(`\n📄 VARIABLES DEFINIDAS EN .env (${VARIABLES_DEFINIDAS.size}):`);
const variablesDefinidas = Array.from(VARIABLES_DEFINIDAS).sort();
variablesDefinidas.forEach(variable => {
  console.log(`   📝 ${variable}`);
});

// Identificar variables no utilizadas
const variablesNoUtilizadas = Array.from(VARIABLES_DEFINIDAS).filter(
  variable => !VARIABLES_ENCONTRADAS.has(variable)
);

console.log(`\n❌ VARIABLES NO UTILIZADAS (${variablesNoUtilizadas.length}):`);
if (variablesNoUtilizadas.length > 0) {
  variablesNoUtilizadas.forEach(variable => {
    console.log(`   🗑️ ${variable} - PUEDE SER ELIMINADA`);
  });
} else {
  console.log('   ✅ Todas las variables definidas están siendo utilizadas');
}

// Identificar variables utilizadas pero no definidas
const variablesNoDefinidas = Array.from(VARIABLES_ENCONTRADAS).filter(
  variable => !VARIABLES_DEFINIDAS.has(variable)
);

console.log(`\n⚠️ VARIABLES UTILIZADAS PERO NO DEFINIDAS (${variablesNoDefinidas.length}):`);
if (variablesNoDefinidas.length > 0) {
  variablesNoDefinidas.forEach(variable => {
    console.log(`   ⚠️ ${variable} - NECESITA SER DEFINIDA`);
  });
} else {
  console.log('   ✅ Todas las variables utilizadas están definidas');
}

// ============================================================================
// DETALLES POR ARCHIVO
// ============================================================================

console.log(`\n📋 DETALLES POR ARCHIVO (${ARCHIVOS_ANALIZADOS.length} archivos):`);
ARCHIVOS_ANALIZADOS.forEach(item => {
  console.log(`\n📄 ${item.archivo}:`);
  item.variables.forEach(variable => {
    const estado = VARIABLES_DEFINIDAS.has(variable) ? '✅' : '⚠️';
    console.log(`   ${estado} ${variable}`);
  });
});

// ============================================================================
// RECOMENDACIONES
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('💡 RECOMENDACIONES');
console.log('='.repeat(60));

if (variablesNoUtilizadas.length > 0) {
  console.log('\n🗑️ VARIABLES A ELIMINAR:');
  console.log('   Las siguientes variables pueden ser eliminadas de los archivos .env:');
  variablesNoUtilizadas.forEach(variable => {
    console.log(`   - ${variable}`);
  });
}

if (variablesNoDefinidas.length > 0) {
  console.log('\n⚠️ VARIABLES A DEFINIR:');
  console.log('   Las siguientes variables necesitan ser definidas en .env:');
  variablesNoDefinidas.forEach(variable => {
    console.log(`   - ${variable}=valor_aqui`);
  });
}

// Variables críticas de Supabase
const variablesSupabaseCriticas = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('\n🔐 VARIABLES CRÍTICAS DE SUPABASE:');
variablesSupabaseCriticas.forEach(variable => {
  const utilizada = VARIABLES_ENCONTRADAS.has(variable);
  const definida = VARIABLES_DEFINIDAS.has(variable);
  const estado = utilizada && definida ? '✅' : '❌';
  console.log(`   ${estado} ${variable} - ${utilizada ? 'Utilizada' : 'No utilizada'} / ${definida ? 'Definida' : 'No definida'}`);
});

console.log('\n' + '='.repeat(60));
console.log(`✨ Auditoría completada - ${new Date().toLocaleString()}`);
console.log('='.repeat(60));
