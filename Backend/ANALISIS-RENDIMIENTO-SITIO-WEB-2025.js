const fs = require('fs');
const path = require('path');

console.log('🚀 ANÁLISIS DE RENDIMIENTO: Sitio Web Misiones Arrienda');
console.log('=' .repeat(70));

// 1. Análisis de estructura de archivos para identificar oportunidades
console.log('\n📊 ANÁLISIS DE ESTRUCTURA Y RENDIMIENTO:');

const performanceChecks = [
  {
    category: '🎯 OPTIMIZACIONES DE CARGA',
    checks: [
      {
        name: 'Lazy Loading de Componentes',
        path: 'src/app',
        pattern: /dynamic\(|lazy\(/g,
        description: 'Verificar uso de carga diferida en componentes pesados'
      },
      {
        name: 'Optimización de Imágenes',
        path: 'src',
        pattern: /<Image|next\/image/g,
        description: 'Verificar uso de Next.js Image para optimización automática'
      },
      {
        name: 'Prefetch de Rutas',
        path: 'src',
        pattern: /prefetch|preload/g,
        description: 'Verificar prefetch de rutas críticas'
      }
    ]
  },
  {
    category: '⚡ OPTIMIZACIONES DE SUPABASE',
    checks: [
      {
        name: 'Queries Optimizadas',
        path: 'src',
        pattern: /\.select\(|\.from\(/g,
        description: 'Verificar selectores específicos vs SELECT *'
      },
      {
        name: 'Paginación',
        path: 'src',
        pattern: /\.range\(|\.limit\(/g,
        description: 'Verificar implementación de paginación'
      },
      {
        name: 'Índices y Filtros',
        path: 'src',
        pattern: /\.eq\(|\.filter\(|\.match\(/g,
        description: 'Verificar uso eficiente de filtros'
      }
    ]
  },
  {
    category: '🎨 OPTIMIZACIONES DE UI',
    checks: [
      {
        name: 'Memoización de Componentes',
        path: 'src/components',
        pattern: /React\.memo|useMemo|useCallback/g,
        description: 'Verificar memoización para evitar re-renders innecesarios'
      },
      {
        name: 'Virtualización de Listas',
        path: 'src',
        pattern: /react-window|react-virtualized/g,
        description: 'Verificar virtualización para listas largas'
      },
      {
        name: 'Debounce en Búsquedas',
        path: 'src',
        pattern: /debounce|throttle/g,
        description: 'Verificar debounce en campos de búsqueda'
      }
    ]
  }
];

let optimizationOpportunities = [];

performanceChecks.forEach(category => {
  console.log(`\n${category.category}:`);
  
  category.checks.forEach(check => {
    const searchPath = path.join(__dirname, check.path);
    let foundInstances = 0;
    let totalFiles = 0;
    
    if (fs.existsSync(searchPath)) {
      const scanDirectory = (dir) => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
            totalFiles++;
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.match(check.pattern);
            if (matches) {
              foundInstances += matches.length;
            }
          }
        });
      };
      
      if (fs.statSync(searchPath).isDirectory()) {
        scanDirectory(searchPath);
      }
    }
    
    const status = foundInstances > 0 ? '✅' : '⚠️ ';
    console.log(`  ${status} ${check.name}: ${foundInstances} instancias en ${totalFiles} archivos`);
    console.log(`     ${check.description}`);
    
    if (foundInstances === 0) {
      optimizationOpportunities.push({
        category: category.category,
        opportunity: check.name,
        description: check.description,
        priority: check.name.includes('Supabase') ? 'Alta' : 'Media'
      });
    }
  });
});

// 2. Análisis específico de archivos críticos
console.log('\n🔍 ANÁLISIS DE ARCHIVOS CRÍTICOS:');

const criticalFiles = [
  'src/app/page.tsx',
  'src/app/properties/page.tsx', 
  'src/components/property-card.tsx',
  'src/lib/supabase/client.ts'
];

criticalFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    const size = fs.statSync(fullPath).size;
    
    console.log(`📄 ${filePath}:`);
    console.log(`   Líneas: ${lines}, Tamaño: ${(size/1024).toFixed(2)}KB`);
    
    // Verificar patrones específicos
    if (content.includes('useState') && !content.includes('useCallback')) {
      console.log('   ⚠️  Usa useState sin useCallback - posible optimización');
    }
    
    if (content.includes('.from(') && content.includes('*')) {
      console.log('   ⚠️  Posible SELECT * - optimizar queries');
    }
    
    if (content.includes('<img') && !content.includes('next/image')) {
      console.log('   ⚠️  Usa <img> en lugar de Next.js Image');
    }
  } else {
    console.log(`❌ ${filePath} no encontrado`);
  }
});

// 3. Recomendaciones específicas
console.log('\n🎯 OPORTUNIDADES DE OPTIMIZACIÓN IDENTIFICADAS:');

if (optimizationOpportunities.length > 0) {
  optimizationOpportunities.forEach((opp, index) => {
    console.log(`\n${index + 1}. ${opp.opportunity} (Prioridad: ${opp.priority})`);
    console.log(`   Categoría: ${opp.category}`);
    console.log(`   Descripción: ${opp.description}`);
  });
} else {
  console.log('✅ No se detectaron oportunidades obvias de optimización');
}

// 4. Plan de mejoras recomendado
console.log('\n📋 PLAN DE MEJORAS RECOMENDADO:');

const improvements = [
  {
    priority: 'CRÍTICA',
    item: 'Optimizar queries de Supabase',
    description: 'Usar select específicos en lugar de SELECT *',
    impact: 'Reducción 30-50% tiempo de carga'
  },
  {
    priority: 'ALTA',
    item: 'Implementar lazy loading',
    description: 'Cargar componentes pesados bajo demanda',
    impact: 'Reducción 20-40% bundle inicial'
  },
  {
    priority: 'ALTA',
    item: 'Optimizar imágenes',
    description: 'Usar Next.js Image con optimización automática',
    impact: 'Reducción 40-60% tamaño de imágenes'
  },
  {
    priority: 'MEDIA',
    item: 'Memoización de componentes',
    description: 'React.memo en componentes que re-renderizan frecuentemente',
    impact: 'Mejora 15-25% performance UI'
  },
  {
    priority: 'MEDIA',
    item: 'Debounce en búsquedas',
    description: 'Evitar queries excesivas en tiempo real',
    impact: 'Reducción 50-70% requests innecesarios'
  }
];

improvements.forEach((improvement, index) => {
  console.log(`\n${index + 1}. [${improvement.priority}] ${improvement.item}`);
  console.log(`   📝 ${improvement.description}`);
  console.log(`   📈 Impacto esperado: ${improvement.impact}`);
});

console.log('\n' + '='.repeat(70));
console.log('🎉 ANÁLISIS DE RENDIMIENTO COMPLETADO');
console.log('\n💡 PRÓXIMOS PASOS:');
console.log('1. Priorizar mejoras críticas y altas');
console.log('2. Implementar optimizaciones sin romper funcionalidad existente');
console.log('3. Medir impacto con herramientas como Lighthouse');
console.log('4. Iterar basado en métricas reales');
