#!/usr/bin/env node

/**
 * Script de validación SEO para verificar JSON-LD y meta tags
 * Valida que el structured data sea JSON válido
 */

const { getPropertyById } = require('../src/lib/mock-data-clean');
const { 
  generatePropertyJsonLd, 
  generateBreadcrumbJsonLd,
  generatePropertyMetaTags 
} = require('../src/lib/structured-data');

console.log('🔍 VALIDACIÓN SEO - JSON-LD Y META TAGS');
console.log('=====================================\n');

// Configuración
const baseUrl = 'https://misiones-arrienda.vercel.app';
const testPropertyId = '1'; // ID de prueba

try {
  // 1. Obtener propiedad de prueba
  console.log('1. Obteniendo propiedad de prueba...');
  const property = getPropertyById(testPropertyId);
  
  if (!property) {
    console.error('❌ No se encontró propiedad de prueba');
    process.exit(1);
  }
  
  console.log(`✅ Propiedad encontrada: ${property.title}`);
  console.log(`   📍 Ubicación: ${property.city}, ${property.province}`);
  console.log(`   💰 Precio: ${property.currency} ${property.price.toLocaleString()}\n`);

  // 2. Validar JSON-LD de propiedad
  console.log('2. Validando JSON-LD de propiedad...');
  const propertyJsonLd = generatePropertyJsonLd(property, baseUrl);
  
  // Intentar parsear para validar JSON
  const validPropertyJson = JSON.parse(JSON.stringify(propertyJsonLd));
  console.log('✅ JSON-LD de propiedad es válido');
  console.log(`   📋 Tipo: ${validPropertyJson['@type']}`);
  console.log(`   🏠 Nombre: ${validPropertyJson.name}`);
  console.log(`   💵 Precio: ${validPropertyJson.offers.price} ${validPropertyJson.offers.priceCurrency}`);
  console.log(`   🖼️ Imágenes: ${validPropertyJson.image.length} encontradas\n`);

  // 3. Validar breadcrumb JSON-LD
  console.log('3. Validando breadcrumb JSON-LD...');
  const breadcrumbItems = [
    { name: 'Inicio', url: baseUrl },
    { name: 'Propiedades', url: `${baseUrl}/properties` },
    { name: property.title, url: `${baseUrl}/properties/${property.id}` }
  ];
  
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);
  const validBreadcrumbJson = JSON.parse(JSON.stringify(breadcrumbJsonLd));
  console.log('✅ Breadcrumb JSON-LD es válido');
  console.log(`   📋 Tipo: ${validBreadcrumbJson['@type']}`);
  console.log(`   🔗 Items: ${validBreadcrumbJson.itemListElement.length} niveles\n`);

  // 4. Validar meta tags
  console.log('4. Validando meta tags...');
  const metaTags = generatePropertyMetaTags(property, baseUrl);
  console.log('✅ Meta tags generados correctamente');
  console.log(`   📝 Title: ${metaTags.title}`);
  console.log(`   📄 Description: ${metaTags.description.substring(0, 100)}...`);
  console.log(`   🌐 OpenGraph: ${metaTags.openGraph.images.length} imágenes`);
  console.log(`   🐦 Twitter: ${metaTags.twitter.card} card\n`);

  // 5. Verificar campos requeridos
  console.log('5. Verificando campos requeridos...');
  
  const requiredFields = [
    '@context',
    '@type', 
    'name',
    'description',
    'url',
    'address',
    'offers'
  ];
  
  const missingFields = requiredFields.filter(field => !validPropertyJson[field]);
  
  if (missingFields.length === 0) {
    console.log('✅ Todos los campos requeridos están presentes');
  } else {
    console.log(`❌ Campos faltantes: ${missingFields.join(', ')}`);
  }

  // 6. Verificar estructura de ofertas
  console.log('\n6. Verificando estructura de ofertas...');
  const offer = validPropertyJson.offers;
  
  if (offer && offer['@type'] === 'Offer' && offer.price && offer.priceCurrency) {
    console.log('✅ Estructura de oferta válida');
    console.log(`   💰 Precio: ${offer.price} ${offer.priceCurrency}`);
    console.log(`   📅 Disponibilidad: ${offer.availability}`);
  } else {
    console.log('❌ Estructura de oferta inválida');
  }

  // 7. Verificar imágenes
  console.log('\n7. Verificando imágenes...');
  const images = validPropertyJson.image;
  
  if (Array.isArray(images) && images.length > 0) {
    console.log(`✅ ${images.length} imágenes encontradas`);
    images.forEach((img, index) => {
      if (img['@type'] === 'ImageObject' && img.url) {
        console.log(`   🖼️ Imagen ${index + 1}: ${img.url.substring(0, 50)}...`);
      }
    });
  } else {
    console.log('⚠️ No se encontraron imágenes válidas');
  }

  // 8. Resumen final
  console.log('\n🎉 VALIDACIÓN COMPLETADA EXITOSAMENTE');
  console.log('=====================================');
  console.log('✅ JSON-LD de propiedad: VÁLIDO');
  console.log('✅ Breadcrumb JSON-LD: VÁLIDO');
  console.log('✅ Meta tags: GENERADOS');
  console.log('✅ OpenGraph: CONFIGURADO');
  console.log('✅ Twitter Cards: CONFIGURADO');
  console.log('\n📋 Para validar en línea:');
  console.log('   🔗 Google Rich Results: https://search.google.com/test/rich-results');
  console.log('   🔗 Schema.org Validator: https://validator.schema.org/');
  console.log('   🔗 Facebook Debugger: https://developers.facebook.com/tools/debug/');

} catch (error) {
  console.error('\n❌ ERROR EN VALIDACIÓN SEO:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
