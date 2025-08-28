/**
 * 🧪 TESTING EXHAUSTIVO - PLAN TÉCNICO COMPLETO
 * 
 * Este script verifica el cumplimiento del plan técnico de MisionesArrienda
 * comparando los requerimientos con la implementación actual.
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class PlanTecnicoTester {
  constructor() {
    this.results = {
      implementado: [],
      parcial: [],
      faltante: [],
      critico: []
    };
    this.score = 0;
    this.totalTests = 0;
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(title) {
    console.log('\n' + '='.repeat(80));
    this.log(`🔍 ${title}`, 'bold');
    console.log('='.repeat(80));
  }

  logSubHeader(title) {
    console.log('\n' + '-'.repeat(60));
    this.log(`📋 ${title}`, 'cyan');
    console.log('-'.repeat(60));
  }

  checkFile(filePath, description) {
    const fullPath = path.join(__dirname, 'Backend', filePath);
    const exists = fs.existsSync(fullPath);
    this.totalTests++;
    
    if (exists) {
      this.log(`✅ ${description}`, 'green');
      this.results.implementado.push(description);
      this.score++;
      return true;
    } else {
      this.log(`❌ ${description}`, 'red');
      this.results.faltante.push(description);
      return false;
    }
  }

  checkFileContent(filePath, searchText, description) {
    const fullPath = path.join(__dirname, 'Backend', filePath);
    this.totalTests++;
    
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(searchText)) {
          this.log(`✅ ${description}`, 'green');
          this.results.implementado.push(description);
          this.score++;
          return true;
        } else {
          this.log(`⚠️  ${description} (archivo existe pero falta funcionalidad)`, 'yellow');
          this.results.parcial.push(description);
          this.score += 0.5;
          return false;
        }
      } else {
        this.log(`❌ ${description} (archivo no existe)`, 'red');
        this.results.faltante.push(description);
        return false;
      }
    } catch (error) {
      this.log(`❌ ${description} (error al leer archivo)`, 'red');
      this.results.faltante.push(description);
      return false;
    }
  }

  checkCritical(condition, description) {
    this.totalTests++;
    
    if (condition) {
      this.log(`✅ ${description}`, 'green');
      this.results.implementado.push(description);
      this.score++;
    } else {
      this.log(`🚨 CRÍTICO: ${description}`, 'red');
      this.results.critico.push(description);
    }
  }

  // 1. REGISTRO Y AUTENTICACIÓN
  testRegistroAutenticacion() {
    this.logSubHeader('1. REGISTRO Y AUTENTICACIÓN');
    
    this.checkFile('src/app/register/page.tsx', 'Página de registro');
    this.checkFile('src/app/login/page.tsx', 'Página de login');
    this.checkFile('src/hooks/useAuth.ts', 'Hook de autenticación');
    this.checkFile('src/middleware.ts', 'Middleware de protección');
    
    this.checkFileContent('prisma/schema.prisma', 'model User', 'Modelo User en base de datos');
    this.checkFileContent('src/app/register/page.tsx', 'email', 'Campo email en registro');
    this.checkFileContent('src/app/register/page.tsx', 'phone', 'Campo teléfono en registro');
    this.checkFileContent('src/components/navbar.tsx', 'user', 'Navbar adaptativa según usuario');
    
    this.checkCritical(
      fs.existsSync(path.join(__dirname, 'Backend/src/app/api/auth')),
      'APIs de autenticación implementadas'
    );
  }

  // 2. TIPOS DE PERFILES
  testTiposPerfiles() {
    this.logSubHeader('2. TIPOS DE PERFILES Y FUNCIONALIDADES');
    
    // Usuario Básico (Comunidad)
    this.log('\n👤 Usuario Básico (Comunidad):', 'blue');
    this.checkFile('src/app/comunidad/page.tsx', 'Página de comunidad');
    this.checkFile('src/app/comunidad/publicar/page.tsx', 'Publicar en comunidad');
    this.checkFileContent('prisma/schema.prisma', 'UserProfile', 'Modelo UserProfile');
    this.checkFileContent('src/app/api/comunidad/profiles/route.ts', 'GET', 'API para obtener perfiles');
    
    // Propietario Directo
    this.log('\n🏠 Propietario Directo:', 'blue');
    this.checkFile('src/app/publicar/page.tsx', 'Página publicar propiedad');
    this.checkFileContent('prisma/schema.prisma', 'Property', 'Modelo Property');
    this.checkFileContent('src/app/api/properties/create/route.ts', 'POST', 'API crear propiedad');
    
    // Usuario Profesional/Inmobiliaria
    this.log('\n🏢 Usuario Profesional/Inmobiliaria:', 'blue');
    this.checkFile('src/app/inmobiliaria/register/page.tsx', 'Registro inmobiliaria');
    this.checkFileContent('prisma/schema.prisma', 'userType', 'Campo userType en User');
    this.checkFileContent('prisma/schema.prisma', 'companyName', 'Campo companyName en User');
  }

  // 3. NAVEGACIÓN DINÁMICA
  testNavegacionDinamica() {
    this.logSubHeader('3. NAVEGACIÓN DINÁMICA');
    
    this.checkFile('src/components/navbar.tsx', 'Componente navbar');
    this.checkFileContent('src/components/navbar.tsx', 'userType', 'Navegación según tipo de usuario');
    this.checkFileContent('src/components/navbar.tsx', 'Comunidad', 'Enlace a Comunidad');
    this.checkFileContent('src/components/navbar.tsx', 'Mis Propiedades', 'Enlace Mis Propiedades');
    
    // Verificar que se oculten botones de registro/login después del login
    this.checkFileContent('src/components/navbar.tsx', 'isAuthenticated', 'Ocultar registro/login si autenticado');
  }

  // 4. PUBLICACIÓN DE PROPIEDADES
  testPublicacionPropiedades() {
    this.logSubHeader('4. PUBLICACIÓN DE PROPIEDADES');
    
    this.checkFile('src/app/publicar/page.tsx', 'Formulario publicar propiedad');
    this.checkFileContent('src/app/publicar/page.tsx', 'title', 'Campo título');
    this.checkFileContent('src/app/publicar/page.tsx', 'description', 'Campo descripción');
    this.checkFileContent('src/app/publicar/page.tsx', 'price', 'Campo precio');
    this.checkFileContent('src/app/publicar/page.tsx', 'address', 'Campo dirección');
    this.checkFileContent('src/app/publicar/page.tsx', 'images', 'Campo imágenes');
    
    this.checkFile('src/app/api/properties/create/route.ts', 'API crear propiedad');
    this.checkFileContent('prisma/schema.prisma', 'latitude', 'Coordenadas en Property');
  }

  // 5. PUBLICACIONES DE COMUNIDAD
  testPublicacionesComunidad() {
    this.logSubHeader('5. PUBLICACIONES DE COMUNIDAD');
    
    this.checkFile('src/app/comunidad/publicar/page.tsx', 'Formulario publicar en comunidad');
    this.checkFileContent('src/app/comunidad/publicar/page.tsx', 'BUSCO', 'Opción "Busco lugar"');
    this.checkFileContent('src/app/comunidad/publicar/page.tsx', 'OFREZCO', 'Opción "Ofrezco lugar"');
    this.checkFileContent('src/app/comunidad/publicar/page.tsx', 'petPref', 'Preferencias mascotas');
    this.checkFileContent('src/app/comunidad/publicar/page.tsx', 'smokePref', 'Preferencias fumador');
    
    this.checkFileContent('prisma/schema.prisma', 'CommunityRole', 'Enum CommunityRole');
    this.checkFileContent('prisma/schema.prisma', 'PetPref', 'Enum PetPref');
    this.checkFileContent('prisma/schema.prisma', 'SmokePref', 'Enum SmokePref');
  }

  // 6. CADUCIDAD DE ANUNCIOS - CRÍTICO
  testCaducidadAnuncios() {
    this.logSubHeader('6. CADUCIDAD DE ANUNCIOS - CRÍTICO');
    
    this.checkCritical(
      fs.existsSync(path.join(__dirname, 'Backend/src/lib/expiration.ts')),
      'Sistema de caducidad de anuncios'
    );
    
    this.checkFileContent('prisma/schema.prisma', 'expiresAt', 'Campo expiresAt en Property');
    this.checkFileContent('prisma/schema.prisma', 'expiresAt', 'Campo expiresAt en UserProfile');
    
    this.checkCritical(
      fs.existsSync(path.join(__dirname, 'Backend/src/app/api/expiration')),
      'API para manejar expiraciones'
    );
    
    this.checkCritical(
      fs.existsSync(path.join(__dirname, 'Backend/src/lib/cron-jobs.ts')),
      'Jobs automáticos para expiración'
    );
  }

  // 7. MONETIZACIÓN - CRÍTICO
  testMonetizacion() {
    this.logSubHeader('7. MONETIZACIÓN - CRÍTICO');
    
    this.checkFile('src/lib/mercadopago.ts', 'Integración MercadoPago');
    this.checkFile('src/app/api/payments/create-preference/route.ts', 'API crear preferencia pago');
    this.checkFile('src/app/api/payments/webhook/route.ts', 'Webhook MercadoPago');
    
    this.checkFileContent('prisma/schema.prisma', 'Payment', 'Modelo Payment');
    this.checkFileContent('prisma/schema.prisma', 'Subscription', 'Modelo Subscription');
    
    // Verificar precios específicos del plan
    this.checkCritical(
      fs.existsSync(path.join(__dirname, 'Backend/src/lib/pricing.ts')),
      'Sistema de precios (AR$5.000, AR$10.000, etc.)'
    );
    
    this.checkCritical(
      fs.existsSync(path.join(__dirname, 'Backend/src/app/api/subscriptions')),
      'API de suscripciones'
    );
    
    // Verificar límites por tipo de usuario
    this.checkCritical(
      fs.existsSync(path.join(__dirname, 'Backend/src/lib/user-limits.ts')),
      'Sistema de límites por tipo de usuario'
    );
  }

  // 8. EXTRAS Y SEGURIDAD
  testExtrasSeguridad() {
    this.logSubHeader('8. EXTRAS Y SEGURIDAD');
    
    this.checkFileContent('prisma/schema.prisma', 'Report', 'Modelo Report para reportes');
    this.checkFile('src/app/api/reports/route.ts', 'API para reportes');
    
    this.checkCritical(
      fs.existsSync(path.join(__dirname, 'Backend/src/app/admin')),
      'Dashboard de administración'
    );
    
    this.checkFileContent('src/middleware.ts', 'admin', 'Protección rutas admin');
    
    // Sistema de notificaciones
    this.checkFile('src/lib/notifications.ts', 'Sistema de notificaciones');
    this.checkFile('src/app/api/notifications/route.ts', 'API notificaciones');
  }

  // VERIFICACIONES ADICIONALES
  testFuncionalidadesAdicionales() {
    this.logSubHeader('FUNCIONALIDADES ADICIONALES');
    
    // Sistema de likes y matches
    this.checkFileContent('prisma/schema.prisma', 'Like', 'Modelo Like');
    this.checkFile('src/app/api/comunidad/likes/route.ts', 'API likes');
    
    // Sistema de mensajes
    this.checkFileContent('prisma/schema.prisma', 'Conversation', 'Modelo Conversation');
    this.checkFileContent('prisma/schema.prisma', 'Message', 'Modelo Message');
    
    // Sistema de favoritos
    this.checkFileContent('prisma/schema.prisma', 'Favorite', 'Modelo Favorite');
    this.checkFile('src/app/api/favorites/route.ts', 'API favoritos');
    
    // Estadísticas
    this.checkFile('src/app/api/stats/route.ts', 'API estadísticas');
    this.checkFileContent('prisma/schema.prisma', 'PaymentAnalytics', 'Modelo PaymentAnalytics');
  }

  // VERIFICAR ESTRUCTURA DE ARCHIVOS CRÍTICOS
  testEstructuraArchivos() {
    this.logSubHeader('ESTRUCTURA DE ARCHIVOS CRÍTICOS');
    
    const criticalFiles = [
      'prisma/schema.prisma',
      'src/app/layout.tsx',
      'src/components/navbar.tsx',
      'src/middleware.ts',
      'next.config.js',
      'package.json'
    ];
    
    criticalFiles.forEach(file => {
      this.checkFile(file, `Archivo crítico: ${file}`);
    });
  }

  // GENERAR REPORTE FINAL
  generateReport() {
    this.logHeader('📊 REPORTE FINAL - CUMPLIMIENTO PLAN TÉCNICO');
    
    const percentage = Math.round((this.score / this.totalTests) * 100);
    
    this.log(`\n🎯 PUNTUACIÓN GENERAL: ${this.score}/${this.totalTests} (${percentage}%)`, 'bold');
    
    if (percentage >= 80) {
      this.log('🟢 ESTADO: EXCELENTE', 'green');
    } else if (percentage >= 60) {
      this.log('🟡 ESTADO: BUENO (necesita mejoras)', 'yellow');
    } else {
      this.log('🔴 ESTADO: CRÍTICO (requiere atención inmediata)', 'red');
    }
    
    // Resumen por categorías
    this.log(`\n📈 RESUMEN POR CATEGORÍAS:`, 'cyan');
    this.log(`✅ Implementado completamente: ${this.results.implementado.length}`, 'green');
    this.log(`⚠️  Parcialmente implementado: ${this.results.parcial.length}`, 'yellow');
    this.log(`❌ No implementado: ${this.results.faltante.length}`, 'red');
    this.log(`🚨 Elementos críticos faltantes: ${this.results.critico.length}`, 'red');
    
    // Elementos críticos faltantes
    if (this.results.critico.length > 0) {
      this.log(`\n🚨 ELEMENTOS CRÍTICOS FALTANTES:`, 'red');
      this.results.critico.forEach(item => {
        this.log(`   • ${item}`, 'red');
      });
    }
    
    // Elementos parcialmente implementados
    if (this.results.parcial.length > 0) {
      this.log(`\n⚠️  ELEMENTOS PARCIALMENTE IMPLEMENTADOS:`, 'yellow');
      this.results.parcial.forEach(item => {
        this.log(`   • ${item}`, 'yellow');
      });
    }
    
    // Recomendaciones
    this.log(`\n💡 RECOMENDACIONES INMEDIATAS:`, 'magenta');
    
    if (this.results.critico.length > 0) {
      this.log(`   1. 🚨 PRIORIDAD CRÍTICA: Implementar sistema de monetización`, 'red');
      this.log(`   2. 🚨 PRIORIDAD CRÍTICA: Implementar caducidad de anuncios`, 'red');
      this.log(`   3. 🚨 PRIORIDAD CRÍTICA: Implementar límites por tipo de usuario`, 'red');
    }
    
    if (percentage < 80) {
      this.log(`   4. ⚠️  Completar navegación dinámica por roles`, 'yellow');
      this.log(`   5. ⚠️  Implementar dashboard de administración`, 'yellow');
      this.log(`   6. ⚠️  Agregar sistema de notificaciones`, 'yellow');
    }
    
    this.log(`\n🎯 PRÓXIMOS PASOS:`, 'cyan');
    this.log(`   1. Corregir elementos críticos faltantes`, 'white');
    this.log(`   2. Completar funcionalidades parciales`, 'white');
    this.log(`   3. Realizar testing exhaustivo de pagos`, 'white');
    this.log(`   4. Implementar dashboard de administración`, 'white');
    this.log(`   5. Preparar para producción`, 'white');
    
    // Guardar reporte en archivo
    this.saveReportToFile(percentage);
  }

  saveReportToFile(percentage) {
    const reportContent = `
# 📊 REPORTE TESTING PLAN TÉCNICO - ${new Date().toLocaleString()}

## 🎯 PUNTUACIÓN GENERAL
- **Score**: ${this.score}/${this.totalTests} (${percentage}%)
- **Estado**: ${percentage >= 80 ? 'EXCELENTE' : percentage >= 60 ? 'BUENO' : 'CRÍTICO'}

## 📈 RESUMEN POR CATEGORÍAS
- ✅ **Implementado completamente**: ${this.results.implementado.length}
- ⚠️ **Parcialmente implementado**: ${this.results.parcial.length}
- ❌ **No implementado**: ${this.results.faltante.length}
- 🚨 **Elementos críticos faltantes**: ${this.results.critico.length}

## 🚨 ELEMENTOS CRÍTICOS FALTANTES
${this.results.critico.map(item => `- ${item}`).join('\n')}

## ⚠️ ELEMENTOS PARCIALMENTE IMPLEMENTADOS
${this.results.parcial.map(item => `- ${item}`).join('\n')}

## ❌ ELEMENTOS NO IMPLEMENTADOS
${this.results.faltante.map(item => `- ${item}`).join('\n')}

## ✅ ELEMENTOS IMPLEMENTADOS CORRECTAMENTE
${this.results.implementado.map(item => `- ${item}`).join('\n')}

---
**Generado automáticamente por el sistema de testing de MisionesArrienda**
`;

    fs.writeFileSync('REPORTE-TESTING-PLAN-TECNICO-FINAL.md', reportContent);
    this.log(`\n💾 Reporte guardado en: REPORTE-TESTING-PLAN-TECNICO-FINAL.md`, 'green');
  }

  // EJECUTAR TODOS LOS TESTS
  runAllTests() {
    this.logHeader('🧪 TESTING EXHAUSTIVO - PLAN TÉCNICO MISIONESARRIENDA');
    
    this.testRegistroAutenticacion();
    this.testTiposPerfiles();
    this.testNavegacionDinamica();
    this.testPublicacionPropiedades();
    this.testPublicacionesComunidad();
    this.testCaducidadAnuncios();
    this.testMonetizacion();
    this.testExtrasSeguridad();
    this.testFuncionalidadesAdicionales();
    this.testEstructuraArchivos();
    
    this.generateReport();
  }
}

// Ejecutar el testing
const tester = new PlanTecnicoTester();
tester.runAllTests();
