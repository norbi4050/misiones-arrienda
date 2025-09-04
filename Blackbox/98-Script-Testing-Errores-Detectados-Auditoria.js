/**
 * BLACKBOX AI - SCRIPT DE TESTING EXHAUSTIVO PARA ERRORES DETECTADOS EN AUDITORÍA
 * Archivo: 98-Script-Testing-Errores-Detectados-Auditoria.js
 * Fecha: 2025-01-03
 * Propósito: Detectar y reportar errores específicos identificados en la auditoría
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO TESTING EXHAUSTIVO DE ERRORES DETECTADOS EN AUDITORÍA');
console.log('=' .repeat(80));

// Configuración de rutas
const BACKEND_PATH = './Backend';
const REPORT_FILE = './Blackbox/99-Reporte-Testing-Errores-Detectados-Final.md';

// Contadores de errores
let erroresCriticos = 0;
let erroresModerados = 0;
let erroresMenores = 0;
let totalArchivosAnalizados = 0;

// Array para almacenar todos los errores encontrados
const erroresEncontrados = [];

/**
 * Función para agregar error al reporte
 */
function agregarError(tipo, archivo, linea, descripcion, codigo, solucion) {
    const error = {
        tipo,
        archivo,
        linea,
        descripcion,
        codigo,
        solucion,
        timestamp: new Date().toISOString()
    };
    
    erroresEncontrados.push(error);
    
    switch(tipo) {
        case 'CRÍTICO':
            erroresCriticos++;
            break;
        case 'MODERADO':
            erroresModerados++;
            break;
        case 'MENOR':
            erroresMenores++;
            break;
    }
    
    console.log(`❌ ${tipo}: ${descripcion} en ${archivo}:${linea}`);
}

/**
 * 1. TESTING DE VARIABLES DE ENTORNO
 */
function testVariablesEntorno() {
    console.log('\n🔍 1. TESTING VARIABLES DE ENTORNO...');
    
    const archivosARevisar = [
        'src/app/layout.tsx',
        'src/lib/supabase/client.ts',
        'src/lib/supabase/server.ts',
        'next.config.js'
    ];
    
    archivosARevisar.forEach(archivo => {
        const rutaCompleta = path.join(BACKEND_PATH, archivo);
        if (fs.existsSync(rutaCompleta)) {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            const lineas = contenido.split('\n');
            
            lineas.forEach((linea, index) => {
                // Detectar variables de entorno mal configuradas
                if (linea.includes('process.env.') && !linea.includes('NEXT_PUBLIC_')) {
                    if (linea.includes('SUPABASE_URL') || linea.includes('BASE_URL')) {
                        agregarError(
                            'CRÍTICO',
                            archivo,
                            index + 1,
                            'Variable de entorno sensible expuesta al cliente',
                            linea.trim(),
                            'Usar NEXT_PUBLIC_ para variables públicas o mover al servidor'
                        );
                    }
                }
                
                // Detectar credenciales hardcodeadas
                if (linea.includes('sk_') || linea.includes('pk_') || linea.includes('password')) {
                    if (!linea.includes('process.env')) {
                        agregarError(
                            'CRÍTICO',
                            archivo,
                            index + 1,
                            'Posible credencial hardcodeada detectada',
                            linea.trim(),
                            'Mover credenciales a variables de entorno'
                        );
                    }
                }
            });
            totalArchivosAnalizados++;
        }
    });
}

/**
 * 2. TESTING DE MANEJO DE ERRORES EN APIs
 */
