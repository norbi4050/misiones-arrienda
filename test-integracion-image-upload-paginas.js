/**
 * TESTING DE INTEGRACIÓN - COMPONENTE IMAGE UPLOAD EN PÁGINAS
 * ===========================================================
 * 
 * Este script verifica la integración del componente ProfileImageUpload
 * en las páginas reales del proyecto.
 */

const fs = require('fs');
const path = require('path');

console.log('🔗 INICIANDO TESTING DE INTEGRACIÓN - IMAGE UPLOAD EN PÁGINAS');
console.log('==============================================================\n');

// Función para verificar si un archivo existe
function verificarArchivo(rutaArchivo) {
    try {
        return fs.existsSync(rutaArchivo);
    } catch (error) {
        return false;
    }
}

// Función para leer contenido de archivo
function leerArchivo(rutaArchivo) {
    try {
        return fs.readFileSync(rutaArchivo, 'utf8');
    } catch (error) {
        return null;
    }
}

// Función para verificar si una cadena contiene texto específico
function contieneTexto(contenido, texto) {
    return contenido && contenido.includes(texto);
}

// Resultados del testing
let resultados = {
    total: 0,
    exitosos: 0,
    fallidos: 0,
    detalles: []
};

function registrarTest(nombre, exitoso, mensaje = '') {
    resultados.total++;
    if (exitoso) {
        resultados.exitosos++;
        console.log(`✅ ${nombre}`);
    } else {
        resultados.fallidos++;
        console.log(`❌ ${nombre} - ${mensaje}`);
    }
    resultados.detalles.push({ nombre, exitoso, mensaje });
}

// ========================================
// FASE 1: VERIFICACIÓN DE PÁGINAS DE REGISTRO
// ========================================
console.log('📝 FASE 1: VERIFICACIÓN DE PÁGINAS DE REGISTRO');
console.log('===============================================\n');

// Página de registro principal
const paginaRegistro = 'Backend/src/app/register/page.tsx';
const existeRegistro = verificarArchivo(paginaRegistro);
registrarTest('Página de registro existe', existeRegistro, 'No se encontró la página de registro');

if (existeRegistro) {
    const contenidoRegistro = leerArchivo(paginaRegistro);
    registrarTest('Import de ProfileImageUpload en registro', 
        contieneTexto(contenidoRegistro, 'ProfileImageUpload') || contieneTexto(contenidoRegistro, 'ImageUpload'), 
        'No se encontró el import del componente');
    registrarTest('Uso del componente en registro', 
        contieneTexto(contenidoRegistro, '<ProfileImageUpload') || contieneTexto(contenidoRegistro, '<ImageUpload'), 
        'No se encontró el uso del componente');
}

// Página de registro de inmobiliaria
const paginaRegistroInmobiliaria = 'Backend/src/app/inmobiliaria/register/page.tsx';
const existeRegistroInmobiliaria = verificarArchivo(paginaRegistroInmobiliaria);
registrarTest('Página de registro inmobiliaria existe', existeRegistroInmobiliaria, 'No se encontró la página');

if (existeRegistroInmobiliaria) {
    const contenidoInmobiliaria = leerArchivo(paginaRegistroInmobiliaria);
    registrarTest('Componente en registro inmobiliaria', 
        contieneTexto(contenidoInmobiliaria, 'ProfileImageUpload') || contieneTexto(contenidoInmobiliaria, 'ImageUpload'), 
        'No se encontró el componente');
}

// Página de registro dueño directo
const paginaRegistroDueno = 'Backend/src/app/dueno-directo/register/page.tsx';
const existeRegistroDueno = verificarArchivo(paginaRegistroDueno);
registrarTest('Página de registro dueño directo existe', existeRegistroDueno, 'No se encontró la página');

if (existeRegistroDueno) {
    const contenidoDueno = leerArchivo(paginaRegistroDueno);
    registrarTest('Componente en registro dueño directo', 
        contieneTexto(contenidoDueno, 'ProfileImageUpload') || contieneTexto(contenidoDueno, 'ImageUpload'), 
        'No se encontró el componente');
}

// ========================================
// FASE 2: VERIFICACIÓN DE PÁGINAS DE PERFIL
// ========================================
console.log('\n👤 FASE 2: VERIFICACIÓN DE PÁGINAS DE PERFIL');
console.log('=============================================\n');

// Página de perfil dinámico
const paginaPerfilDinamico = 'Backend/src/app/profile/[id]/page.tsx';
const existePerfilDinamico = verificarArchivo(paginaPerfilDinamico);
registrarTest('Página de perfil dinámico existe', existePerfilDinamico, 'No se encontró la página');

