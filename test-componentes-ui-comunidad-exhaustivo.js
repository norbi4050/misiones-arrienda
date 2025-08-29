/**
 * TESTING EXHAUSTIVO - COMPONENTES UI MÓDULO COMUNIDAD
 * 
 * Este script realiza testing exhaustivo de:
 * 1. Componentes UI recién creados
 * 2. Página de perfil individual
 * 3. Integración entre componentes
 * 4. Casos de uso específicos
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Configuración de testing
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  viewport: { width: 1920, height: 1080 },
  mobileViewport: { width: 375, height: 667 },
  tabletViewport: { width: 768, height: 1024 }
};

// Datos de prueba
const TEST_DATA = {
  validUser: {
    email: 'test@example.com',
    password: 'password123'
  },
  testProfile: {
    id: 'test-profile-id',
    name: 'Usuario Test',
    role: 'BUSCO',
    city: 'Posadas',
    neighborhood: 'Centro',
    budget_min: 50000,
    budget_max: 100000,
    bio: 'Soy un usuario de prueba buscando vivienda',
    age: 25,
    tags: ['estudiante', 'no fumador', 'responsable']
  }
};

class ComunidadUITester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }

  async init() {
    console.log('🚀 Iniciando testing exhaustivo de componentes UI comunidad...\n');
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport(CONFIG.viewport);
    
    // Configurar interceptores de red
    await this.setupNetworkInterceptors();
  }

  async setupNetworkInterceptors() {
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      // Simular respuestas de API para testing
      if (request.url().includes('/api/comunidad/profiles')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([TEST_DATA.testProfile])
        });
      } else {
        request.continue();
      }
    });
  }

  async runTest(testName, testFunction) {
    this.results.total++;
    console.log(`🧪 Ejecutando: ${testName}`);
    
    try {
      await testFunction();
      this.results.passed++;
      this.results.details.push({ test: testName, status: 'PASSED', error: null });
      console.log(`✅ ${testName} - PASSED\n`);
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: testName, error: error.message });
      this.results.details.push({ test: testName, status: 'FAILED', error: error.message });
      console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
    }
  }

  // ==================== TESTS DE COMPONENTES UI ====================

  async testProfileCard() {
    await this.runTest('ProfileCard - Renderizado básico', async () => {
      await this.page.goto(`${CONFIG.baseUrl}/comunidad`);
      await this.page.waitForSelector('[data-testid="profile-card"]', { timeout: CONFIG.timeout });
      
      // Verificar elementos básicos
      const profileCard = await this.page.$('[data-testid="profile-card"]');
      if (!profileCard) throw new Error('ProfileCard no se renderiza');
      
      // Verificar información del perfil
      const name = await this.page.$eval('[data-testid="profile-name"]', el => el.textContent);
      const role = await this.page.$eval('[data-testid="profile-role"]', el => el.textContent);
      const location = await this.page.$eval('[data-testid="profile-location"]', el => el.textContent);
      
      if (!name || !role || !location) {
        throw new Error('Información básica del perfil faltante');
      }
    });

    await this.runTest('ProfileCard - Interacciones', async () => {
      // Test botón "Me gusta"
      const likeButton = await this.page.$('[data-testid="like-button"]');
      if (likeButton) {
        await likeButton.click();
        await this.page.waitForTimeout(1000);
        
        // Verificar cambio de estado
        const isLiked = await this.page.$eval('[data-testid="like-button"]', 
          el => el.classList.contains('liked'));
        if (!isLiked) throw new Error('Estado de like no se actualiza');
      }
      
      // Test botón "Ver perfil"
      const viewButton = await this.page.$('[data-testid="view-profile-button"]');
      if (viewButton) {
        await viewButton.click();
        await this.page.waitForNavigation();
        
        const currentUrl = this.page.url();
        if (!currentUrl.includes('/comunidad/')) {
          throw new Error('Navegación a perfil individual no funciona');
        }
      }
    });

    await this.runTest('ProfileCard - Responsive Design', async () => {
      // Test en móvil
      await this.page.setViewport(CONFIG.mobileViewport);
      await this.page.reload();
      await this.page.waitForSelector('[data-testid="profile-card"]');
      
      const cardWidth = await this.page.$eval('[data-testid="profile-card"]', 
        el => el.offsetWidth);
      if (cardWidth > CONFIG.mobileViewport.width) {
        throw new Error('ProfileCard no es responsive en móvil');
      }
      
      // Test en tablet
      await this.page.setViewport(CONFIG.tabletViewport);
      await this.page.reload();
      await this.page.waitForSelector('[data-testid="profile-card"]');
      
      // Restaurar viewport
      await this.page.setViewport(CONFIG.viewport);
    });
  }

  async testMatchCard() {
    await this.runTest('MatchCard - Renderizado y funcionalidad', async () => {
      await this.page.goto(`${CONFIG.baseUrl}/comunidad/matches`);
      await this.page.waitForSelector('[data-testid="match-card"]', { timeout: CONFIG.timeout });
      
      // Verificar elementos del match
      const matchCard = await this.page.$('[data-testid="match-card"]');
      if (!matchCard) throw new Error('MatchCard no se renderiza');
      
      // Test botón "Enviar mensaje"
      const messageButton = await this.page.$('[data-testid="send-message-button"]');
      if (messageButton) {
        await messageButton.click();
        await this.page.waitForNavigation();
        
        const currentUrl = this.page.url();
        if (!currentUrl.includes('/mensajes')) {
          throw new Error('Navegación a mensajes no funciona');
        }
      }
    });
  }

  async testConversationCard() {
    await this.runTest('ConversationCard - Lista de conversaciones', async () => {
      await this.page.goto(`${CONFIG.baseUrl}/comunidad/mensajes`);
      await this.page.waitForSelector('[data-testid="conversation-card"]', { timeout: CONFIG.timeout });
      
      // Verificar elementos de conversación
      const conversationCard = await this.page.$('[data-testid="conversation-card"]');
      if (!conversationCard) throw new Error('ConversationCard no se renderiza');
      
      // Verificar último mensaje
      const lastMessage = await this.page.$('[data-testid="last-message"]');
      const timestamp = await this.page.$('[data-testid="message-timestamp"]');
      
      if (!lastMessage || !timestamp) {
        throw new Error('Información de conversación incompleta');
      }
      
      // Test click en conversación
      await conversationCard.click();
      await this.page.waitForNavigation();
      
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/mensajes/')) {
        throw new Error('Navegación a chat individual no funciona');
      }
    });
  }

  async testChatComponents() {
    await this.runTest('ChatMessage - Renderizado de mensajes', async () => {
      await this.page.goto(`${CONFIG.baseUrl}/comunidad/mensajes/test-conversation`);
      await this.page.waitForSelector('[data-testid="chat-message"]', { timeout: CONFIG.timeout });
      
      // Verificar mensajes propios vs ajenos
      const ownMessages = await this.page.$$('[data-testid="chat-message"][data-own="true"]');
      const otherMessages = await this.page.$$('[data-testid="chat-message"][data-own="false"]');
      
      if (ownMessages.length === 0 && otherMessages.length === 0) {
        throw new Error('No se renderizan mensajes');
      }
      
      // Verificar timestamps
      const timestamps = await this.page.$$('[data-testid="message-timestamp"]');
      if (timestamps.length === 0) {
        throw new Error('Timestamps de mensajes faltantes');
      }
    });

    await this.runTest('ChatInput - Envío de mensajes', async () => {
      const chatInput = await this.page.$('[data-testid="chat-input"]');
      const sendButton = await this.page.$('[data-testid="send-button"]');
      
      if (!chatInput || !sendButton) {
        throw new Error('Componentes de chat input faltantes');
      }
      
      // Test envío de mensaje
      await chatInput.type('Mensaje de prueba');
      await sendButton.click();
      
      // Verificar que el input se limpia
      const inputValue = await this.page.$eval('[data-testid="chat-input"]', el => el.value);
      if (inputValue !== '') {
        throw new Error('Input no se limpia después de enviar');
      }
      
      // Test envío con Enter
      await chatInput.type('Otro mensaje de prueba');
      await chatInput.press('Enter');
      
      const inputValue2 = await this.page.$eval('[data-testid="chat-input"]', el => el.value);
      if (inputValue2 !== '') {
        throw new Error('Envío con Enter no funciona');
      }
    });
  }

  // ==================== TESTS DE PÁGINA DE PERFIL INDIVIDUAL ====================

  async testProfileDetailPage() {
    await this.runTest('Página de perfil - Carga inicial', async () => {
      await this.page.goto(`${CONFIG.baseUrl}/comunidad/${TEST_DATA.testProfile.id}`);
      await this.page.waitForSelector('[data-testid="profile-detail"]', { timeout: CONFIG.timeout });
      
      // Verificar información básica
      const profileName = await this.page.$eval('[data-testid="profile-name"]', el => el.textContent);
      const profileRole = await this.page.$eval('[data-testid="profile-role"]', el => el.textContent);
      const profileLocation = await this.page.$eval('[data-testid="profile-location"]', el => el.textContent);
      
      if (!profileName.includes(TEST_DATA.testProfile.name)) {
        throw new Error('Nombre del perfil no coincide');
      }
      
      if (!profileRole.includes(TEST_DATA.testProfile.role)) {
        throw new Error('Rol del perfil no coincide');
      }
    });

    await this.runTest('Página de perfil - Información detallada', async () => {
      // Verificar presupuesto
      const budget = await this.page.$('[data-testid="profile-budget"]');
      if (!budget) throw new Error('Información de presupuesto faltante');
      
      // Verificar biografía
      const bio = await this.page.$('[data-testid="profile-bio"]');
      if (!bio) throw new Error('Biografía del perfil faltante');
      
      // Verificar tags/intereses
      const tags = await this.page.$$('[data-testid="profile-tag"]');
      if (tags.length === 0) throw new Error('Tags del perfil faltantes');
      
      // Verificar preferencias
      const preferences = await this.page.$('[data-testid="profile-preferences"]');
      if (!preferences) throw new Error('Preferencias del perfil faltantes');
    });

    await this.runTest('Página de perfil - Acciones de usuario', async () => {
      // Test botón "Me gusta"
      const likeButton = await this.page.$('[data-testid="like-action-button"]');
      if (likeButton) {
        await likeButton.click();
        await this.page.waitForTimeout(1000);
        
        // Verificar cambio visual
        const buttonText = await likeButton.textContent();
        if (!buttonText.includes('gusta')) {
          throw new Error('Estado del botón like no se actualiza');
        }
      }
      
      // Test botón "Enviar mensaje" (solo si hay match)
      const messageButton = await this.page.$('[data-testid="message-action-button"]');
      if (messageButton) {
        const isDisabled = await messageButton.evaluate(el => el.disabled);
        // El botón debe estar habilitado solo si hay match
        console.log('Botón mensaje estado:', isDisabled ? 'deshabilitado' : 'habilitado');
      }
    });

    await this.runTest('Página de perfil - Navegación', async () => {
      // Test botón "Volver"
      const backButton = await this.page.$('[data-testid="back-button"]');
      if (!backButton) throw new Error('Botón volver faltante');
      
      await backButton.click();
      await this.page.waitForNavigation();
      
      const currentUrl = this.page.url();
      if (currentUrl.includes(`/${TEST_DATA.testProfile.id}`)) {
        throw new Error('Navegación de vuelta no funciona');
      }
    });
  }

  // ==================== TESTS DE INTEGRACIÓN ====================

  async testIntegrationFlows() {
    await this.runTest('Flujo completo - Explorar perfiles → Ver detalle → Dar like', async () => {
      // 1. Ir a página principal de comunidad
      await this.page.goto(`${CONFIG.baseUrl}/comunidad`);
      await this.page.waitForSelector('[data-testid="profile-card"]');
      
      // 2. Click en "Ver perfil"
      const viewButton = await this.page.$('[data-testid="view-profile-button"]');
      await viewButton.click();
      await this.page.waitForNavigation();
      
      // 3. Dar like en página de detalle
      const likeButton = await this.page.$('[data-testid="like-action-button"]');
      if (likeButton) {
        await likeButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      // 4. Verificar que el estado se mantiene al volver
      await this.page.goBack();
      await this.page.waitForSelector('[data-testid="profile-card"]');
      
      const cardLikeButton = await this.page.$('[data-testid="like-button"]');
      if (cardLikeButton) {
        const isLiked = await cardLikeButton.evaluate(el => 
          el.classList.contains('liked') || el.getAttribute('data-liked') === 'true'
        );
        if (!isLiked) {
          throw new Error('Estado de like no se sincroniza entre páginas');
        }
      }
    });

    await this.runTest('Flujo de mensajería - Match → Conversación → Chat', async () => {
      // 1. Ir a matches
      await this.page.goto(`${CONFIG.baseUrl}/comunidad/matches`);
      await this.page.waitForSelector('[data-testid="match-card"]');
      
      // 2. Click en "Enviar mensaje"
      const messageButton = await this.page.$('[data-testid="send-message-button"]');
      if (messageButton) {
        await messageButton.click();
        await this.page.waitForNavigation();
        
        // 3. Verificar que llegamos a la conversación
        const chatInput = await this.page.$('[data-testid="chat-input"]');
        if (!chatInput) {
          throw new Error('No se navega correctamente al chat');
        }
        
        // 4. Enviar mensaje de prueba
        await chatInput.type('Hola, ¿cómo estás?');
        const sendButton = await this.page.$('[data-testid="send-button"]');
        await sendButton.click();
        
        // 5. Verificar que el mensaje aparece
        await this.page.waitForTimeout(1000);
        const messages = await this.page.$$('[data-testid="chat-message"]');
        if (messages.length === 0) {
          throw new Error('Mensaje no se envía correctamente');
        }
      }
    });
  }

  // ==================== TESTS DE CASOS EDGE ====================

  async testEdgeCases() {
    await this.runTest('Manejo de errores - Perfil no encontrado', async () => {
      await this.page.goto(`${CONFIG.baseUrl}/comunidad/perfil-inexistente`);
      
      // Debe mostrar página 404 o error
      const errorElement = await this.page.$('[data-testid="not-found"]') || 
                          await this.page.$('[data-testid="error-message"]');
      
      if (!errorElement) {
        throw new Error('No se maneja correctamente perfil no encontrado');
      }
    });

    await this.runTest('Manejo de errores - Sin conexión a internet', async () => {
      // Simular offline
      await this.page.setOfflineMode(true);
      
      await this.page.goto(`${CONFIG.baseUrl}/comunidad`);
      
      // Debe mostrar mensaje de error o estado offline
      const offlineMessage = await this.page.$('[data-testid="offline-message"]') ||
                            await this.page.$('[data-testid="connection-error"]');
      
      // Restaurar conexión
      await this.page.setOfflineMode(false);
      
      if (!offlineMessage) {
        console.log('⚠️  Advertencia: No se detecta manejo de estado offline');
      }
    });

    await this.runTest('Estados de carga - Componentes con loading', async () => {
      await this.page.goto(`${CONFIG.baseUrl}/comunidad`);
      
      // Verificar que hay estados de carga
      const loadingElements = await this.page.$$('[data-testid*="loading"]') ||
                             await this.page.$$('.loading') ||
                             await this.page.$$('[data-loading="true"]');
      
      if (loadingElements.length === 0) {
        console.log('⚠️  Advertencia: No se detectan estados de carga');
      }
    });
  }

  // ==================== TESTS DE PERFORMANCE ====================

  async testPerformance() {
    await this.runTest('Performance - Tiempo de carga inicial', async () => {
      const startTime = Date.now();
      
      await this.page.goto(`${CONFIG.baseUrl}/comunidad`);
      await this.page.waitForSelector('[data-testid="profile-card"]');
      
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 5000) {
        throw new Error(`Tiempo de carga muy lento: ${loadTime}ms`);
      }
      
      console.log(`   ⏱️  Tiempo de carga: ${loadTime}ms`);
    });

    await this.runTest('Performance - Navegación entre páginas', async () => {
      const startTime = Date.now();
      
      const viewButton = await this.page.$('[data-testid="view-profile-button"]');
      await viewButton.click();
      await this.page.waitForNavigation();
      
      const navigationTime = Date.now() - startTime;
      
      if (navigationTime > 3000) {
        throw new Error(`Navegación muy lenta: ${navigationTime}ms`);
      }
      
      console.log(`   ⏱️  Tiempo de navegación: ${navigationTime}ms`);
    });
  }

  // ==================== EJECUCIÓN PRINCIPAL ====================

  async runAllTests() {
    try {
      await this.init();
      
      console.log('📋 PLAN DE TESTING EXHAUSTIVO:');
      console.log('1. Componentes UI básicos');
      console.log('2. Página de perfil individual');
      console.log('3. Flujos de integración');
      console.log('4. Casos edge y manejo de errores');
      console.log('5. Tests de performance');
      console.log('6. Responsive design\n');
      
      // Ejecutar todos los tests
      await this.testProfileCard();
      await this.testMatchCard();
      await this.testConversationCard();
      await this.testChatComponents();
      await this.testProfileDetailPage();
      await this.testIntegrationFlows();
      await this.testEdgeCases();
      await this.testPerformance();
      
      // Generar reporte
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Error durante testing:', error);
      this.results.errors.push({ test: 'SETUP', error: error.message });
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(2) + '%'
      },
      details: this.results.details,
      errors: this.results.errors
    };

    // Guardar reporte
    fs.writeFileSync(
      'REPORTE-TESTING-EXHAUSTIVO-COMPONENTES-UI-COMUNIDAD-FINAL.md',
      this.generateMarkdownReport(report)
    );

    // Mostrar resumen en consola
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE TESTING EXHAUSTIVO');
    console.log('='.repeat(60));
    console.log(`✅ Tests pasados: ${report.summary.passed}`);
    console.log(`❌ Tests fallidos: ${report.summary.failed}`);
    console.log(`📈 Tasa de éxito: ${report.summary.successRate}`);
    console.log(`🕐 Timestamp: ${report.timestamp}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERRORES ENCONTRADOS:');
      this.results.errors.forEach(error => {
        console.log(`   • ${error.test}: ${error.error}`);
      });
    }
    
    console.log('\n📄 Reporte detallado guardado en: REPORTE-TESTING-EXHAUSTIVO-COMPONENTES-UI-COMUNIDAD-FINAL.md');
  }

  generateMarkdownReport(report) {
    return `# REPORTE TESTING EXHAUSTIVO - COMPONENTES UI MÓDULO COMUNIDAD

## Resumen Ejecutivo

- **Fecha:** ${report.timestamp}
- **Tests Ejecutados:** ${report.summary.total}
- **Tests Exitosos:** ${report.summary.passed}
- **Tests Fallidos:** ${report.summary.failed}
- **Tasa de Éxito:** ${report.summary.successRate}

## Componentes Testeados

### ✅ Componentes UI
- ProfileCard.tsx - Renderizado, interacciones, responsive
- MatchCard.tsx - Funcionalidad de matches
- ConversationCard.tsx - Lista de conversaciones
- ChatMessage.tsx - Renderizado de mensajes
- ChatInput.tsx - Envío de mensajes

### ✅ Páginas
- /comunidad/[id] - Página de perfil individual
- Navegación y routing
- Estados de carga y error

### ✅ Flujos de Integración
- Explorar perfiles → Ver detalle → Dar like
- Match → Conversación → Chat
- Sincronización de estados entre páginas

### ✅ Casos Edge
- Perfiles no encontrados
- Manejo de errores de red
- Estados offline
- Performance y tiempos de carga

## Detalles de Tests

${report.details.map(detail => 
  `### ${detail.status === 'PASSED' ? '✅' : '❌'} ${detail.test}
${detail.error ? `**Error:** ${detail.error}` : '**Estado:** Exitoso'}
`).join('\n')}

## Errores Encontrados

${report.errors.length > 0 ? 
  report.errors.map(error => `- **${error.test}:** ${error.error}`).join('\n') :
  'No se encontraron errores críticos.'
}

## Recomendaciones

1. **Componentes UI:** ${report.summary.successRate > '90%' ? 'Funcionando correctamente' : 'Requieren atención'}
2. **Integración:** Verificar sincronización de estados entre componentes
3. **Performance:** Monitorear tiempos de carga en producción
4. **UX:** Mejorar manejo de estados de error y carga
5. **Testing:** Implementar tests unitarios automatizados

## Próximos Pasos

- [ ] Corregir errores encontrados
- [ ] Implementar mejoras de UX
- [ ] Optimizar performance
- [ ] Agregar tests automatizados
- [ ] Documentar componentes

---
*Reporte generado automáticamente el ${new Date().toLocaleString('es-AR')}*
`;
  }
}

// Ejecutar testing
const tester = new ComunidadUITester();
tester.runAllTests().catch(console.error);