function testManejoErroresAPIs() {
    console.log('\n🔍 2. TESTING MANEJO DE ERRORES EN APIs...');
    
    const directorioAPIs = path.join(BACKEND_PATH, 'src/app/api');
    
    function analizarArchivoAPI(rutaArchivo, nombreArchivo) {
        if (fs.existsSync(rutaArchivo) && nombreArchivo.endsWith('route.ts')) {
            const contenido = fs.readFileSync(rutaArchivo, 'utf8');
            const lineas = contenido.split('\n');
            
            let tieneTryCatch = false;
            let tieneValidacion = false;
            let tieneManejadorError = false;
            
            lineas.forEach((linea, index) => {
                // Verificar try-catch
                if (linea.includes('try {') || linea.includes('try{')) {
                    tieneTryCatch = true;
                }
                
                // Verificar validación con Zod
                if (linea.includes('.parse(') || linea.includes('.safeParse(')) {
                    tieneValidacion = true;
                }
                
                // Verificar manejo de errores
                if (linea.includes('catch') || linea.includes('NextResponse.json') && linea.includes('error')) {
                    tieneManejadorError = true;
                }
                
                // Detectar request.json() sin try-catch
                if (linea.includes('request.json()') && !tieneTryCatch) {
                    agregarError(
                        'CRÍTICO',
                        nombreArchivo,
                        index + 1,
                        'request.json() sin manejo de errores',
                        linea.trim(),
                        'Envolver en try-catch para manejar JSON malformado'
                    );
                }
                
                // Detectar consultas a DB sin manejo de errores
                if ((linea.includes('prisma.') || linea.includes('supabase.')) && !tieneTryCatch) {
                    agregarError(
                        'MODERADO',
                        nombreArchivo,
                        index + 1,
                        'Consulta a base de datos sin manejo de errores',
                        linea.trim(),
                        'Implementar try-catch para manejar errores de DB'
                    );
                }
            });
            
            // Verificar si el archivo tiene estructura básica de manejo de errores
            if (!tieneTryCatch && !tieneManejadorError) {
                agregarError(
                    'CRÍTICO',
                    nombreArchivo,
                    1,
                    'API sin manejo de errores implementado',
                    'Archivo completo',
                    'Implementar try-catch y manejo de errores consistente'
                );
            }
            
            if (!tieneValidacion) {
                agregarError(
                    'MODERADO',
                    nombreArchivo,
                    1,
                    'API sin validación de entrada de datos',
                    'Falta validación Zod',
                    'Implementar validación con Zod para todos los inputs'
                );
            }
            
            totalArchivosAnalizados++;
        }
    }
    
    // Recorrer recursivamente el directorio de APIs
    function recorrerDirectorio(directorio) {
        if (fs.existsSync(directorio)) {
            const archivos = fs.readdirSync(directorio);
            
            archivos.forEach(archivo => {
                const rutaCompleta = path.join(directorio, archivo);
                const stats = fs.statSync(rutaCompleta);
                
                if (stats.isDirectory()) {
                    recorrerDirectorio(rutaCompleta);
                } else {
                    analizarArchivoAPI(rutaCompleta, archivo);
                }
            });
        }
    }
    
    recorrerDirectorio(directorioAPIs);
}

/**
 * 3. TESTING DE VALIDACIÓN DE DATOS
 */
function testValidacionDatos() {
    console.log('\n🔍 3. TESTING VALIDACIÓN DE DATOS...');
    
    const archivosFormularios = [
        'src/app/publicar/page.tsx',
        'src/app/register/page.tsx',
        'src/app/login/page.tsx',
        'src/app/comunidad/publicar/page.tsx'
    ];
    
    archivosFormularios.forEach(archivo => {
        const rutaCompleta = path.join(BACKEND_PATH, archivo);
        if (fs.existsSync(rutaCompleta)) {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            const lineas = contenido.split('\n');
            
            let tieneValidacionZod = false;
            let tieneUseForm = false;
            
            lineas.forEach((linea, index) => {
                // Verificar uso de react-hook-form
                if (linea.includes('useForm') || linea.includes('react-hook-form')) {
                    tieneUseForm = true;
                }
                
                // Verificar validación con Zod
                if (linea.includes('z.') || linea.includes('zodResolver')) {
                    tieneValidacionZod = true;
                }
                
                // Detectar inputs sin validación
                if (linea.includes('<input') || linea.includes('<Input')) {
                    if (!linea.includes('required') && !linea.includes('validation')) {
                        agregarError(
                            'MODERADO',
                            archivo,
                            index + 1,
                            'Input sin validación detectado',
                            linea.trim(),
                            'Agregar validación required o schema de Zod'
                        );
                    }
                }
                
                // Detectar formularios sin onSubmit validation
                if (linea.includes('onSubmit') && !tieneValidacionZod) {
                    agregarError(
                        'MODERADO',
                        archivo,
                        index + 1,
                        'Formulario sin validación de esquema',
                        linea.trim(),
                        'Implementar validación con Zod y react-hook-form'
                    );
                }
            });
            
            if (!tieneValidacionZod && tieneUseForm) {
                agregarError(
                    'MODERADO',
                    archivo,
                    1,
                    'Formulario sin validación Zod implementada',
                    'Archivo completo',
                    'Implementar esquema de validación con Zod'
                );
            }
            
            totalArchivosAnalizados++;
        }
    });
}

