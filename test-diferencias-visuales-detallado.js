const puppeteer = require('puppeteer');

console.log('🔍 ANÁLISIS DETALLADO DE DIFERENCIAS VISUALES');
console.log('='.repeat(80));
console.log('📍 Comparando imágenes y elementos visuales específicos');
console.log('🌐 Localhost vs Producción');
console.log('='.repeat(80));

async function analizarDiferenciasVisuales() {
  let browser;
  
  try {
    console.log('🚀 Lanzando navegador...');
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const resultados = {
      localhost: {
        imagenes: [],
        estilos: {},
        elementos: {},
        errores: []
      },
      produccion: {
        imagenes: [],
        estilos: {},
        elementos: {},
        errores: []
      }
    };
    
    console.log('\n📍 FASE 1: ANÁLISIS DETALLADO LOCALHOST');
    console.log('-'.repeat(60));
    
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });
      console.log('✅ Localhost cargado');
      
      // Analizar imágenes en localhost
      const imagenesLocalhost = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          className: img.className,
          style: img.getAttribute('style') || ''
        }));
      });
      
      console.log(`🖼️ Localhost - Imágenes encontradas: ${imagenesLocalhost.length}`);
      imagenesLocalhost.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.src}`);
        console.log(`      Alt: "${img.alt}"`);
        console.log(`      Dimensiones: ${img.width}x${img.height}`);
        console.log(`      Cargada: ${img.complete ? '✅' : '❌'}`);
        console.log(`      Clase: ${img.className}`);
      });
      
      resultados.localhost.imagenes = imagenesLocalhost;
      
      // Analizar elementos específicos del hero
      const heroLocalhost = await page.evaluate(() => {
        const hero = document.querySelector('.hero, [class*="hero"], .banner, [class*="banner"]');
        if (hero) {
          return {
            existe: true,
            className: hero.className,
            innerHTML: hero.innerHTML.substring(0, 200) + '...',
            backgroundImage: getComputedStyle(hero).backgroundImage,
            backgroundSize: getComputedStyle(hero).backgroundSize,
            backgroundPosition: getComputedStyle(hero).backgroundPosition
          };
        }
        return { existe: false };
      });
      
      console.log(`🎯 Localhost - Sección Hero: ${heroLocalhost.existe ? '✅ Encontrada' : '❌ No encontrada'}`);
      if (heroLocalhost.existe) {
        console.log(`   Clase: ${heroLocalhost.className}`);
        console.log(`   Background: ${heroLocalhost.backgroundImage}`);
      }
      
      resultados.localhost.elementos.hero = heroLocalhost;
      
      // Analizar propiedades
      const propiedadesLocalhost = await page.evaluate(() => {
        const propCards = Array.from(document.querySelectorAll('.property-card, [class*="property"], .card, [class*="card"]'));
        return propCards.slice(0, 3).map(card => {
          const img = card.querySelector('img');
          return {
            existe: true,
            className: card.className,
            imagen: img ? {
              src: img.src,
              alt: img.alt,
              complete: img.complete
            } : null
          };
        });
      });
      
      console.log(`🏠 Localhost - Tarjetas de propiedades: ${propiedadesLocalhost.length}`);
      propiedadesLocalhost.forEach((prop, index) => {
        if (prop.imagen) {
          console.log(`   ${index + 1}. Imagen: ${prop.imagen.src}`);
          console.log(`      Cargada: ${prop.imagen.complete ? '✅' : '❌'}`);
        }
      });
      
      resultados.localhost.elementos.propiedades = propiedadesLocalhost;
      
    } catch (error) {
      console.log(`❌ Error en localhost: ${error.message}`);
      resultados.localhost.errores.push(error.message);
    }
    
    console.log('\n🌐 FASE 2: ANÁLISIS DETALLADO PRODUCCIÓN');
    console.log('-'.repeat(60));
    
    try {
      await page.goto('https://www.misionesarrienda.com.ar', { waitUntil: 'networkidle2', timeout: 15000 });
      console.log('✅ Producción cargada');
      
      // Analizar imágenes en producción
      const imagenesProduccion = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          className: img.className,
          style: img.getAttribute('style') || ''
        }));
      });
      
      console.log(`🖼️ Producción - Imágenes encontradas: ${imagenesProduccion.length}`);
      imagenesProduccion.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.src}`);
        console.log(`      Alt: "${img.alt}"`);
        console.log(`      Dimensiones: ${img.width}x${img.height}`);
        console.log(`      Cargada: ${img.complete ? '✅' : '❌'}`);
        console.log(`      Clase: ${img.className}`);
      });
      
      resultados.produccion.imagenes = imagenesProduccion;
      
      // Analizar elementos específicos del hero
      const heroProduccion = await page.evaluate(() => {
        const hero = document.querySelector('.hero, [class*="hero"], .banner, [class*="banner"]');
        if (hero) {
          return {
            existe: true,
            className: hero.className,
            innerHTML: hero.innerHTML.substring(0, 200) + '...',
            backgroundImage: getComputedStyle(hero).backgroundImage,
            backgroundSize: getComputedStyle(hero).backgroundSize,
            backgroundPosition: getComputedStyle(hero).backgroundPosition
          };
        }
        return { existe: false };
      });
      
      console.log(`🎯 Producción - Sección Hero: ${heroProduccion.existe ? '✅ Encontrada' : '❌ No encontrada'}`);
      if (heroProduccion.existe) {
        console.log(`   Clase: ${heroProduccion.className}`);
        console.log(`   Background: ${heroProduccion.backgroundImage}`);
      }
      
      resultados.produccion.elementos.hero = heroProduccion;
      
      // Analizar propiedades
      const propiedadesProduccion = await page.evaluate(() => {
        const propCards = Array.from(document.querySelectorAll('.property-card, [class*="property"], .card, [class*="card"]'));
        return propCards.slice(0, 3).map(card => {
          const img = card.querySelector('img');
          return {
            existe: true,
            className: card.className,
            imagen: img ? {
              src: img.src,
              alt: img.alt,
              complete: img.complete
            } : null
          };
        });
      });
      
      console.log(`🏠 Producción - Tarjetas de propiedades: ${propiedadesProduccion.length}`);
      propiedadesProduccion.forEach((prop, index) => {
        if (prop.imagen) {
          console.log(`   ${index + 1}. Imagen: ${prop.imagen.src}`);
          console.log(`      Cargada: ${prop.imagen.complete ? '✅' : '❌'}`);
        }
      });
      
      resultados.produccion.elementos.propiedades = propiedadesProduccion;
      
    } catch (error) {
      console.log(`❌ Error en producción: ${error.message}`);
      resultados.produccion.errores.push(error.message);
    }
    
    console.log('\n📊 FASE 3: COMPARACIÓN DETALLADA DE DIFERENCIAS');
    console.log('-'.repeat(60));
    
    // Comparar cantidad de imágenes
    console.log('🖼️ COMPARACIÓN DE IMÁGENES:');
    console.log(`   Localhost: ${resultados.localhost.imagenes.length} imágenes`);
    console.log(`   Producción: ${resultados.produccion.imagenes.length} imágenes`);
    
    if (resultados.localhost.imagenes.length !== resultados.produccion.imagenes.length) {
      console.log('   ⚠️ DIFERENCIA: Cantidad de imágenes diferente');
    }
    
    // Comparar URLs de imágenes
    console.log('\n🔗 COMPARACIÓN DE URLs DE IMÁGENES:');
    const urlsLocalhost = resultados.localhost.imagenes.map(img => img.src);
    const urlsProduccion = resultados.produccion.imagenes.map(img => img.src);
    
    const diferenciasUrls = [];
    
    // Verificar imágenes que están en localhost pero no en producción
    urlsLocalhost.forEach((url, index) => {
      const urlBase = url.replace('http://localhost:3000', '').replace('https://www.misionesarrienda.com.ar', '');
      const existeEnProduccion = urlsProduccion.some(prodUrl => 
        prodUrl.replace('https://www.misionesarrienda.com.ar', '') === urlBase
      );
      
      if (!existeEnProduccion) {
        diferenciasUrls.push({
          tipo: 'Solo en localhost',
          url: url,
          index: index
        });
      }
    });
    
    // Verificar imágenes que están en producción pero no en localhost
    urlsProduccion.forEach((url, index) => {
      const urlBase = url.replace('https://www.misionesarrienda.com.ar', '').replace('http://localhost:3000', '');
      const existeEnLocalhost = urlsLocalhost.some(localUrl => 
        localUrl.replace('http://localhost:3000', '') === urlBase
      );
      
      if (!existeEnLocalhost) {
        diferenciasUrls.push({
          tipo: 'Solo en producción',
          url: url,
          index: index
        });
      }
    });
    
    if (diferenciasUrls.length > 0) {
      console.log('   ⚠️ DIFERENCIAS ENCONTRADAS:');
      diferenciasUrls.forEach(diff => {
        console.log(`   ${diff.tipo}: ${diff.url}`);
      });
    } else {
      console.log('   ✅ URLs de imágenes coinciden');
    }
    
    // Comparar estado de carga de imágenes
    console.log('\n📥 COMPARACIÓN DE CARGA DE IMÁGENES:');
    const imagenesRotasLocalhost = resultados.localhost.imagenes.filter(img => !img.complete);
    const imagenesRotasProduccion = resultados.produccion.imagenes.filter(img => !img.complete);
    
    console.log(`   Localhost - Imágenes no cargadas: ${imagenesRotasLocalhost.length}`);
    imagenesRotasLocalhost.forEach(img => {
      console.log(`     ❌ ${img.src}`);
    });
    
    console.log(`   Producción - Imágenes no cargadas: ${imagenesRotasProduccion.length}`);
    imagenesRotasProduccion.forEach(img => {
      console.log(`     ❌ ${img.src}`);
    });
    
    console.log('\n🎯 FASE 4: DIAGNÓSTICO DE PROBLEMAS');
    console.log('-'.repeat(60));
    
    if (diferenciasUrls.length > 0 || imagenesRotasLocalhost.length > 0 || imagenesRotasProduccion.length > 0) {
      console.log('❌ PROBLEMAS DETECTADOS:');
      
      if (diferenciasUrls.length > 0) {
        console.log('   🔸 Imágenes diferentes entre entornos');
      }
      
      if (imagenesRotasLocalhost.length > 0) {
        console.log('   🔸 Imágenes rotas en localhost');
      }
      
      if (imagenesRotasProduccion.length > 0) {
        console.log('   🔸 Imágenes rotas en producción');
      }
      
      console.log('\n💡 POSIBLES CAUSAS:');
      console.log('   • Cache del navegador desactualizado en localhost');
      console.log('   • Archivos de imagen no sincronizados');
      console.log('   • Diferencias en el build de desarrollo vs producción');
      console.log('   • Problemas de rutas de imágenes');
      
      console.log('\n🔧 RECOMENDACIONES:');
      console.log('   1. Limpiar cache del navegador');
      console.log('   2. Reiniciar servidor de desarrollo');
      console.log('   3. Verificar que las imágenes estén en public/');
      console.log('   4. Comparar archivos de imagen entre entornos');
      
    } else {
      console.log('✅ No se detectaron problemas significativos');
    }
    
    console.log('\n✅ ANÁLISIS COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar análisis
analizarDiferenciasVisuales().then(() => {
  console.log('\n🏁 Análisis de diferencias visuales finalizado');
}).catch(error => {
  console.error('💥 Error fatal:', error);
});
