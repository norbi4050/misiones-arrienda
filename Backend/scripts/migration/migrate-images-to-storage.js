/**
 * 🖼️ SCRIPT DE MIGRACIÓN DE IMÁGENES BASE64 A SUPABASE STORAGE
 * 
 * Este script migra todas las imágenes Base64 almacenadas en la base de datos
 * a Supabase Storage para mejorar el rendimiento y reducir el tamaño de la BD.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuración de migración
const BATCH_SIZE = 10; // Procesar 10 imágenes por lote
const MAX_RETRIES = 3;
const DELAY_BETWEEN_BATCHES = 2000; // 2 segundos

// Contadores para estadísticas
let stats = {
  total: 0,
  migrated: 0,
  errors: 0,
  skipped: 0,
  startTime: Date.now()
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
    const format = mimeMatch[1];
    return `image/${format}`;
  }
  return 'image/jpeg'; // Default
}

/**
 * Genera nombre de archivo único
 */
function generateFileName(propertyId, index, mimeType) {
  const extension = mimeType.split('/')[1] || 'jpg';
  const timestamp = Date.now();
  return `${propertyId}/image_${index}_${timestamp}.${extension}`;
}

/**
 * Sube imagen a Supabase Storage
 */
async function uploadImageToStorage(userId, fileName, buffer, mimeType, retries = 0) {
  try {
    const filePath = `${userId}/${fileName}`;
    
    console.log(`📤 Subiendo: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from('properties')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('properties')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`⚠️ Reintentando subida (${retries + 1}/${MAX_RETRIES}): ${fileName}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
      return uploadImageToStorage(userId, fileName, buffer, mimeType, retries + 1);
    }
    throw error;
  }
}

/**
 * Migra imágenes de una propiedad
 */
async function migratePropertyImages(property) {
  try {
    console.log(`\n🏠 Procesando propiedad: ${property.id} (${property.title})`);
    
    const images = property.images || [];
    if (!Array.isArray(images) || images.length === 0) {
      console.log(`⏭️ Sin imágenes para migrar`);
      stats.skipped++;
      return property;
    }

    const migratedImages = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Verificar si ya es una URL (ya migrada)
      if (typeof image === 'string' && (image.startsWith('http') || image.startsWith('/'))) {
        console.log(`✅ Imagen ${i + 1} ya migrada: ${image.substring(0, 50)}...`);
        migratedImages.push(image);
        continue;
      }

      // Verificar si es Base64
      if (typeof image === 'string' && image.startsWith('data:image/')) {
        try {
          const mimeType = getMimeTypeFromBase64(image);
          const buffer = base64ToBuffer(image);
          const fileName = generateFileName(property.id, i + 1, mimeType);
          
          const publicUrl = await uploadImageToStorage(
            property.userId, 
            fileName, 
            buffer, 
            mimeType
          );
          
          migratedImages.push(publicUrl);
          console.log(`✅ Imagen ${i + 1} migrada: ${publicUrl}`);
          
        } catch (error) {
          console.error(`❌ Error migrando imagen ${i + 1}:`, error.message);
          // Mantener la imagen original en caso de error
          migratedImages.push(image);
          stats.errors++;
        }
      } else {
        // Formato no reconocido, mantener original
        console.log(`⚠️ Formato no reconocido para imagen ${i + 1}, manteniendo original`);
        migratedImages.push(image);
      }
    }

    // Actualizar propiedad en la base de datos
    const { error: updateError } = await supabase
      .from('Property')
      .update({ images: migratedImages })
      .eq('id', property.id);

    if (updateError) {
      throw new Error(`Error actualizando propiedad: ${updateError.message}`);
    }

    console.log(`✅ Propiedad ${property.id} actualizada con ${migratedImages.length} imágenes`);
    stats.migrated++;
    
    return { ...property, images: migratedImages };
    
  } catch (error) {
    console.error(`❌ Error procesando propiedad ${property.id}:`, error.message);
    stats.errors++;
    return property;
  }
}

/**
 * Obtiene propiedades con imágenes Base64
 */