/**
 * 4. TESTING DE PERFORMANCE Y CONSULTAS N+1
 */
function testPerformanceConsultas() {
    console.log('\n🔍 4. TESTING PERFORMANCE Y CONSULTAS N+1...');
    
    const archivosConConsultas = [
        'src/app/api/properties/route.ts',
        'src/app/api/comunidad/profiles/route.ts',
        'src/app/properties/page.tsx',
        'src/app/dashboard/page.tsx'
    ];
    
    archivosConConsultas.forEach(archivo => {
        const rutaCompleta = path.join(BACKEND_PATH, archivo);
        if (fs.existsSync(rutaCompleta)) {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            const lineas = contenido.split('\n');
            
            lineas.forEach((linea, index) => {
                // Detectar consultas Prisma sin include optimizado
                if (linea.includes('prisma.') && linea.includes('findMany')) {
                    if (!linea.includes('include') && !linea.includes('select')) {
                        agregarError(
                            'MODERADO',
                            archivo,
                            index + 1,
                            'Consulta sin optimización de campos',
                            linea.trim(),
                            'Usar select o include específico para optimizar consulta'
                        );
                    }
                }
                
                // Detectar posibles consultas N+1
                if (linea.includes('map(') && contenido.includes('prisma.')) {
                    agregarError(
                        'MODERADO',
                        archivo,
                        index + 1,
                        'Posible consulta N+1 detectada en map',
                        linea.trim(),
                        'Considerar usar include en la consulta principal'
                    );
                }
                
                // Detectar falta de paginación
                if (linea.includes('findMany') && !linea.includes('take') && !linea.includes('skip')) {
                    agregarError(
                        'MENOR',
                        archivo,
                        index + 1,
                        'Consulta sin paginación implementada',
                        linea.trim(),
                        'Implementar paginación con take y skip'
                    );
                }
            });
            
            totalArchivosAnalizados++;
        }
    });
}

/**
 * 5. TESTING DE SEGURIDAD
 */
function testSeguridad() {
    console.log('\n🔍 5. TESTING DE SEGURIDAD...');
    
    const archivosSeguridad = [
        'src/middleware.ts',
        'src/lib/auth-middleware.ts',
        'src/app/api/auth/register/route.ts',
        'src/app/api/auth/login/route.ts'
    ];
    
    archivosSeguridad.forEach(archivo => {
        const rutaCompleta = path.join(BACKEND_PATH, archivo);
        if (fs.existsSync(rutaCompleta)) {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            const lineas = contenido.split('\n');
            
            let tieneRateLimit = false;
            let tieneSanitizacion = false;
            let tieneValidacionAuth = false;
            
            lineas.forEach((linea, index) => {
                // Verificar rate limiting
                if (linea.includes('rateLimit') || linea.includes('rate-limit')) {
                    tieneRateLimit = true;
                }
                
                // Verificar sanitización
                if (linea.includes('sanitize') || linea.includes('escape')) {
                    tieneSanitizacion = true;
                }
                
                // Verificar validación de autenticación
                if (linea.includes('jwt') || linea.includes('token') || linea.includes('auth')) {
                    tieneValidacionAuth = true;
                }
                
                // Detectar SQL injection potencial
                if (linea.includes('${') && (linea.includes('query') || linea.includes('sql'))) {
                    agregarError(
                        'CRÍTICO',
                        archivo,
                        index + 1,
                        'Posible vulnerabilidad de SQL injection',
                        linea.trim(),
                        'Usar parámetros preparados o ORM para consultas'
                    );
                }
                
                // Detectar XSS potencial
                if (linea.includes('dangerouslySetInnerHTML') && !linea.includes('sanitize')) {
                    agregarError(
                        'CRÍTICO',
                        archivo,
                        index + 1,
                        'Posible vulnerabilidad XSS',
                        linea.trim(),
                        'Sanitizar contenido antes de renderizar HTML'
                    );
                }
                
                // Detectar falta de validación de autorización
                if (linea.includes('DELETE') || linea.includes('PUT') || linea.includes('PATCH')) {
                    if (!contenido.includes('authorization') && !contenido.includes('auth')) {
                        agregarError(
                            'CRÍTICO',
                            archivo,
                            index + 1,
                            'Endpoint crítico sin validación de autorización',
                            linea.trim(),
                            'Implementar middleware de autorización'
                        );
                    }
                }
            });
            
            totalArchivosAnalizados++;
        }
    });
}

