// Test para diagnosticar el problema de navegación
const puppeteer = require('puppeteer');

async function testNavigation() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE NAVEGACIÓN...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Escuchar errores de consola
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`❌ CONSOLE ${type.toUpperCase()}: ${msg.text()}`);
      }
    });
    
    // Escuchar errores de red
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ NETWORK ERROR: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Ir a la página principal
    console.log('📍 Navegando a localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Esperar a que cargue completamente
    await page.waitForTimeout(2000);
    
    console.log('✅ Página principal cargada');
    
    // Probar navegación a Properties
    console.log('\n🔗 Probando navegación a Properties...');
    
    // Buscar el enlace de Properties
    const propertiesLink = await page.$('a[href="/properties"]');
    if (!propertiesLink) {
      console.log('❌ No se encontró el enlace de Properties');
      return;
    }
    
    console.log('✅ Enlace de Properties encontrado');
    
    // Hacer click en Properties
    await propertiesLink.click();
    
    // Esperar navegación
    await page.waitForTimeout(3000);
    
    // Verificar URL actual
    const currentUrl = page.url();
    console.log(`📍 URL actual después del click: ${currentUrl}`);
    
    if (currentUrl.includes('/properties')) {
      console.log('✅ Navegación a Properties EXITOSA');
    } else {
      console.log('❌ Navegación a Properties FALLÓ - se quedó en la misma página');
      
      // Intentar navegación directa
      console.log('\n🔄 Intentando navegación directa...');
      await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle0' });
      await page.waitForTimeout(2000);
      
      const directUrl = page.url();
      console.log(`📍 URL después de navegación directa: ${directUrl}`);
      
      if (directUrl.includes('/properties')) {
        console.log('✅ Navegación directa EXITOSA - El problema es con los enlaces');
      } else {
        console.log('❌ Navegación directa también FALLÓ - Problema de routing');
      }
    }
    
    // Probar navegación a Comunidad
    console.log('\n🔗 Probando navegación a Comunidad...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    const comunidadLink = await page.$('a[href="/comunidad"]');
    if (!comunidadLink) {
      console.log('❌ No se encontró el enlace de Comunidad');
      return;
    }
    
    console.log('✅ Enlace de Comunidad encontrado');
    
    await comunidadLink.click();
    await page.waitForTimeout(3000);
    
    const comunidadUrl = page.url();
    console.log(`📍 URL actual después del click en Comunidad: ${comunidadUrl}`);
    
    if (comunidadUrl.includes('/comunidad')) {
      console.log('✅ Navegación a Comunidad EXITOSA');
    } else {
      console.log('❌ Navegación a Comunidad FALLÓ');
    }
    
  } catch (error) {
    console.error('❌ ERROR EN EL TEST:', error);
  } finally {
    await browser.close();
  }
}

// Ejecutar el test
testNavigation().then(() => {
  console.log('\n🏁 DIAGNÓSTICO COMPLETADO');
}).catch(console.error);