if (existePerfilDinamico) {
    const contenidoPerfilDinamico = leerArchivo(paginaPerfilDinamico);
    registrarTest('Componente en perfil dinámico', 
        contieneTexto(contenidoPerfilDinamico, 'ProfileImageUpload') || contieneTexto(contenidoPerfilDinamico, 'ImageUpload'), 
        'No se encontró el componente');
}

// Página de perfil inquilino
const paginaPerfilInquilino = 'Backend/src/app/profile/inquilino/page.tsx';
const existePerfilInquilino = verificarArchivo(paginaPerfilInquilino);
registrarTest('Página de perfil inquilino existe', existePerfilInquilino, 'No se encontró la página');

if (existePerfilInquilino) {
    const contenidoPerfilInquilino = leerArchivo(paginaPerfilInquilino);
    registrarTest('Componente en perfil inquilino', 
        contieneTexto(contenidoPerfilInquilino, 'ProfileImageUpload') || contieneTexto(contenidoPerfilInquilino, 'ImageUpload'), 
        'No se encontró el componente');
}

// ========================================
// FASE 3: VERIFICACIÓN DE PÁGINAS DE COMUNIDAD
// ========================================
console.log('\n🏘️ FASE 3: VERIFICACIÓN DE PÁGINAS DE COMUNIDAD');
console.log('================================================\n');

// Página de publicar en comunidad
const paginaComunidadPublicar = 'Backend/src/app/comunidad/publicar/page.tsx';
const existeComunidadPublicar = verificarArchivo(paginaComunidadPublicar);
registrarTest('Página de publicar comunidad existe', existeComunidadPublicar, 'No se encontró la página');

if (existeComunidadPublicar) {
    const contenidoComunidadPublicar = leerArchivo(paginaComunidadPublicar);
    registrarTest('Componente en publicar comunidad', 
        contieneTexto(contenidoComunidadPublicar, 'ProfileImageUpload') || contieneTexto(contenidoComunidadPublicar, 'ImageUpload'), 
        'No se encontró el componente');
}

// Página principal de comunidad
const paginaComunidad = 'Backend/src/app/comunidad/page.tsx';
const existeComunidad = verificarArchivo(paginaComunidad);
registrarTest('Página principal de comunidad existe', existeComunidad, 'No se encontró la página');

if (existeComunidad) {
    const contenidoComunidad = leerArchivo(paginaComunidad);
    registrarTest('Componente en página comunidad', 
        contieneTexto(contenidoComunidad, 'ProfileImageUpload') || contieneTexto(contenidoComunidad, 'ImageUpload'), 
        'No se encontró el componente (puede ser normal si no se usa aquí)');
}

// ========================================
// FASE 4: VERIFICACIÓN DE PÁGINAS DE PUBLICACIÓN
// ========================================
console.log('\n📝 FASE 4: VERIFICACIÓN DE PÁGINAS DE PUBLICACIÓN');
console.log('=================================================\n');

// Página de publicar propiedad
const paginaPublicar = 'Backend/src/app/publicar/page.tsx';
const existePublicar = verificarArchivo(paginaPublicar);
registrarTest('Página de publicar existe', existePublicar, 'No se encontró la página');

if (existePublicar) {
    const contenidoPublicar = leerArchivo(paginaPublicar);
    registrarTest('Componente ImageUpload en publicar', 
        contieneTexto(contenidoPublicar, 'ImageUpload'), 
        'No se encontró el componente ImageUpload para propiedades');
    registrarTest('Import correcto en publicar', 
        contieneTexto(contenidoPublicar, "from '@/components/ui/image-upload'"), 
        'No se encontró el import del componente');
}

// Página de publicar premium
const paginaPublicarPremium = 'Backend/src/app/publicar/premium/page.tsx';
const existePublicarPremium = verificarArchivo(paginaPublicarPremium);
registrarTest('Página de publicar premium existe', existePublicarPremium, 'No se encontró la página');

if (existePublicarPremium) {
    const contenidoPublicarPremium = leerArchivo(paginaPublicarPremium);
    registrarTest('Componente en publicar premium', 
        contieneTexto(contenidoPublicarPremium, 'ImageUpload'), 
        'No se encontró el componente');
}

// ========================================
// FASE 5: VERIFICACIÓN DE COMPONENTES RELACIONADOS
// ========================================
console.log('\n🧩 FASE 5: VERIFICACIÓN DE COMPONENTES RELACIONADOS');
console.log('===================================================\n');

// Componentes de comunidad que podrían usar el upload
const componentesComunidad = [
    'Backend/src/components/comunidad/MatchCard.tsx',
    'Backend/src/components/comunidad/ConversationCard.tsx',
    'Backend/src/components/comunidad/ChatMessage.tsx'
];