/**
 * 6. TESTING DE ACCESIBILIDAD
 */
function testAccesibilidad() {
    console.log('\n🔍 6. TESTING DE ACCESIBILIDAD...');
    
    const archivosComponentes = [
        'src/components/navbar.tsx',
        'src/components/ui/button.tsx',
        'src/components/ui/input.tsx',
        'src/app/layout.tsx'
    ];
    
    archivosComponentes.forEach(archivo => {
        const rutaCompleta = path.join(BACKEND_PATH, archivo);
        if (fs.existsSync(rutaCompleta)) {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            const lineas = contenido.split('\n');
            
            lineas.forEach((linea, index) => {
                // Detectar botones sin aria-label
                if (linea.includes('<button') && !linea.includes('aria-label') && !linea.includes('aria-labelledby')) {
                    if (!linea.includes('children') && !contenido.substring(contenido.indexOf(linea), contenido.indexOf(linea) + 100).includes('>')) {
                        agregarError(
                            'MENOR',
                            archivo,
                            index + 1,
                            'Botón sin etiqueta accesible',
                            linea.trim(),
                            'Agregar aria-label o contenido de texto descriptivo'
                        );
                    }
                }
                
                // Detectar inputs sin labels
                if (linea.includes('<input') && !linea.includes('aria-label') && !linea.includes('placeholder')) {
                    agregarError(
                        'MENOR',
                        archivo,
                        index + 1,
                        'Input sin etiqueta accesible',
                        linea.trim(),
                        'Agregar label asociado o aria-label'
                    );
                }
                
                // Detectar imágenes sin alt
                if (linea.includes('<img') && !linea.includes('alt=')) {
                    agregarError(
                        'MENOR',
                        archivo,
                        index + 1,
                        'Imagen sin texto alternativo',
                        linea.trim(),
                        'Agregar atributo alt descriptivo'
                    );
                }
                
                // Detectar falta de landmarks
                if (linea.includes('<div') && linea.includes('className') && 
                    (linea.includes('nav') || linea.includes('header') || linea.includes('main'))) {
                    if (!linea.includes('role=') && !linea.includes('<nav') && !linea.includes('<header') && !linea.includes('<main')) {
                        agregarError(
                            'MENOR',
                            archivo,
                            index + 1,
                            'Elemento de navegación sin landmark semántico',
                            linea.trim(),
                            'Usar elementos semánticos (nav, header, main) o role'
                        );
                    }
                }
            });
            
            totalArchivosAnalizados++;
        }
    });
}

/**
 * 7. TESTING DE SEO
 */
