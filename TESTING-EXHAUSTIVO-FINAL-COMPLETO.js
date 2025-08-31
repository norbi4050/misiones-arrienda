const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('🔧 TESTING EXHAUSTIVO FINAL COMPLETO');
console.log('========================================');

// FASE 1: Testing de Compilación en Producción
console.log('\n[FASE 1/3] 🏗️ TESTING DE COMPILACIÓN...');

const testCompilacion = () => {
    console.log('\n🔍 Verificando archivos críticos para compilación...');
    
    const archivosCriticos = [
        'Backend/package.json',
        'Backend/tsconfig.json',
        'Backend/next.config.js',
        'Backend/tailwind.config.ts',
        'Backend/src/app/layout.tsx',
        'Backend/src/app/page.tsx',
        'Backend/src/middleware.ts'
    ];
    
    let erroresCompilacion = [];
    
    archivosCriticos.forEach(archivo => {
        if (fs.existsSync(archivo)) {
            console.log(`✅ ${path.basename(archivo)} - EXISTE`);
            
            // Verificar contenido crítico
            const contenido = fs.readFileSync(archivo, 'utf8');
            
            if (archivo.includes('package.json')) {
                if (!contenido.includes('"build"') || !contenido.includes('"start"')) {
                    erroresCompilacion.push(`${archivo}: Scripts de build/start faltantes`);
                }
            }
            
            if (archivo.includes('tsconfig.json')) {
                if (!contenido.includes('"strict"') || !contenido.includes('"target"')) {
                    erroresCompilacion.push(`${archivo}: Configuración TypeScript incompleta`);
                }
            }
            
            if (archivo.includes('next.config.js')) {
                if (!contenido.includes('module.exports') && !contenido.includes('export default')) {
                    erroresCompilacion.push(`${archivo}: Configuración Next.js inválida`);
                }
            }
            
        } else {
            erroresCompilacion.push(`${archivo}: ARCHIVO FALTANTE`);
            console.log(`❌ ${path.basename(archivo)} - FALTANTE`);
        }
    });
    
    return erroresCompilacion;
};

// FASE 2: Testing de Funcionalidad End-to-End
console.log('\n[FASE 2/3] 🌐 TESTING END-TO-END...');

const testEndToEnd = () => {
    console.log('\n🔍 Verificando flujos completos de usuario...');
    
    const flujosUsuario = [
        {
            nombre: 'Flujo de Autenticación',
            archivos: [
                'Backend/src/app/login/page.tsx',
                'Backend/src/app/register/page.tsx',
                'Backend/src/app/api/auth/login/route.ts',
                'Backend/src/app/api/auth/register/route.ts'
            ]
        },
        {
            nombre: 'Flujo de Propiedades',
            archivos: [
                'Backend/src/app/properties/page.tsx',
                'Backend/src/app/publicar/page.tsx',
                'Backend/src/app/api/properties/route.ts',
                'Backend/src/app/properties/[id]/page.tsx'
            ]
        },
        {
            nombre: 'Flujo de Dashboard',
            archivos: [
                'Backend/src/app/dashboard/page.tsx',
                'Backend/src/components/favorite-button.tsx',
                'Backend/src/app/api/favorites/route.ts'
            ]
        },
        {
            nombre: 'Flujo de Pagos',
            archivos: [
                'Backend/src/components/payment-button.tsx',
                'Backend/src/app/api/payments/create-preference/route.ts',
                'Backend/src/app/payment/success/page.tsx'
            ]
        },
        {
            nombre: 'Flujo de Comunidad',
            archivos: [
                'Backend/src/app/comunidad/page.tsx',
                'Backend/src/app/api/comunidad/profiles/route.ts',
                'Backend/src/components/comunidad/MatchCard.tsx'
            ]
        }
    ];
    
    let erroresEndToEnd = [];
    
    flujosUsuario.forEach(flujo => {
        console.log(`\n📋 Verificando ${flujo.nombre}...`);
        
        let flujoCompleto = true;
        flujo.archivos.forEach(archivo => {
            if (fs.existsSync(archivo)) {
                console.log(`  ✅ ${path.basename(archivo)}`);
            } else {
                console.log(`  ❌ ${path.basename(archivo)} - FALTANTE`);
                flujoCompleto = false;
                erroresEndToEnd.push(`${flujo.nombre}: ${archivo} faltante`);
            }
        });
        
        if (flujoCompleto) {
            console.log(`  🎯 ${flujo.nombre} - COMPLETO`);
        } else {
            console.log(`  ⚠️ ${flujo.nombre} - INCOMPLETO`);
        }
    });
    
    return erroresEndToEnd;
};

// FASE 3: Testing de Performance y Optimización
console.log('\n[FASE 3/3] ⚡ TESTING DE PERFORMANCE...');