componentesComunidad.forEach(componente => {
    const nombreComponente = path.basename(componente, '.tsx');
    const existe = verificarArchivo(componente);
    registrarTest(`Componente ${nombreComponente} existe`, existe, 'No se encontró el componente');
    
    if (existe) {
        const contenido = leerArchivo(componente);
        const usaImageUpload = contieneTexto(contenido, 'ProfileImageUpload') || contieneTexto(contenido, 'ImageUpload');
        registrarTest(`${nombreComponente} usa componente de imagen`, usaImageUpload, 
            'No usa el componente (puede ser normal)');
    }
});

// ========================================
// FASE 6: VERIFICACIÓN DE FORMULARIOS
// ========================================
console.log('\n📋 FASE 6: VERIFICACIÓN DE FORMULARIOS');
console.log('======================================\n');

// Buscar archivos que contengan formularios
const archivosFormulario = [
    'Backend/src/app/register/page.tsx',
    'Backend/src/app/publicar/page.tsx',
    'Backend/src/app/comunidad/publicar/page.tsx'
];

archivosFormulario.forEach(archivo => {
    const nombreArchivo = path.basename(archivo);
    const existe = verificarArchivo(archivo);
    
    if (existe) {
        const contenido = leerArchivo(archivo);
        
        // Verificar estructura de formulario
        const tieneForm = contieneTexto(contenido, '<form') || contieneTexto(contenido, 'useForm');
        registrarTest(`${nombreArchivo} tiene estructura de formulario`, tieneForm, 
            'No se encontró estructura de formulario');
        
        // Verificar manejo de estado para imágenes
        const manejaEstadoImagen = contieneTexto(contenido, 'useState') && 
            (contieneTexto(contenido, 'image') || contieneTexto(contenido, 'photo') || contieneTexto(contenido, 'avatar'));
        registrarTest(`${nombreArchivo} maneja estado de imagen`, manejaEstadoImagen, 
            'No se encontró manejo de estado para imágenes');
        
        // Verificar validación de archivos
        const validaArchivos = contieneTexto(contenido, 'File') || contieneTexto(contenido, 'FileList');
        registrarTest(`${nombreArchivo} valida archivos`, validaArchivos, 
            'No se encontró validación de archivos');
    }
});

// ========================================
// FASE 7: VERIFICACIÓN DE TIPOS Y INTERFACES
// ========================================
console.log('\n🔧 FASE 7: VERIFICACIÓN DE TIPOS Y INTERFACES');
console.log('==============================================\n');

// Verificar archivos de tipos
const archivoTipos = 'Backend/src/types/property.ts';
const existeTipos = verificarArchivo(archivoTipos);
registrarTest('Archivo de tipos existe', existeTipos, 'No se encontró el archivo de tipos');

if (existeTipos) {
    const contenidoTipos = leerArchivo(archivoTipos);
    registrarTest('Tipos para imágenes definidos', 
        contieneTexto(contenidoTipos, 'image') || contieneTexto(contenidoTipos, 'photo'), 
        'No se encontraron tipos para imágenes');
}

// ========================================
// FASE 8: VERIFICACIÓN DE HOOKS PERSONALIZADOS
// ========================================
console.log('\n🎣 FASE 8: VERIFICACIÓN DE HOOKS PERSONALIZADOS');
console.log('===============================================\n');

// Verificar hooks de autenticación que podrían usar el componente
const hooksAuth = [
    'Backend/src/hooks/useAuth.ts',
    'Backend/src/hooks/useSupabaseAuth.ts'
];

hooksAuth.forEach(hook => {
    const nombreHook = path.basename(hook, '.ts');
    const existe = verificarArchivo(hook);
    registrarTest(`Hook ${nombreHook} existe`, existe, 'No se encontró el hook');
    
    if (existe) {
        const contenido = leerArchivo(hook);
        const manejaPerfilUsuario = contieneTexto(contenido, 'profile') || contieneTexto(contenido, 'user');
        registrarTest(`${nombreHook} maneja perfil de usuario`, manejaPerfilUsuario, 
            'No maneja perfil de usuario');
    }
});

// ========================================
// FASE 9: VERIFICACIÓN DE APIS RELACIONADAS
// ========================================
console.log('\n🌐 FASE 9: VERIFICACIÓN DE APIS RELACIONADAS');
console.log('=============================================\n');

// APIs que podrían manejar subida de imágenes
const apisRelacionadas = [
    'Backend/src/app/api/users/profile/route.ts',
    'Backend/src/app/api/auth/register/route.ts',
    'Backend/src/app/api/properties/create/route.ts'
];

apisRelacionadas.forEach(api => {
    const nombreApi = path.basename(path.dirname(api)) + '/' + path.basename(api, '.ts');
    const existe = verificarArchivo(api);
    registrarTest(`API ${nombreApi} existe`, existe, 'No se encontró la API');
    
    if (existe) {
        const contenido = leerArchivo(api);
        const manejaArchivos = contieneTexto(contenido, 'File') || contieneTexto(contenido, 'FormData') || 
                              contieneTexto(contenido, 'multipart');
        registrarTest(`${nombreApi} maneja archivos`, manejaArchivos, 
            'No maneja archivos (puede ser normal)');
    }
});

