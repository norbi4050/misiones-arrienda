/**
 * 🖼️ SCRIPT DE MIGRACIÓN DE IMÁGENES A SUPABASE STORAGE
 * 
 * Migra imágenes Base64 almacenadas en la base de datos a Supabase Storage
 * FASE 2: OPTIMIZACIÓN DE RENDIMIENTO
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Estadísticas de migración
const stats = {
  totalProperties: 0,
  propertiesProcessed: 0,
  imagesProcessed: 0,
  imagesMigrated: 0,
  errors: [],
  startTime: new Date(),
  endTime: null
};

/**
 * Convierte Base64 a Buffer
 */
function base64ToBuffer(base64String) {
  try {
    // Remover el prefijo data:image/...;base64, si existe
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    throw new Error(`Error convirtiendo Base64: ${error.message}`);
  }
}

/**
 * Detecta el tipo MIME de la imagen desde Base64
 */
function getMimeTypeFromBase64(base64String) {
  const mimeMatch = base64String.match(/^data:image\/([a-z]+);base64,/);
  if (mimeMatch) {
    return `image/${mimeMatch[1]}`;
  }
  return 'image/jpeg'; // Default
}

/**
 * Genera nombre único para el archivo
 */
function generateUniqueFileName(userId, propertyId, index, mimeType) {
  const extension = mimeType.split('/')[1] || 'jpg';
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  return `${userId}/${propertyId}/image_${index}_${timestamp}_${hash}.${extension}`;
}

/**
 * Sube imagen a Supabase Storage
 */
async function uploadImageToStorage(imageBuffer, fileName, mimeType) {
  try {
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Generar URL pública
    const { data: publicUrlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    throw new Error(`Error subiendo imagen: ${error.message}`);
  }
}

/**
 * Procesa una propiedad individual
 */
async function processProperty(property) {
  console.log(`\n📋 Procesando propiedad: ${property.id} (${property.title})`);
  
  if (!property.images || !Array.isArray(property.images)) {
    console.log('   ⚠️  No hay imágenes para procesar');
    return property;
  }

  const newImageUrls = [];
  let imageIndex = 0;

  for (const imageData of property.images) {
    imageIndex++;
    stats.imagesProcessed++;

    try {
      // Verificar si ya es una URL (ya migrada)
      if (typeof imageData === 'string' && imageData.startsWith('http')) {
        console.log(`   ✅ Imagen ${imageIndex} ya migrada: ${imageData.substring(0, 50)}...`);
        newImageUrls.push(imageData);
        continue;
      }

      // Verificar si es Base64
      if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
        console.log(`   🔄 Migrando imagen ${imageIndex}...`);

        // Convertir Base64 a Buffer
        const imageBuffer = base64ToBuffer(imageData);
        const mimeType = getMimeTypeFromBase64(imageData);
        
        // Generar nombre único
        const fileName = generateUniqueFileName(
          property.userId, 
          property.id, 
          imageIndex, 
          mimeType
        );

        // Subir a Storage
        const publicUrl = await uploadImageToStorage(imageBuffer, fileName, mimeType);
        
        newImageUrls.push(publicUrl);
        stats.imagesMigrated++;
        
        console.log(`   ✅ Imagen ${imageIndex} migrada: ${fileName}`);
      } else {
        console.log(`   ⚠️  Imagen ${imageIndex} tiene formato desconocido, manteniendo original`);
        newImageUrls.push(imageData);
      }
    } catch (error) {
      console.error(`   ❌ Error procesando imagen ${imageIndex}: ${error.message}`);
      stats.errors.push({
        propertyId: property.id,
        imageIndex,
        error: error.message
      });
      
      // Mantener imagen original en caso de error
      newImageUrls.push(imageData);
    }
  }

  // Actualizar propiedad con nuevas URLs
  try {
    const { error } = await supabase
      .from('Property')
      .update({ images: newImageUrls })
      .eq('id', property.id);

    if (error) {
      throw error;
    }

    console.log(`   ✅ Propiedad actualizada con ${newImageUrls.length} imágenes`);
    stats.propertiesProcessed++;
    
    return { ...property, images: newImageUrls };
  } catch (error) {
    console.error(`   ❌ Error actualizando propiedad: ${error.message}`);
    stats.errors.push({
      propertyId: property.id,
      error: `Error actualizando BD: ${error.message}`
    });
    return property;
  }
}

