const puppeteer = require('puppeteer');

console.log('🔍 INICIANDO COMPARACIÓN: LOCALHOST vs PRODUCCIÓN');
console.log('='.repeat(80));
console.log('📍 Localhost: http://localhost:3000');
console.log('🌐 Producción: https://www.misionesarrienda.com.ar');
console.log('='.repeat(80));

async function compararSitios() {
  let browser;
  
  try {
    console.log('🚀 Lanzando navegador...');
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Resultados de comparación
    const resultados = {
      localhost: {
        disponible: false,
        navegacion: {},
        errores: [],
        funcionalidades: {}
      },
      produccion: {
        disponible: false,
        navegacion: {},
        errores: [],
        funcionalidades: {}
      }
    };
    
    console.log('\n📍 FASE 1: TESTING LOCALHOST (http://localhost:3000)');
    console.log('-'.repeat(60));
    
    try {
      // Capturar logs de localhost
      const localhostLogs = [];
      page.on('console', msg => {
        localhostLogs.push(`[${msg.type()}] ${msg.text()}`);
      });
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 });
      console.log('✅ Localhost: Sitio cargado exitosamente');
      resultados.localhost.disponible = true;
      
      // Verificar elementos clave en localhost
      const titleLocalhost = await page.title();
      console.log(`📄 Localhost - Título: ${titleLocalhost}`);
      
      // Verificar navegación en localhost
      const navLinksLocalhost = await page.$$eval('nav a', links => 
        links.map(link => ({ text: link.textContent.trim(), href: link.href }))
      );
      console.log(`🔗 Localhost - Enlaces de navegación encontrados: ${navLinksLocalhost.length}`);
      navLinksLocalhost.forEach(link => {
        console.log(`   - ${link.text}: ${link.href}`);
      });
      
      resultados.localhost.navegacion = {
        titulo: titleLocalhost,
        enlaces: navLinksLocalhost,
        logs: localhostLogs
      };
      
      // Probar navegación a Propiedades en localhost
      try {
        await page.click('a[href="/properties"]');
        await page.waitForTimeout(2000);
        const urlAfterClick = page.url();
        console.log(`🔄 Localhost - Navegación a Propiedades: ${urlAfterClick}`);
        resultados.localhost.funcionalidades.navegacionPropiedades = urlAfterClick.includes('/properties');
      } catch (error) {
        console.log(`❌ Localhost - Error navegación Propiedades: ${error.message}`);
        resultados.localhost.errores.push(`Navegación Propiedades: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Localhost: No disponible - ${error.message}`);
      resultados.localhost.errores.push(`Sitio no disponible: ${error.message}`);
    }
    
    console.log('\n🌐 FASE 2: TESTING PRODUCCIÓN (https://www.misionesarrienda.com.ar)');
    console.log('-'.repeat(60));
    
    try {
      // Capturar logs de producción
      const produccionLogs = [];
      page.on('console', msg => {
        produccionLogs.push(`[${msg.type()}] ${msg.text()}`);
      });
      
      await page.goto('https://www.misionesarrienda.com.ar', { waitUntil: 'networkidle2', timeout: 15000 });
      console.log('✅ Producción: Sitio cargado exitosamente');
      resultados.produccion.disponible = true;
      
      // Verificar elementos clave en producción
      const titleProduccion = await page.title();
      console.log(`📄 Producción - Título: ${titleProduccion}`);
      
      // Verificar navegación en producción
      const navLinksProduccion = await page.$$eval('nav a', links => 
        links.map(link => ({ text: link.textContent.trim(), href: link.href }))
      );
      console.log(`🔗 Producción - Enlaces de navegación encontrados: ${navLinksProduccion.length}`);
      navLinksProduccion.forEach(link => {
        console.log(`   - ${link.text}: ${link.href}`);
      });
      
      resultados.produccion.navegacion = {
        titulo: titleProduccion,
        enlaces: navLinksProduccion,
        logs: produccionLogs
      };
      
      // Probar navegación a Propiedades en producción
      try {
        await page.click('a[href="/properties"]');
        await page.waitForTimeout(2000);
        const urlAfterClick = page.url();
        console.log(`🔄 Producción - Navegación a Propiedades: ${urlAfterClick}`);
        resultados.produccion.funcionalidades.navegacionPropiedades = urlAfterClick.includes('/properties');
      } catch (error) {
        console.log(`❌ Producción - Error navegación Propiedades: ${error.message}`);
        resultados.produccion.errores.push(`Navegación Propiedades: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Producción: No disponible - ${error.message}`);
      resultados.produccion.errores.push(`Sitio no disponible: ${error.message}`);
    }
    
    console.log('\n📊 FASE 3: ANÁLISIS COMPARATIVO');
    console.log('-'.repeat(60));
    
    // Comparar disponibilidad
    console.log('🔍 DISPONIBILIDAD:');
    console.log(`   Localhost: ${resultados.localhost.disponible ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);
    console.log(`   Producción: ${resultados.produccion.disponible ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);
    
    // Comparar títulos
    if (resultados.localhost.disponible && resultados.produccion.disponible) {
      console.log('\n🔍 TÍTULOS:');
      console.log(`   Localhost: "${resultados.localhost.navegacion.titulo}"`);
      console.log(`   Producción: "${resultados.produccion.navegacion.titulo}"`);
      
      const titulosIguales = resultados.localhost.navegacion.titulo === resultados.produccion.navegacion.titulo;
      console.log(`   Coinciden: ${titulosIguales ? '✅ SÍ' : '❌ NO'}`);
      
      // Comparar navegación
      console.log('\n🔍 NAVEGACIÓN:');
      console.log(`   Enlaces Localhost: ${resultados.localhost.navegacion.enlaces.length}`);
      console.log(`   Enlaces Producción: ${resultados.produccion.navegacion.enlaces.length}`);
      
      // Comparar funcionalidades
      console.log('\n🔍 FUNCIONALIDADES:');
      console.log(`   Navegación Propiedades Localhost: ${resultados.localhost.funcionalidades.navegacionPropiedades ? '✅ FUNCIONA' : '❌ NO FUNCIONA'}`);
      console.log(`   Navegación Propiedades Producción: ${resultados.produccion.funcionalidades.navegacionPropiedades ? '✅ FUNCIONA' : '❌ NO FUNCIONA'}`);
    }
    
    // Mostrar errores
    console.log('\n🔍 ERRORES DETECTADOS:');
    if (resultados.localhost.errores.length > 0) {
      console.log('   Localhost:');
      resultados.localhost.errores.forEach(error => console.log(`     ❌ ${error}`));
    } else {
      console.log('   Localhost: ✅ Sin errores');
    }
    
    if (resultados.produccion.errores.length > 0) {
      console.log('   Producción:');
      resultados.produccion.errores.forEach(error => console.log(`     ❌ ${error}`));
    } else {
      console.log('   Producción: ✅ Sin errores');
    }
    
    console.log('\n🎯 FASE 4: CONCLUSIONES');
    console.log('-'.repeat(60));
    
    if (resultados.localhost.disponible && resultados.produccion.disponible) {
      console.log('✅ AMBOS SITIOS ESTÁN DISPONIBLES');
      
      // Determinar si hay diferencias significativas
      const diferenciasSignificativas = [];
      
      if (resultados.localhost.navegacion.titulo !== resultados.produccion.navegacion.titulo) {
        diferenciasSignificativas.push('Títulos diferentes');
      }
      
      if (resultados.localhost.navegacion.enlaces.length !== resultados.produccion.navegacion.enlaces.length) {
        diferenciasSignificativas.push('Número de enlaces de navegación diferente');
      }
      
      if (resultados.localhost.funcionalidades.navegacionPropiedades !== resultados.produccion.funcionalidades.navegacionPropiedades) {
        diferenciasSignificativas.push('Funcionalidad de navegación a Propiedades diferente');
      }
      
      if (diferenciasSignificativas.length > 0) {
        console.log('⚠️ DIFERENCIAS ENCONTRADAS:');
        diferenciasSignificativas.forEach(diff => console.log(`   - ${diff}`));
      } else {
        console.log('✅ SITIOS FUNCIONALMENTE EQUIVALENTES');
      }
      
    } else if (resultados.localhost.disponible && !resultados.produccion.disponible) {
      console.log('⚠️ SOLO LOCALHOST ESTÁ DISPONIBLE');
      console.log('💡 El sitio de producción podría estar caído o tener problemas');
      
    } else if (!resultados.localhost.disponible && resultados.produccion.disponible) {
      console.log('⚠️ SOLO PRODUCCIÓN ESTÁ DISPONIBLE');
      console.log('💡 El servidor local no está ejecutándose');
      
    } else {
      console.log('❌ NINGÚN SITIO ESTÁ DISPONIBLE');
      console.log('💡 Verificar conectividad y estado de los servidores');
    }
    
    console.log('\n🔧 RECOMENDACIONES:');
    
    if (resultados.localhost.disponible) {
      console.log('✅ Localhost funcional - Continuar desarrollo local');
      if (resultados.localhost.errores.length > 0) {
        console.log('⚠️ Resolver errores de localhost antes del deployment');
      }
    }
    
    if (resultados.produccion.disponible) {
      console.log('✅ Producción accesible - Sitio web público funcionando');
      if (resultados.produccion.errores.length > 0) {
        console.log('⚠️ Revisar errores en producción');
      }
    }
    
    console.log('\n✅ COMPARACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error durante la comparación:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar comparación
compararSitios().then(() => {
  console.log('\n🏁 Comparación finalizada');
}).catch(error => {
  console.error('💥 Error fatal:', error);
});