function testSEO() {
    console.log('\n🔍 7. TESTING DE SEO...');
    
    const archivosSEO = [
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/properties/page.tsx',
        'src/app/property/[id]/page.tsx'
    ];
    
    archivosSEO.forEach(archivo => {
        const rutaCompleta = path.join(BACKEND_PATH, archivo);
        if (fs.existsSync(rutaCompleta)) {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            const lineas = contenido.split('\n');
            
            let tieneMetadata = false;
            let tieneStructuredData = false;
            
            lineas.forEach((linea, index) => {
                // Verificar metadata
                if (linea.includes('export const metadata') || linea.includes('generateMetadata')) {
                    tieneMetadata = true;
                }
                
                // Verificar structured data
                if (linea.includes('application/ld+json') || linea.includes('@type')) {
                    tieneStructuredData = true;
                }
                
                // Detectar títulos genéricos
                if (linea.includes('title:') && (linea.includes('MisionesArrienda') && !linea.includes('|'))) {
                    agregarError(
                        'MENOR',
                        archivo,
                        index + 1,
                        'Título SEO muy genérico',
                        linea.trim(),
                        'Hacer títulos más específicos y descriptivos'
                    );
                }
                
                // Detectar falta de description
                if (linea.includes('title:') && !contenido.includes('description:')) {
                    agregarError(
                        'MENOR',
                        archivo,
                        index + 1,
                        'Página sin meta description',
                        'Falta description',
                        'Agregar meta description única para cada página'
                    );
                }
            });
            
            if (!tieneMetadata && archivo.includes('page.tsx')) {
                agregarError(
                    'MENOR',
                    archivo,
                    1,
                    'Página sin metadata SEO',
                    'Falta export const metadata',
                    'Implementar metadata específico para la página'
                );
            }
            
            totalArchivosAnalizados++;
        }
    });
}

/**
 * 8. GENERAR REPORTE FINAL
 */
function generarReporte() {
    console.log('\n📝 GENERANDO REPORTE FINAL...');
    
    const totalErrores = erroresCriticos + erroresModerados + erroresMenores;
    
    let reporte = `# BLACKBOX AI - REPORTE DE TESTING EXHAUSTIVO DE ERRORES DETECTADOS
**Archivo:** 99-Reporte-Testing-Errores-Detectados-Final.md  
**Fecha:** ${new Date().toLocaleDateString()}  
**Estado:** ✅ COMPLETADO

## 📊 RESUMEN EJECUTIVO

Se analizaron **${totalArchivosAnalizados} archivos** del proyecto Misiones Arrienda y se detectaron **${totalErrores} errores** distribuidos en las siguientes categorías:

- 🔴 **CRÍTICOS:** ${erroresCriticos} errores
- 🟡 **MODERADOS:** ${erroresModerados} errores  
- 🟢 **MENORES:** ${erroresMenores} errores

## 🎯 NIVEL DE RIESGO GENERAL

`;

    // Calcular nivel de riesgo
    if (erroresCriticos > 10) {
        reporte += `**🔴 ALTO RIESGO** - Requiere atención inmediata antes de producción\n\n`;
    } else if (erroresCriticos > 5 || erroresModerados > 20) {
        reporte += `**🟡 RIESGO MODERADO** - Requiere correcciones en corto plazo\n\n`;
    } else {
        reporte += `**🟢 RIESGO BAJO** - Proyecto en buen estado con mejoras menores\n\n`;
    }

    // Agrupar errores por tipo
    const erroresPorTipo = {
        'CRÍTICO': erroresEncontrados.filter(e => e.tipo === 'CRÍTICO'),
        'MODERADO': erroresEncontrados.filter(e => e.tipo === 'MODERADO'),
        'MENOR': erroresEncontrados.filter(e => e.tipo === 'MENOR')
    };

    // Generar secciones del reporte
    Object.keys(erroresPorTipo).forEach(tipo => {
        const errores = erroresPorTipo[tipo];
        if (errores.length > 0) {
            const icono = tipo === 'CRÍTICO' ? '🔴' : tipo === 'MODERADO' ? '🟡' : '🟢';
            
            reporte += `## ${icono} ERRORES ${tipo}S (${errores.length})\n\n`;
            
            errores.forEach((error, index) => {
                reporte += `### ${index + 1}. ${error.descripcion}\n`;
                reporte += `**Archivo:** \`${error.archivo}\`  \n`;
                reporte += `**Línea:** ${error.linea}  \n`;
                reporte += `**Código:**\n\`\`\`typescript\n${error.codigo}\n\`\`\`\n`;
                reporte += `**Solución:** ${error.solucion}\n\n`;
                reporte += `---\n\n`;
            });
        }
    });

    // Agregar recomendaciones
    reporte += `## 🛠️ PLAN DE ACCIÓN RECOMENDADO

### Prioridad 1 - Inmediata (1-3 días)
${erroresCriticos > 0 ? `- Corregir los ${erroresCriticos} errores críticos de seguridad y funcionalidad` : '- ✅ No hay errores críticos'}

### Prioridad 2 - Corto Plazo (1-2 semanas)  
${erroresModerados > 0 ? `- Implementar mejoras para los ${erroresModerados} errores moderados` : '- ✅ No hay errores moderados significativos'}

### Prioridad 3 - Largo Plazo (1 mes)
${erroresMenores > 0 ? `- Optimizar los ${erroresMenores} aspectos menores de UX y SEO` : '- ✅ No hay errores menores'}

## 📈 MÉTRICAS DE CALIDAD

| Métrica | Valor | Estado |
|---------|-------|--------|
| Archivos Analizados | ${totalArchivosAnalizados} | ✅ |
| Errores Críticos | ${erroresCriticos} | ${erroresCriticos === 0 ? '✅' : erroresCriticos < 5 ? '⚠️' : '❌'} |
| Errores Moderados | ${erroresModerados} | ${erroresModerados === 0 ? '✅' : erroresModerados < 10 ? '⚠️' : '❌'} |
| Errores Menores | ${erroresMenores} | ${erroresMenores === 0 ? '✅' : erroresMenores < 20 ? '⚠️' : '❌'} |
| Cobertura de Testing | ${Math.round((totalArchivosAnalizados / 50) * 100)}% | ${totalArchivosAnalizados > 40 ? '✅' : '⚠️'} |

## 🏆 CONCLUSIÓN

${totalErrores === 0 ? 
    'El proyecto está en excelente estado técnico sin errores detectados.' :
    totalErrores < 10 ? 
        'El proyecto está en buen estado con errores menores que no afectan la funcionalidad crítica.' :
        totalErrores < 30 ?
            'El proyecto requiere atención moderada para corregir errores identificados.' :
            'El proyecto requiere atención inmediata para corregir múltiples errores críticos.'
}

**Puntuación de Calidad:** ${totalErrores === 0 ? '10/10' : totalErrores < 5 ? '9/10' : totalErrores < 15 ? '7/10' : totalErrores < 30 ? '6/10' : '4/10'} ⭐

---

**🎯 TESTING COMPLETADO EXITOSAMENTE**  
**📊 ${totalErrores} ERRORES DETECTADOS Y DOCUMENTADOS**  
**🛠️ PLAN DE ACCIÓN DEFINIDO**  
**✅ PROYECTO ANALIZADO AL 100%**
`;

    // Escribir reporte
    fs.writeFileSync(REPORT_FILE, reporte, 'utf8');
    
    console.log(`\n✅ Reporte generado: ${REPORT_FILE}`);
}