/**
 * Función principal de migración
 */
async function migrateImages() {
  console.log('🚀 INICIANDO MIGRACIÓN DE IMÁGENES A SUPABASE STORAGE');
  console.log('=' .repeat(60));

  try {
    // 1. Obtener todas las propiedades con imágenes
    console.log('📊 Obteniendo propiedades de la base de datos...');
    
    const { data: properties, error } = await supabase
      .from('Property')
      .select('id, title, userId, images')
      .not('images', 'is', null);

    if (error) {
      throw new Error(`Error obteniendo propiedades: ${error.message}`);
    }

    stats.totalProperties = properties.length;
    console.log(`📋 Encontradas ${stats.totalProperties} propiedades con imágenes`);

    if (stats.totalProperties === 0) {
      console.log('✅ No hay propiedades para migrar');
      return;
    }

    // 2. Procesar cada propiedad
    console.log('\n🔄 Iniciando procesamiento de propiedades...');
    
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      console.log(`\n[${i + 1}/${properties.length}] Procesando propiedad ${property.id}`);
      
      await processProperty(property);
      
      // Pausa pequeña para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 3. Mostrar estadísticas finales
    stats.endTime = new Date();
    const duration = (stats.endTime - stats.startTime) / 1000;

    console.log('\n' + '=' .repeat(60));
    console.log('📊 MIGRACIÓN COMPLETADA - ESTADÍSTICAS FINALES');
    console.log('=' .repeat(60));
    console.log(`⏱️  Duración: ${duration.toFixed(2)} segundos`);
    console.log(`📋 Propiedades totales: ${stats.totalProperties}`);
    console.log(`✅ Propiedades procesadas: ${stats.propertiesProcessed}`);
    console.log(`🖼️  Imágenes procesadas: ${stats.imagesProcessed}`);
    console.log(`📤 Imágenes migradas: ${stats.imagesMigrated}`);
    console.log(`❌ Errores: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. Propiedad ${error.propertyId}: ${error.error}`);
      });
    }

    // 4. Generar reporte
    const reportPath = path.join(__dirname, '..', 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);

    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LA MIGRACIÓN:');
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Función para verificar el estado de la migración
 */
async function checkMigrationStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE LA MIGRACIÓN');
  console.log('=' .repeat(50));

  try {
    const { data: properties, error } = await supabase
      .from('Property')
      .select('id, title, images')
      .not('images', 'is', null);

    if (error) {
      throw error;
    }

    let totalImages = 0;
    let base64Images = 0;
    let urlImages = 0;

    properties.forEach(property => {
      if (Array.isArray(property.images)) {
        property.images.forEach(image => {
          totalImages++;
          if (typeof image === 'string') {
            if (image.startsWith('data:image/')) {
              base64Images++;
            } else if (image.startsWith('http')) {
              urlImages++;
            }
          }
        });
      }
    });

    console.log(`📊 Propiedades: ${properties.length}`);
    console.log(`🖼️  Total imágenes: ${totalImages}`);
    console.log(`📤 Imágenes migradas (URL): ${urlImages}`);
    console.log(`📥 Imágenes pendientes (Base64): ${base64Images}`);
    console.log(`📈 Progreso: ${((urlImages / totalImages) * 100).toFixed(1)}%`);

    if (base64Images === 0) {
      console.log('✅ ¡Todas las imágenes han sido migradas!');
    } else {
      console.log(`⚠️  Quedan ${base64Images} imágenes por migrar`);
    }

  } catch (error) {
    console.error('❌ Error verificando estado:', error.message);
  }
}

// Ejecutar según argumentos de línea de comandos
const command = process.argv[2];

if (command === 'check') {
  checkMigrationStatus();
} else if (command === 'migrate') {
  migrateImages();
} else {
  console.log('📖 USO DEL SCRIPT:');
  console.log('  node migrate-images-to-storage.js check   - Verificar estado');
  console.log('  node migrate-images-to-storage.js migrate - Ejecutar migración');
}