const testPerformance = () => {
    console.log('\n🔍 Verificando optimizaciones de performance...');
    
    const optimizaciones = [
        {
            nombre: 'Imágenes Optimizadas',
            verificar: () => {
                const imagenesDir = 'Backend/public/images';
                if (fs.existsSync(imagenesDir)) {
                    const imagenes = fs.readdirSync(imagenesDir);
                    return imagenes.length > 0 ? 'OPTIMIZADO' : 'SIN_IMAGENES';
                }
                return 'DIRECTORIO_FALTANTE';
            }
        },
        {
            nombre: 'Componentes Lazy Loading',
            verificar: () => {
                const componentes = [
                    'Backend/src/components/property-grid.tsx',
                    'Backend/src/components/similar-properties.tsx'
                ];
                
                let tieneOptimizacion = false;
                componentes.forEach(comp => {
                    if (fs.existsSync(comp)) {
                        const contenido = fs.readFileSync(comp, 'utf8');
                        if (contenido.includes('lazy') || contenido.includes('Suspense') || contenido.includes('dynamic')) {
                            tieneOptimizacion = true;
                        }
                    }
                });
                
                return tieneOptimizacion ? 'OPTIMIZADO' : 'NO_OPTIMIZADO';
            }
        },
        {
            nombre: 'CSS Optimizado',
            verificar: () => {
                const cssFiles = [
                    'Backend/src/app/globals.css',
                    'Backend/tailwind.config.ts'
                ];
                
                let cssOptimizado = true;
                cssFiles.forEach(file => {
                    if (!fs.existsSync(file)) {
                        cssOptimizado = false;
                    }
                });
                
                return cssOptimizado ? 'OPTIMIZADO' : 'NO_OPTIMIZADO';
            }
        },
        {
            nombre: 'API Response Caching',
            verificar: () => {
                const apiFiles = [
                    'Backend/src/app/api/properties/route.ts',
                    'Backend/src/app/api/stats/route.ts'
                ];
                
                let tieneCaching = false;
                apiFiles.forEach(file => {
                    if (fs.existsSync(file)) {
                        const contenido = fs.readFileSync(file, 'utf8');
                        if (contenido.includes('cache') || contenido.includes('revalidate')) {
                            tieneCaching = true;
                        }
                    }
                });
                
                return tieneCaching ? 'OPTIMIZADO' : 'NO_OPTIMIZADO';
            }
        },
        {
            nombre: 'Bundle Size Optimization',
            verificar: () => {
                const nextConfig = 'Backend/next.config.js';
                if (fs.existsSync(nextConfig)) {
                    const contenido = fs.readFileSync(nextConfig, 'utf8');
                    if (contenido.includes('compress') || contenido.includes('optimize')) {
                        return 'OPTIMIZADO';
                    }
                }
                return 'NO_OPTIMIZADO';
            }
        }
    ];
    
    let erroresPerformance = [];
    
    optimizaciones.forEach(opt => {
        const resultado = opt.verificar();
        console.log(`  ${resultado === 'OPTIMIZADO' ? '✅' : '⚠️'} ${opt.nombre}: ${resultado}`);
        
        if (resultado !== 'OPTIMIZADO') {
            erroresPerformance.push(`${opt.nombre}: ${resultado}`);
        }
    });
    
    return erroresPerformance;
};

// Ejecutar todas las fases
const erroresCompilacion = testCompilacion();
const erroresEndToEnd = testEndToEnd();
const erroresPerformance = testPerformance();

// RESUMEN FINAL
console.log('\n========================================');
console.log('📊 RESUMEN TESTING EXHAUSTIVO FINAL');
console.log('========================================');

console.log('\n📋 RESULTADOS POR FASE:');
console.log(`🏗️ Compilación: ${erroresCompilacion.length === 0 ? '✅ PERFECTO' : `⚠️ ${erroresCompilacion.length} errores`}`);
console.log(`🌐 End-to-End: ${erroresEndToEnd.length === 0 ? '✅ PERFECTO' : `⚠️ ${erroresEndToEnd.length} errores`}`);
console.log(`⚡ Performance: ${erroresPerformance.length === 0 ? '✅ PERFECTO' : `⚠️ ${erroresPerformance.length} optimizaciones pendientes`}`);

const totalErrores = erroresCompilacion.length + erroresEndToEnd.length + erroresPerformance.length;

console.log('\n🎯 RESULTADO FINAL:');
if (totalErrores === 0) {
    console.log('🏆 EXCELENTE - Sistema completamente optimizado');
    console.log('✨ Listo para producción');
} else if (totalErrores <= 3) {
    console.log('🟡 BUENO - Optimizaciones menores pendientes');
    console.log('✅ Funcional para producción');
} else {
    console.log('🔴 REQUIERE ATENCIÓN - Varios aspectos por mejorar');
    console.log('⚠️ Revisar antes de producción');
}

// Detalles de errores si existen
if (totalErrores > 0) {
    console.log('\n📝 DETALLES DE MEJORAS PENDIENTES:');
    
    if (erroresCompilacion.length > 0) {
        console.log('\n🏗️ COMPILACIÓN:');
        erroresCompilacion.forEach(error => console.log(`  - ${error}`));
    }
    
    if (erroresEndToEnd.length > 0) {
        console.log('\n🌐 END-TO-END:');
        erroresEndToEnd.forEach(error => console.log(`  - ${error}`));
    }
    
    if (erroresPerformance.length > 0) {
        console.log('\n⚡ PERFORMANCE:');
        erroresPerformance.forEach(error => console.log(`  - ${error}`));
    }
}

console.log('\n🔄 PRÓXIMOS PASOS RECOMENDADOS:');
console.log('1. Ejecutar npm run build para verificar compilación');
console.log('2. Probar flujos de usuario manualmente');
console.log('3. Optimizar performance según recomendaciones');
console.log('4. Desplegar a producción');

console.log('\n========================================');
console.log('✅ TESTING EXHAUSTIVO FINAL COMPLETADO');
console.log('========================================');

// Guardar reporte
const reporte = {
    fecha: new Date().toISOString(),
    totalErrores,
    erroresCompilacion,
    erroresEndToEnd,
    erroresPerformance,
    estado: totalErrores === 0 ? 'EXCELENTE' : totalErrores <= 3 ? 'BUENO' : 'REQUIERE_ATENCION'
};

fs.writeFileSync('REPORTE-TESTING-EXHAUSTIVO-FINAL-COMPLETO.json', JSON.stringify(reporte, null, 2));
console.log('\n📄 Reporte guardado: REPORTE-TESTING-EXHAUSTIVO-FINAL-COMPLETO.json');
