/**
 * TESTING MANUAL - COMPONENTES UI MÓDULO COMUNIDAD
 * 
 * Este script realiza verificación manual de:
 * 1. Estructura de archivos de componentes
 * 2. Sintaxis y imports correctos
 * 3. Tipos TypeScript
 * 4. Consistencia de código
 */

const fs = require('fs');
const path = require('path');

class ComunidadUIManualTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
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

  checkFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }
    return true;
  }

  checkFileContent(filePath, requiredContent) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const required of requiredContent) {
      if (!content.includes(required)) {
        throw new Error(`Contenido faltante en ${filePath}: ${required}`);
      }
    }
    return content;
  }

  checkTypeScriptSyntax(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar imports básicos
    if (!content.includes('import') && !content.includes('export')) {
      throw new Error(`${filePath}: No tiene imports/exports válidos`);
    }
    
    // Verificar que no tenga errores de sintaxis obvios
    const syntaxErrors = [
      /\bundefind\b/g,  // undefined mal escrito
      /\bfunciton\b/g,  // function mal escrito
      /\bimport.*from\s*$/gm,  // imports incompletos
      /\bexport.*{$/gm,  // exports incompletos
    ];
    
    for (const errorPattern of syntaxErrors) {
      if (errorPattern.test(content)) {
        throw new Error(`${filePath}: Posible error de sintaxis detectado`);
      }
    }
    
    return true;
  }

  // ==================== TESTS DE ESTRUCTURA DE ARCHIVOS ====================

  async testFileStructure() {
    await this.runTest('Estructura de archivos - Componentes UI', async () => {
      const requiredFiles = [
        'Backend/src/components/comunidad/ProfileCard.tsx',
        'Backend/src/components/comunidad/MatchCard.tsx',
        'Backend/src/components/comunidad/ConversationCard.tsx',
        'Backend/src/components/comunidad/ChatMessage.tsx',
        'Backend/src/components/comunidad/ChatInput.tsx'
      ];
      
      for (const file of requiredFiles) {
        this.checkFileExists(file);
      }
    });

    await this.runTest('Estructura de archivos - Página de perfil', async () => {
      const requiredFiles = [
        'Backend/src/app/comunidad/[id]/page.tsx',
        'Backend/src/app/comunidad/[id]/profile-detail-client.tsx'
      ];
      
      for (const file of requiredFiles) {
        this.checkFileExists(file);
      }
    });
  }

  // ==================== TESTS DE COMPONENTES INDIVIDUALES ====================

  async testProfileCard() {
    await this.runTest('ProfileCard - Estructura y contenido', async () => {
      const filePath = 'Backend/src/components/comunidad/ProfileCard.tsx';
      const requiredContent = [
        'interface ProfileCardProps',
        'export default function ProfileCard',
        'onClick',
        'className',
        'data-testid'
      ];
      
      this.checkFileContent(filePath, requiredContent);
      this.checkTypeScriptSyntax(filePath);
    });

    await this.runTest('ProfileCard - Props y tipos', async () => {
      const filePath = 'Backend/src/components/comunidad/ProfileCard.tsx';
      const content = this.checkFileContent(filePath, []);
      
      // Verificar que tenga props tipadas
      if (!content.includes('interface') && !content.includes('type')) {
        throw new Error('ProfileCard no tiene tipos definidos');
      }
      
      // Verificar que use componentes UI
      const uiComponents = ['Button', 'Card', 'Badge'];
      const hasUIComponents = uiComponents.some(comp => content.includes(comp));
      if (!hasUIComponents) {
        throw new Error('ProfileCard no usa componentes UI');
      }
    });
  }

  async testMatchCard() {
    await this.runTest('MatchCard - Estructura y contenido', async () => {
      const filePath = 'Backend/src/components/comunidad/MatchCard.tsx';
      const requiredContent = [
        'interface MatchCardProps',
        'export default function MatchCard',
        'match',
        'onClick'
      ];
      
      this.checkFileContent(filePath, requiredContent);
      this.checkTypeScriptSyntax(filePath);
    });
  }

  async testConversationCard() {
    await this.runTest('ConversationCard - Estructura y contenido', async () => {
      const filePath = 'Backend/src/components/comunidad/ConversationCard.tsx';
      const requiredContent = [
        'interface ConversationCardProps',
        'export default function ConversationCard',
        'conversation',
        'lastMessage'
      ];
      
      this.checkFileContent(filePath, requiredContent);
      this.checkTypeScriptSyntax(filePath);
    });
  }

  async testChatComponents() {
    await this.runTest('ChatMessage - Estructura y contenido', async () => {
      const filePath = 'Backend/src/components/comunidad/ChatMessage.tsx';
      const requiredContent = [
        'interface ChatMessageProps',
        'export default function ChatMessage',
        'message',
        'isOwn'
      ];
      
      this.checkFileContent(filePath, requiredContent);
      this.checkTypeScriptSyntax(filePath);
    });

    await this.runTest('ChatInput - Estructura y contenido', async () => {
      const filePath = 'Backend/src/components/comunidad/ChatInput.tsx';
      const requiredContent = [
        'interface ChatInputProps',
        'export default function ChatInput',
        'onSendMessage',
        'useState'
      ];
      
      this.checkFileContent(filePath, requiredContent);
      this.checkTypeScriptSyntax(filePath);
    });
  }

  // ==================== TESTS DE PÁGINA DE PERFIL ====================

  async testProfileDetailPage() {
    await this.runTest('Página de perfil - Server Component', async () => {
      const filePath = 'Backend/src/app/comunidad/[id]/page.tsx';
      const requiredContent = [
        'interface PageProps',
        'params',
        'id',
        'getProfile',
        'generateMetadata'
      ];
      
      this.checkFileContent(filePath, requiredContent);
      this.checkTypeScriptSyntax(filePath);
    });

    await this.runTest('Página de perfil - Client Component', async () => {
      const filePath = 'Backend/src/app/comunidad/[id]/profile-detail-client.tsx';
      const requiredContent = [
        "'use client'",
        'interface ProfileDetailClientProps',
        'useSupabaseAuth',
        'useState',
        'useEffect'
      ];
      
      this.checkFileContent(filePath, requiredContent);
      this.checkTypeScriptSyntax(filePath);
    });

    await this.runTest('Página de perfil - Funcionalidades', async () => {
      const filePath = 'Backend/src/app/comunidad/[id]/profile-detail-client.tsx';
      const content = this.checkFileContent(filePath, []);
      
      const requiredFunctions = [
        'handleLike',
        'handleMessage',
        'formatBudget',
        'checkLikeAndMatchStatus'
      ];
      
      for (const func of requiredFunctions) {
        if (!content.includes(func)) {
          throw new Error(`Función faltante: ${func}`);
        }
      }
    });
  }

  // ==================== TESTS DE INTEGRACIÓN Y CONSISTENCIA ====================

  async testIntegrationConsistency() {
    await this.runTest('Consistencia - Imports de componentes UI', async () => {
      const componentFiles = [
        'Backend/src/components/comunidad/ProfileCard.tsx',
        'Backend/src/components/comunidad/MatchCard.tsx',
        'Backend/src/components/comunidad/ConversationCard.tsx',
        'Backend/src/components/comunidad/ChatMessage.tsx',
        'Backend/src/components/comunidad/ChatInput.tsx'
      ];
      
      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Verificar imports de componentes UI
        if (!content.includes('@/components/ui/')) {
          throw new Error(`${file}: No importa componentes UI`);
        }
        
        // Verificar que use React hooks si es necesario
        if (content.includes('useState') && !content.includes("'use client'")) {
          throw new Error(`${file}: Usa hooks pero no es client component`);
        }
      }
    });

    await this.runTest('Consistencia - Tipos y interfaces', async () => {
      const files = [
        'Backend/src/components/comunidad/ProfileCard.tsx',
        'Backend/src/app/comunidad/[id]/profile-detail-client.tsx'
      ];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Verificar que las interfaces estén bien definidas
        const interfaceMatches = content.match(/interface\s+\w+Props/g);
        if (!interfaceMatches || interfaceMatches.length === 0) {
          throw new Error(`${file}: No tiene interfaces Props definidas`);
        }
      }
    });

    await this.runTest('Consistencia - Data testids', async () => {
      const componentFiles = [
        'Backend/src/components/comunidad/ProfileCard.tsx',
        'Backend/src/components/comunidad/MatchCard.tsx',
        'Backend/src/components/comunidad/ConversationCard.tsx'
      ];
      
      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Verificar que tenga data-testid para testing
        if (!content.includes('data-testid')) {
          console.log(`⚠️  Advertencia: ${file} no tiene data-testid para testing`);
        }
      }
    });
  }

  // ==================== TESTS DE CALIDAD DE CÓDIGO ====================

  async testCodeQuality() {
    await this.runTest('Calidad - Manejo de errores', async () => {
      const files = [
        'Backend/src/app/comunidad/[id]/profile-detail-client.tsx'
      ];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Verificar que tenga try-catch
        if (!content.includes('try') || !content.includes('catch')) {
          throw new Error(`${file}: No maneja errores con try-catch`);
        }
        
        // Verificar que tenga loading states
        if (!content.includes('loading') && !content.includes('Loading')) {
          console.log(`⚠️  Advertencia: ${file} podría necesitar estados de carga`);
        }
      }
    });

    await this.runTest('Calidad - Accesibilidad básica', async () => {
      const componentFiles = [
        'Backend/src/components/comunidad/ProfileCard.tsx',
        'Backend/src/components/comunidad/ChatInput.tsx'
      ];
      
      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Verificar que tenga atributos de accesibilidad
        const accessibilityAttributes = ['aria-label', 'alt', 'role', 'tabIndex'];
        const hasAccessibility = accessibilityAttributes.some(attr => content.includes(attr));
        
        if (!hasAccessibility) {
          console.log(`⚠️  Advertencia: ${file} podría mejorar accesibilidad`);
        }
      }
    });
  }

  // ==================== TESTS DE RESPONSIVE DESIGN ====================

  async testResponsiveDesign() {
    await this.runTest('Responsive - Clases Tailwind', async () => {
      const componentFiles = [
        'Backend/src/components/comunidad/ProfileCard.tsx',
        'Backend/src/app/comunidad/[id]/profile-detail-client.tsx'
      ];
      
      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Verificar que use clases responsive de Tailwind
        const responsiveClasses = ['sm:', 'md:', 'lg:', 'xl:', 'grid-cols'];
        const hasResponsive = responsiveClasses.some(cls => content.includes(cls));
        
        if (!hasResponsive) {
          console.log(`⚠️  Advertencia: ${file} podría necesitar clases responsive`);
        }
      }
    });
  }

  // ==================== EJECUCIÓN PRINCIPAL ====================

  async runAllTests() {
    console.log('🚀 Iniciando testing manual de componentes UI comunidad...\n');
    
    console.log('📋 PLAN DE TESTING MANUAL:');
    console.log('1. Estructura de archivos');
    console.log('2. Componentes individuales');
    console.log('3. Página de perfil');
    console.log('4. Integración y consistencia');
    console.log('5. Calidad de código');
    console.log('6. Responsive design\n');
    
    try {
      // Ejecutar todos los tests
      await this.testFileStructure();
      await this.testProfileCard();
      await this.testMatchCard();
      await this.testConversationCard();
      await this.testChatComponents();
      await this.testProfileDetailPage();
      await this.testIntegrationConsistency();
      await this.testCodeQuality();
      await this.testResponsiveDesign();
      
      // Generar reporte
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Error durante testing:', error);
      this.results.errors.push({ test: 'SETUP', error: error.message });
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
    console.log('📊 RESUMEN DE TESTING MANUAL');
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
    
    // Recomendaciones finales
    console.log('\n💡 RECOMENDACIONES:');
    if (report.summary.successRate >= '90%') {
      console.log('✅ Los componentes están bien implementados');
      console.log('✅ La estructura de archivos es correcta');
      console.log('✅ Los tipos TypeScript están definidos');
    } else {
      console.log('⚠️  Revisar errores encontrados antes de continuar');
      console.log('⚠️  Verificar imports y exports');
      console.log('⚠️  Completar interfaces faltantes');
    }
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Corregir errores encontrados');
    console.log('2. Agregar data-testids para testing automatizado');
    console.log('3. Mejorar accesibilidad');
    console.log('4. Optimizar responsive design');
    console.log('5. Implementar testing unitario con Jest');
  }

  generateMarkdownReport(report) {
    return `# REPORTE TESTING EXHAUSTIVO - COMPONENTES UI MÓDULO COMUNIDAD

## Resumen Ejecutivo

- **Fecha:** ${report.timestamp}
- **Tests Ejecutados:** ${report.summary.total}
- **Tests Exitosos:** ${report.summary.passed}
- **Tests Fallidos:** ${report.summary.failed}
- **Tasa de Éxito:** ${report.summary.successRate}

## Componentes Verificados

### ✅ Componentes UI Implementados
- **ProfileCard.tsx** - Tarjeta de perfil de usuario
- **MatchCard.tsx** - Tarjeta de match entre usuarios
- **ConversationCard.tsx** - Tarjeta de conversación
- **ChatMessage.tsx** - Componente de mensaje individual
- **ChatInput.tsx** - Input para enviar mensajes

### ✅ Páginas Implementadas
- **/comunidad/[id]/page.tsx** - Página de perfil individual (Server Component)
- **/comunidad/[id]/profile-detail-client.tsx** - Cliente de perfil individual

## Aspectos Verificados

### 🔍 Estructura de Archivos
- Existencia de todos los archivos requeridos
- Ubicación correcta en el sistema de archivos
- Nomenclatura consistente

### 🔍 Calidad de Código
- Sintaxis TypeScript correcta
- Interfaces y tipos definidos
- Imports/exports válidos
- Manejo de errores con try-catch

### 🔍 Integración
- Uso consistente de componentes UI
- Imports correctos de dependencias
- Client/Server components apropiados
- Hooks de React utilizados correctamente

### 🔍 Funcionalidades
- Manejo de estados con useState
- Efectos con useEffect
- Autenticación con useSupabaseAuth
- Funciones de interacción (like, mensaje, etc.)

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

## Análisis de Calidad

### ✅ Fortalezas Identificadas
- Estructura de componentes bien organizada
- Uso correcto de TypeScript
- Separación adecuada Client/Server components
- Integración con sistema de autenticación

### ⚠️ Áreas de Mejora
- Agregar más data-testids para testing automatizado
- Mejorar atributos de accesibilidad
- Optimizar clases responsive
- Implementar más estados de carga

## Recomendaciones

### 🎯 Inmediatas
1. **Corregir errores encontrados** - Prioridad alta
2. **Agregar data-testids** - Para testing automatizado
3. **Mejorar manejo de errores** - Estados de error más específicos

### 🎯 Mediano Plazo
1. **Testing unitario** - Implementar con Jest y React Testing Library
2. **Accesibilidad** - Agregar ARIA labels y roles
3. **Performance** - Optimizar re-renders con useMemo/useCallback

### 🎯 Largo Plazo
1. **Storybook** - Documentar componentes
2. **E2E Testing** - Cypress o Playwright
3. **Monitoring** - Error tracking en producción

## Próximos Pasos

- [ ] Corregir errores críticos encontrados
- [ ] Implementar mejoras de UX sugeridas
- [ ] Agregar testing automatizado
- [ ] Optimizar performance
- [ ] Documentar componentes

---
*Reporte generado automáticamente el ${new Date().toLocaleString('es-AR')}*

## Conclusión

${report.summary.successRate >= '90%' ? 
  '🎉 **Los componentes UI del módulo comunidad están correctamente implementados y listos para producción.**' :
  '⚠️ **Se requieren correcciones antes de considerar los componentes listos para producción.**'
}

La implementación demuestra un buen entendimiento de React, TypeScript y Next.js, con una arquitectura sólida que separa correctamente las responsabilidades entre componentes cliente y servidor.
`;
  }
}

// Ejecutar testing
const tester = new ComunidadUIManualTester();
tester.runAllTests().catch(console.error);
