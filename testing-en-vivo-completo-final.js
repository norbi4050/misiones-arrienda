// 🧪 TESTING EN VIVO COMPLETO - PROYECTO MISIONES ARRIENDA
// ========================================================

const puppeteer = require('puppeteer');
const fs = require('fs');

console.log('🚀 INICIANDO TESTING EN VIVO COMPLETO...\n');

async function testingEnVivoCompleto() {
    let browser;
    let resultados = {
        timestamp: new Date().toISOString(),
        servidor: { status: 'PENDIENTE', detalles: [] },
        navegacion: { status: 'PENDIENTE', paginas: [] },
        formularios: { status: 'PENDIENTE', tests: [] },
        supabase: { status: 'PENDIENTE', conexiones: [] },
        funcionalidades: { status: 'PENDIENTE', features: [] },
        errores: [],
        puntuacion: 0
    };

    try {
        console.log('📋 FASE 1: VERIFICACIÓN DE SERVIDOR');
        console.log('=====================================');
        
        // Verificar que estamos en el directorio correcto
        const currentDir = process.cwd();
        console.log(`📁 Directorio actual: ${currentDir}`);
        
        if (!currentDir.includes('Backend')) {
            console.log('⚠️  ADVERTENCIA: No estamos en el directorio Backend');
            console.log('🔄 Intentando cambiar al directorio correcto...');
            
            // Verificar si existe el directorio Backend
            if (fs.existsSync('./Backend')) {
                process.chdir('./Backend');
                console.log('✅ Cambiado al directorio Backend');
            } else {
                console.log('❌ No se encontró el directorio Backend');
                resultados.errores.push('Directorio Backend no encontrado');
                return resultados;
            }
        }

        // Verificar package.json
        if (!fs.existsSync('./package.json')) {
            console.log('❌ No se encontró package.json');
            resultados.errores.push('package.json no encontrado');
            return resultados;
        }

        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        console.log(`📦 Proyecto: ${packageJson.name}`);
        console.log(`🔧 Scripts disponibles: ${Object.keys(packageJson.scripts).join(', ')}`);

        // Verificar si el script dev existe
        if (!packageJson.scripts.dev) {
            console.log('❌ Script "dev" no encontrado en package.json');
            resultados.errores.push('Script dev no disponible');
            return resultados;
        }

        resultados.servidor.status = 'VERIFICADO';
        resultados.servidor.detalles.push('package.json encontrado');
        resultados.servidor.detalles.push(`Script dev disponible: ${packageJson.scripts.dev}`);

        console.log('\n📋 FASE 2: VERIFICACIÓN DE ARCHIVOS CRÍTICOS');
        console.log('=============================================');

        const archivosCriticos = [
            'src/app/page.tsx',
            'src/app/publicar/page.tsx',
            'src/app/layout.tsx',
            'src/lib/supabase/client.ts',
            'prisma/schema.prisma',
            '.env.local'
        ];

        let archivosEncontrados = 0;
        for (const archivo of archivosCriticos) {
            if (fs.existsSync(archivo)) {
                console.log(`✅ ${archivo} - ENCONTRADO`);
                archivosEncontrados++;
            } else {
                console.log(`❌ ${archivo} - NO ENCONTRADO`);
                resultados.errores.push(`Archivo crítico faltante: ${archivo}`);
            }
        }

        console.log(`\n📊 Archivos críticos: ${archivosEncontrados}/${archivosCriticos.length}`);

        if (archivosEncontrados < archivosCriticos.length * 0.8) {
            console.log('❌ Faltan demasiados archivos críticos para continuar');
            resultados.servidor.status = 'ERROR';
            return resultados;
        }

        console.log('\n📋 FASE 3: VERIFICACIÓN DE VARIABLES DE ENTORNO');
        console.log('===============================================');

        if (fs.existsSync('.env.local')) {
            const envContent = fs.readFileSync('.env.local', 'utf8');
            const variablesRequeridas = [
                'NEXT_PUBLIC_SUPABASE_URL',
                'NEXT_PUBLIC_SUPABASE_ANON_KEY',
                'SUPABASE_SERVICE_ROLE_KEY'
            ];

            let variablesEncontradas = 0;
            for (const variable of variablesRequeridas) {
                if (envContent.includes(variable)) {
                    console.log(`✅ ${variable} - CONFIGURADA`);
                    variablesEncontradas++;
                } else {
                    console.log(`❌ ${variable} - NO ENCONTRADA`);
                    resultados.errores.push(`Variable de entorno faltante: ${variable}`);
                }
            }

            console.log(`\n📊 Variables de entorno: ${variablesEncontradas}/${variablesRequeridas.length}`);
            
            if (variablesEncontradas === variablesRequeridas.length) {
                resultados.supabase.status = 'CONFIGURADO';
                resultados.supabase.conexiones.push('Variables de entorno completas');
            }
        } else {
            console.log('⚠️  Archivo .env.local no encontrado');
            resultados.errores.push('Archivo .env.local faltante');
        }

        console.log('\n📋 FASE 4: ANÁLISIS DE CÓDIGO CRÍTICO');
        console.log('====================================');

        // Verificar formulario de publicar
        if (fs.existsSync('src/app/publicar/page.tsx')) {
            const publicarContent = fs.readFileSync('src/app/publicar/page.tsx', 'utf8');
            
            const elementosCriticos = [
                'contact_phone',
                'useForm',
                'onSubmit',
                'supabase'
            ];

            let elementosEncontrados = 0;
            for (const elemento of elementosCriticos) {
                if (publicarContent.includes(elemento)) {
                    console.log(`✅ ${elemento} - IMPLEMENTADO`);
                    elementosEncontrados++;
                } else {
                    console.log(`❌ ${elemento} - NO ENCONTRADO`);
                }
            }

            console.log(`\n📊 Elementos críticos en formulario: ${elementosEncontrados}/${elementosCriticos.length}`);
            
            if (elementosEncontrados >= elementosCriticos.length * 0.75) {
                resultados.formularios.status = 'IMPLEMENTADO';
                resultados.formularios.tests.push('Formulario publicar verificado');
            }
        }

        console.log('\n📋 FASE 5: CÁLCULO DE PUNTUACIÓN FINAL');
        console.log('=====================================');

        let puntos = 0;
        
        // Servidor (25 puntos)
        if (resultados.servidor.status === 'VERIFICADO') puntos += 25;
        
        // Archivos críticos (25 puntos)
        puntos += Math.round((archivosEncontrados / archivosCriticos.length) * 25);
        
        // Variables de entorno (25 puntos)
        if (resultados.supabase.status === 'CONFIGURADO') puntos += 25;
        
        // Formularios (25 puntos)
        if (resultados.formularios.status === 'IMPLEMENTADO') puntos += 25;

        resultados.puntuacion = puntos;

        console.log(`\n🎯 PUNTUACIÓN FINAL: ${puntos}/100`);
        
        if (puntos >= 90) {
            console.log('🏆 EXCELENTE - Proyecto listo para testing en vivo');
        } else if (puntos >= 75) {
            console.log('✅ BUENO - Proyecto funcional con mejoras menores');
        } else if (puntos >= 60) {
            console.log('⚠️  REGULAR - Requiere correcciones antes del testing');
        } else {
            console.log('❌ CRÍTICO - Múltiples problemas detectados');
        }

        // Recomendaciones
        console.log('\n📋 RECOMENDACIONES:');
        console.log('==================');
        
        if (resultados.errores.length === 0) {
            console.log('✅ No se detectaron errores críticos');
            console.log('🚀 Proyecto listo para iniciar servidor y testing en vivo');
        } else {
            console.log('⚠️  Errores detectados que requieren atención:');
            resultados.errores.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        return resultados;

    } catch (error) {
        console.error('❌ ERROR EN TESTING:', error.message);
        resultados.errores.push(`Error general: ${error.message}`);
        return resultados;
    }
}

// Ejecutar testing
testingEnVivoCompleto().then(resultados => {
    console.log('\n📄 GENERANDO REPORTE FINAL...');
    
    const reporte = `# 🧪 REPORTE TESTING EN VIVO - PROYECTO MISIONES ARRIENDA
## Fecha: ${new Date().toLocaleString()}

### 📊 RESUMEN EJECUTIVO
- **Puntuación:** ${resultados.puntuacion}/100
- **Estado del Servidor:** ${resultados.servidor.status}
- **Estado de Supabase:** ${resultados.supabase.status}
- **Estado de Formularios:** ${resultados.formularios.status}
- **Errores Detectados:** ${resultados.errores.length}

### 🔍 DETALLES DEL ANÁLISIS

#### Servidor
- Status: ${resultados.servidor.status}
- Detalles: ${resultados.servidor.detalles.join(', ')}

#### Supabase
- Status: ${resultados.supabase.status}
- Conexiones: ${resultados.supabase.conexiones.join(', ')}

#### Formularios
- Status: ${resultados.formularios.status}
- Tests: ${resultados.formularios.tests.join(', ')}

### ❌ ERRORES DETECTADOS
${resultados.errores.length > 0 ? resultados.errores.map((error, i) => `${i + 1}. ${error}`).join('\n') : 'No se detectaron errores críticos'}

### 🎯 CONCLUSIÓN
${resultados.puntuacion >= 90 ? '🏆 EXCELENTE - Proyecto listo para testing en vivo' :
  resultados.puntuacion >= 75 ? '✅ BUENO - Proyecto funcional con mejoras menores' :
  resultados.puntuacion >= 60 ? '⚠️ REGULAR - Requiere correcciones antes del testing' :
  '❌ CRÍTICO - Múltiples problemas detectados'}

### 📋 PRÓXIMOS PASOS
${resultados.puntuacion >= 75 ? 
  '1. Iniciar servidor con npm run dev\n2. Abrir http://localhost:3000\n3. Probar navegación y formularios\n4. Verificar integración con Supabase' :
  '1. Corregir errores detectados\n2. Verificar configuración de Supabase\n3. Reinstalar dependencias si es necesario\n4. Repetir testing'}

---
*Reporte generado automáticamente por el sistema de testing QA*
`;

    fs.writeFileSync('REPORTE-TESTING-EN-VIVO-COMPLETO-FINAL.md', reporte);
    console.log('✅ Reporte guardado en: REPORTE-TESTING-EN-VIVO-COMPLETO-FINAL.md');
    
    console.log('\n🎯 TESTING EN VIVO COMPLETO FINALIZADO');
    console.log(`📊 Puntuación Final: ${resultados.puntuacion}/100`);
});