// ========================================
// FASE 10: VERIFICACIÓN DE CONFIGURACIÓN
// ========================================
console.log('\n⚙️ FASE 10: VERIFICACIÓN DE CONFIGURACIÓN');
console.log('==========================================\n');

// Verificar configuración de Next.js para imágenes
const nextConfig = 'Backend/next.config.js';
const existeNextConfig = verificarArchivo(nextConfig);
registrarTest('Configuración Next.js existe', existeNextConfig, 'No se encontró next.config.js');

if (existeNextConfig) {
    const contenidoNextConfig = leerArchivo(nextConfig);
    registrarTest('Configuración de imágenes en Next.js', 
        contieneTexto(contenidoNextConfig, 'images') || contieneTexto(contenidoNextConfig, 'domains'), 
        'No se encontró configuración de imágenes');
}

// Verificar configuración de Tailwind para estilos
const tailwindConfig = 'Backend/tailwind.config.ts';
const existeTailwindConfig = verificarArchivo(tailwindConfig);
registrarTest('Configuración Tailwind existe', existeTailwindConfig, 'No se encontró tailwind.config.ts');

// ========================================
// RESUMEN FINAL
// ========================================
console.log('\n📊 RESUMEN FINAL DEL TESTING DE INTEGRACIÓN');
console.log('============================================\n');

console.log(`Total de tests ejecutados: ${resultados.total}`);
console.log(`Tests exitosos: ${resultados.exitosos} ✅`);
console.log(`Tests fallidos: ${resultados.fallidos} ❌`);

const porcentajeExito = ((resultados.exitosos / resultados.total) * 100).toFixed(2);
console.log(`Porcentaje de éxito: ${porcentajeExito}%`);

if (resultados.fallidos > 0) {
    console.log('\n❌ TESTS FALLIDOS:');
    console.log('==================');
    resultados.detalles
        .filter(test => !test.exitoso)
        .forEach(test => {
            console.log(`- ${test.nombre}: ${test.mensaje}`);
        });
}

// Análisis de integración
console.log('\n🔍 ANÁLISIS DE INTEGRACIÓN:');
console.log('===========================');

const paginasConComponente = resultados.detalles.filter(test => 
    test.nombre.includes('Componente en') && test.exitoso
).length;

const paginasSinComponente = resultados.detalles.filter(test => 
    test.nombre.includes('Componente en') && !test.exitoso
).length;

console.log(`Páginas que usan el componente: ${paginasConComponente}`);
console.log(`Páginas que no usan el componente: ${paginasSinComponente}`);

// Recomendaciones específicas
console.log('\n💡 RECOMENDACIONES DE INTEGRACIÓN:');
console.log('==================================');

if (paginasSinComponente > 0) {
    console.log('🔧 Integrar el componente en las páginas faltantes');
    console.log('📝 Verificar que los formularios manejen correctamente las imágenes');
    console.log('🎨 Asegurar consistencia visual en todas las páginas');
}

if (porcentajeExito >= 80) {
    console.log('✨ La integración está bien encaminada');
    console.log('🧪 Realizar testing manual en las páginas identificadas');
} else {
    console.log('⚠️ La integración necesita trabajo adicional');
    console.log('📋 Revisar la implementación en cada página');
}

console.log('\n🏁 TESTING DE INTEGRACIÓN COMPLETADO');
console.log('====================================');

// Generar reporte de integración
const reporteIntegracion = {
    fecha: new Date().toISOString(),
    resumen: {
        total: resultados.total,
        exitosos: resultados.exitosos,
        fallidos: resultados.fallidos,
        porcentajeExito: parseFloat(porcentajeExito)
    },
    integracion: {
        paginasConComponente,
        paginasSinComponente,
        cobertura: ((paginasConComponente / (paginasConComponente + paginasSinComponente)) * 100).toFixed(2)
    },
    detalles: resultados.detalles,
    recomendaciones: [
        'Verificar integración en páginas de registro',
        'Probar funcionalidad en páginas de perfil',
        'Validar comportamiento en formularios de publicación',
        'Asegurar consistencia visual en toda la aplicación'
    ]
};

// Guardar reporte de integración
try {
    fs.writeFileSync('REPORTE-INTEGRACION-IMAGE-UPLOAD-PAGINAS.json', JSON.stringify(reporteIntegracion, null, 2));
    console.log('📄 Reporte de integración guardado en: REPORTE-INTEGRACION-IMAGE-UPLOAD-PAGINAS.json');
} catch (error) {
    console.log('⚠️ No se pudo guardar el reporte de integración');
}

process.exit(resultados.fallidos > 0 ? 1 : 0);