async function getPropertiesWithBase64Images(offset = 0, limit = BATCH_SIZE) {
  try {
    const { data, error } = await supabase
      .from('Property')
      .select('id, title, userId, images')
      .not('images', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Filtrar solo propiedades que tienen imágenes Base64
    const propertiesWithBase64 = data.filter(property => {
      if (!property.images || !Array.isArray(property.images)) return false;
      
      return property.images.some(image => 
        typeof image === 'string' && image.startsWith('data:image/')
      );
    });

    return propertiesWithBase64;
  } catch (error) {
    console.error('❌ Error obteniendo propiedades:', error.message);
    return [];
  }
}

/**
 * Función principal de migración
 */
async function migrateAllImages() {
  console.log('🚀 Iniciando migración de imágenes Base64 a Supabase Storage...\n');
  
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`\n📦 Procesando lote ${Math.floor(offset / BATCH_SIZE) + 1} (offset: ${offset})`);
    
    const properties = await getPropertiesWithBase64Images(offset, BATCH_SIZE);
    
    if (properties.length === 0) {
      hasMore = false;
      break;
    }

    stats.total += properties.length;
    
    // Procesar propiedades en paralelo (pero limitado)
    const promises = properties.map(property => migratePropertyImages(property));
    await Promise.all(promises);
    
    offset += BATCH_SIZE;
    
    // Pausa entre lotes para no sobrecargar
    if (hasMore) {
      console.log(`⏳ Pausa de ${DELAY_BETWEEN_BATCHES / 1000}s antes del siguiente lote...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  // Estadísticas finales
  const duration = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  console.log(`⏱️  Duración: ${duration.toFixed(2)} segundos`);
  console.log(`📝 Total procesadas: ${stats.total}`);
  console.log(`✅ Migradas exitosamente: ${stats.migrated}`);
  console.log(`⏭️  Sin cambios: ${stats.skipped}`);
  console.log(`❌ Errores: ${stats.errors}`);
  console.log(`📈 Tasa de éxito: ${((stats.migrated / stats.total) * 100).toFixed(1)}%`);
  
  if (stats.errors > 0) {
    console.log('\n⚠️  Revisa los errores arriba y considera ejecutar el script nuevamente');
  } else {
    console.log('\n🎉 ¡Migración completada exitosamente!');
  }
}

/**
 * Función de limpieza (opcional)
 */
async function cleanupOrphanedFiles() {
  console.log('\n🧹 Ejecutando limpieza de archivos huérfanos...');
  
  try {
    const { error } = await supabase.rpc('cleanup_orphaned_files');
    
    if (error) {
      console.error('❌ Error en limpieza:', error.message);
    } else {
      console.log('✅ Limpieza completada');
    }
  } catch (error) {
    console.error('❌ Error ejecutando limpieza:', error.message);
  }
}

/**
 * Función de verificación post-migración
 */
async function verifyMigration() {
  console.log('\n🔍 Verificando migración...');
  
  try {
    // Contar propiedades con imágenes Base64 restantes
    const { data, error } = await supabase
      .from('Property')
      .select('id, images')
      .not('images', 'is', null);

    if (error) {
      throw error;
    }

    let base64Count = 0;
    let storageCount = 0;
    
    data.forEach(property => {
      if (property.images && Array.isArray(property.images)) {
        property.images.forEach(image => {
          if (typeof image === 'string') {
            if (image.startsWith('data:image/')) {
              base64Count++;
            } else if (image.includes('supabase') || image.startsWith('http')) {
              storageCount++;
            }
          }
        });
      }
    });

    console.log(`📊 Verificación completada:`);
    console.log(`   - Imágenes en Storage: ${storageCount}`);
    console.log(`   - Imágenes Base64 restantes: ${base64Count}`);
    
    if (base64Count === 0) {
      console.log('✅ ¡Todas las imágenes han sido migradas exitosamente!');
    } else {
      console.log(`⚠️  Quedan ${base64Count} imágenes Base64 por migrar`);
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

// Ejecutar migración
if (require.main === module) {
  (async () => {
    try {
      await migrateAllImages();
      await cleanupOrphanedFiles();
      await verifyMigration();
    } catch (error) {
      console.error('❌ Error fatal:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  migrateAllImages,
  cleanupOrphanedFiles,
  verifyMigration
};
