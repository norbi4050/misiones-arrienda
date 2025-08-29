const puppeteer = require('puppeteer');

console.log('🔍 INICIANDO DIAGNÓSTICO EXHAUSTIVO DE SUPABASE Y NAVEGACIÓN');
console.log('='.repeat(80));

async function diagnosticarSupabase() {
  let browser;
  
  try {
    console.log('🚀 Lanzando navegador...');
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capturar logs de consola
    const consoleLogs = [];
    page.on('console', msg => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logEntry);
      console.log(`📝 Console: ${logEntry}`);
    });
    
    // Capturar errores de red
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        const error = `${response.status()} - ${response.url()}`;
        networkErrors.push(error);
        console.log(`❌ Error de red: ${error}`);
      }
    });
    
    console.log('\n📍 FASE 1: TESTING PÁGINA PRINCIPAL');
    console.log('-'.repeat(50));
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    console.log('✅ Página principal cargada');
    
    // Esperar un momento para que se ejecuten los scripts
    await page.waitForTimeout(2000);
    
    console.log('\n📍 FASE 2: TESTING NAVEGACIÓN A PROPIEDADES');
    console.log('-'.repeat(50));
    
    // Intentar navegar a propiedades
    try {
      await page.click('a[href="/properties"]');
      console.log('🔄 Click en enlace Propiedades ejecutado');
      
      // Esperar a que la navegación se complete o falle
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`📍 URL actual: ${currentUrl}`);
      
      if (currentUrl.includes('/properties')) {
        console.log('✅ Navegación a Propiedades EXITOSA');
      } else {
        console.log('❌ Navegación a Propiedades FALLÓ - se quedó en:', currentUrl);
      }
      
    } catch (error) {
      console.log('❌ Error al hacer click en Propiedades:', error.message);
    }
    
    console.log('\n📍 FASE 3: TESTING NAVEGACIÓN A COMUNIDAD');
    console.log('-'.repeat(50));
    
    // Volver a la página principal
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    try {
      await page.click('a[href="/comunidad"]');
      console.log('🔄 Click en enlace Comunidad ejecutado');
      
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`📍 URL actual: ${currentUrl}`);
      
      if (currentUrl.includes('/comunidad')) {
        console.log('✅ Navegación a Comunidad EXITOSA');
      } else {
        console.log('❌ Navegación a Comunidad FALLÓ - se quedó en:', currentUrl);
      }
      
    } catch (error) {
      console.log('❌ Error al hacer click en Comunidad:', error.message);
    }
    
    console.log('\n📍 FASE 4: TESTING NAVEGACIÓN A PUBLICAR');
    console.log('-'.repeat(50));
    
    // Volver a la página principal
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    try {
      await page.click('a[href="/publicar"]');
      console.log('🔄 Click en enlace Publicar ejecutado');
      
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`📍 URL actual: ${currentUrl}`);
      
      if (currentUrl.includes('/publicar')) {
        console.log('✅ Navegación a Publicar EXITOSA');
      } else {
        console.log('❌ Navegación a Publicar FALLÓ - se quedó en:', currentUrl);
      }
      
    } catch (error) {
      console.log('❌ Error al hacer click en Publicar:', error.message);
    }
    
    console.log('\n📍 FASE 5: ANÁLISIS DE PROBLEMAS DE SUPABASE');
    console.log('-'.repeat(50));
    
    // Buscar errores específicos de Supabase en los logs
    const supabaseErrors = consoleLogs.filter(log => 
      log.includes('Invalid API key') || 
      log.includes('Supabase') ||
      log.includes('Auth state') ||
      log.includes('middleware')
    );
    
    if (supabaseErrors.length > 0) {
      console.log('🔍 ERRORES DE SUPABASE DETECTADOS:');
      supabaseErrors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    } else {
      console.log('✅ No se detectaron errores específicos de Supabase');
    }
    
    console.log('\n📍 FASE 6: RESUMEN DE DIAGNÓSTICO');
    console.log('-'.repeat(50));
    
    console.log(`📊 Total de logs de consola: ${consoleLogs.length}`);
    console.log(`📊 Total de errores de red: ${networkErrors.length}`);
    console.log(`📊 Errores de Supabase: ${supabaseErrors.length}`);
    
    if (networkErrors.length > 0) {
      console.log('\n🔍 ERRORES DE RED DETECTADOS:');
      networkErrors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }
    
    // Análisis del problema principal
    console.log('\n🎯 ANÁLISIS DEL PROBLEMA:');
    
    const hasSupabaseErrors = supabaseErrors.some(log => log.includes('Invalid API key'));
    const hasNavigationIssues = networkErrors.some(error => error.includes('500'));
    
    if (hasSupabaseErrors) {
      console.log('❌ PROBLEMA IDENTIFICADO: Configuración incorrecta de Supabase API keys');
      console.log('💡 SOLUCIÓN: Verificar variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    
    if (hasNavigationIssues) {
      console.log('❌ PROBLEMA IDENTIFICADO: Errores 500 en APIs que dependen de Supabase');
      console.log('💡 SOLUCIÓN: El middleware temporal permite navegación, pero las APIs fallan por Supabase');
    }
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar diagnóstico
diagnosticarSupabase().then(() => {
  console.log('\n🏁 Diagnóstico finalizado');
}).catch(error => {
  console.error('💥 Error fatal:', error);
});