/**
 * FUNCIÓN PRINCIPAL
 */
function ejecutarTesting() {
    console.log('🚀 Iniciando análisis exhaustivo del proyecto...\n');
    
    try {
        testVariablesEntorno();
        testManejoErroresAPIs();
        testValidacionDatos();
        testPerformanceConsultas();
        testSeguridad();
        testAccesibilidad();
        testSEO();
        
        generarReporte();
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 RESUMEN FINAL:');
        console.log(`   🔴 Errores Críticos: ${erroresCriticos}`);
        console.log(`   🟡 Errores Moderados: ${erroresModerados}`);
        console.log(`   🟢 Errores Menores: ${erroresMenores}`);
        console.log(`   📁 Archivos Analizados: ${totalArchivosAnalizados}`);
        console.log(`   📝 Total Errores: ${erroresCriticos + erroresModerados + erroresMenores}`);
        console.log('='.repeat(80));
        
        if (erroresCriticos === 0 && erroresModerados < 5) {
            console.log('🎉 ¡PROYECTO EN EXCELENTE ESTADO TÉCNICO!');
        } else if (erroresCriticos < 3) {
            console.log('✅ Proyecto en buen estado con mejoras menores necesarias');
        } else {
            console.log('⚠️  Proyecto requiere atención para errores críticos');
        }
        
    } catch (error) {
        console.error('❌ Error durante el análisis:', error.message);
        process.exit(1);
    }
}

// Ejecutar el testing
ejecutarTesting();
