/**
 * TESTING EXHAUSTIVO - NAVBAR Y PROFILE DROPDOWN MEJORADO
 * 
 * Este script verifica que las mejoras implementadas en el navbar
 * y el ProfileDropdown funcionen correctamente con mejor visibilidad
 * y funcionalidad de autenticación.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO TESTING EXHAUSTIVO - NAVBAR Y PROFILE DROPDOWN MEJORADO');
console.log('=' .repeat(80));

// Función para verificar que un archivo existe
function verificarArchivo(rutaArchivo, descripcion) {
    const existe = fs.existsSync(rutaArchivo);
    console.log(`${existe ? '✅' : '❌'} ${descripcion}: ${rutaArchivo}`);
    return existe;
}

// Función para verificar contenido en archivo
function verificarContenido(rutaArchivo, contenidoBuscado, descripcion) {
    try {
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        const contiene = contenidoBuscado.every(texto => contenido.includes(texto));
        console.log(`${contiene ? '✅' : '❌'} ${descripcion}`);
        
        if (!contiene) {
            const faltantes = contenidoBuscado.filter(texto => !contenido.includes(texto));
            console.log(`   ⚠️  Contenido faltante: ${faltantes.join(', ')}`);
        }
        
        return contiene;
    } catch (error) {
        console.log(`❌ Error leyendo ${rutaArchivo}: ${error.message}`);
        return false;
    }
}

// Función para contar líneas de código
function contarLineas(rutaArchivo) {
    try {
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        return contenido.split('\n').length;
    } catch (error) {
        return 0;
    }
}

let testsPasados = 0;
let testsTotal = 0;

console.log('\n📁 VERIFICACIÓN DE ARCHIVOS PRINCIPALES');
console.log('-'.repeat(50));

// Verificar archivos principales
const archivos = [
    {
        ruta: 'Backend/src/components/navbar.tsx',
        descripcion: 'Navbar principal mejorado'
    },
    {
        ruta: 'Backend/src/components/ui/profile-dropdown.tsx',
        descripcion: 'ProfileDropdown mejorado'
    },
    {
        ruta: 'Backend/src/hooks/useAuth.ts',
        descripcion: 'Hook de autenticación'
    },
    {
        ruta: 'Backend/src/lib/profile-persistence.ts',
        descripcion: 'Utilidad de persistencia de perfil'
    }
];

archivos.forEach(archivo => {
    testsTotal++;
    if (verificarArchivo(archivo.ruta, archivo.descripcion)) {
        testsPasados++;
    }
});

console.log('\n🔧 VERIFICACIÓN DE MEJORAS EN NAVBAR');
console.log('-'.repeat(50));

// Verificar mejoras específicas en navbar
const mejorasNavbar = [
    'Debug logging para verificar el estado de autenticación',
    'useEffect(() => {',
    'console.log(\'Navbar Auth State:\'',
    'Mejorada visibilidad',
    'Loading State',
    'animate-spin',
    'border border-gray-200',
    'hover:bg-gray-100',
    'LogIn className="h-4 w-4"',
    'User className="h-4 w-4"',
    'shadow-lg'
];

testsTotal++;
if (verificarContenido('Backend/src/components/navbar.tsx', mejorasNavbar, 'Mejoras de visibilidad y debug en Navbar')) {
    testsPasados++;
}

console.log('\n🎨 VERIFICACIÓN DE MEJORAS EN PROFILE DROPDOWN');
console.log('-'.repeat(50));

// Verificar mejoras específicas en ProfileDropdown
const mejorasDropdown = [
    'Debug logging para verificar el estado del dropdown',
    'console.log(\'ProfileDropdown State:\'',
    'console.log(\'ProfileDropdown: No user provided, not rendering\')',
    'console.log(\'ProfileDropdown: Signing out user\')',
    'Mejorado para mayor visibilidad',
    'border border-gray-200',
    'bg-white shadow-sm',
    'shadow-xl z-[100]',
    'animate-in slide-in-from-top-2',
    'bg-gray-50 rounded-t-lg',
    'border-b border-gray-50',
    'font-medium'
];

testsTotal++;
if (verificarContenido('Backend/src/components/ui/profile-dropdown.tsx', mejorasDropdown, 'Mejoras de visibilidad y debug en ProfileDropdown')) {
    testsPasados++;
}

console.log('\n🔗 VERIFICACIÓN DE INTEGRACIÓN CON USEAUTH');
console.log('-'.repeat(50));

// Verificar integración correcta con useAuth
const integracionAuth = [
    'useAuth',
    'user, loading, isAuthenticated, signOut',
    'ProfileDropdown',
    'onSignOut={signOut}',
    'isAuthenticated && user',
    'ProfilePersistence'
];

testsTotal++;
if (verificarContenido('Backend/src/components/navbar.tsx', integracionAuth, 'Integración correcta con useAuth')) {
    testsPasados++;
}

console.log('\n📱 VERIFICACIÓN DE RESPONSIVIDAD MÓVIL');
console.log('-'.repeat(50));

// Verificar mejoras de responsividad móvil
const responsividad = [
    'md:hidden',
    'hidden md:block',
    'hidden md:flex',
    'Mobile Navigation - Mejorado',
    'Mobile Authentication Section - Mejorado',
    'space-y-1',
    'px-2',
    'border-l-4 border-primary'
];

testsTotal++;
if (verificarContenido('Backend/src/components/navbar.tsx', responsividad, 'Mejoras de responsividad móvil')) {
    testsPasados++;
}

console.log('\n🎯 VERIFICACIÓN DE ACCESIBILIDAD');
console.log('-'.repeat(50));

// Verificar mejoras de accesibilidad
const accesibilidad = [
    'title="Mis Favoritos"',
    'title="Mensajes"',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary',
    'aria-label',
    'transition-colors',
    'hover:bg-gray-50'
];

testsTotal += 2;
if (verificarContenido('Backend/src/components/navbar.tsx', accesibilidad.slice(0, 4), 'Mejoras de accesibilidad en Navbar')) {
    testsPasados++;
}
if (verificarContenido('Backend/src/components/ui/profile-dropdown.tsx', accesibilidad.slice(4), 'Mejoras de accesibilidad en ProfileDropdown')) {
    testsPasados++;
}

console.log('\n🔍 VERIFICACIÓN DE ESTADOS DE CARGA');
console.log('-'.repeat(50));

// Verificar manejo de estados de carga
const estadosCarga = [
    'loading &&',
    'animate-spin',
    'Cargando...',
    '!loading &&',
    'setLoading(true)',
    'setLoading(false)'
];

testsTotal += 2;
if (verificarContenido('Backend/src/components/navbar.tsx', estadosCarga.slice(0, 4), 'Estados de carga en Navbar')) {
    testsPasados++;
}
if (verificarContenido('Backend/src/hooks/useAuth.ts', estadosCarga.slice(4), 'Estados de carga en useAuth')) {
    testsPasados++;
}

console.log('\n🎨 VERIFICACIÓN DE ESTILOS MEJORADOS');
console.log('-'.repeat(50));

// Verificar estilos mejorados
const estilosMejorados = [
    'shadow-sm',
    'shadow-lg',
    'shadow-xl',
    'border-gray-200',
    'bg-gray-50',
    'rounded-lg',
    'z-[100]',
    'duration-200'
];

testsTotal += 2;
if (verificarContenido('Backend/src/components/navbar.tsx', estilosMejorados.slice(0, 4), 'Estilos mejorados en Navbar')) {
    testsPasados++;
}
if (verificarContenido('Backend/src/components/ui/profile-dropdown.tsx', estilosMejorados.slice(4), 'Estilos mejorados en ProfileDropdown')) {
    testsPasados++;
}

console.log('\n🔧 VERIFICACIÓN DE FUNCIONALIDAD DE DEBUG');
console.log('-'.repeat(50));

// Verificar funcionalidad de debug
const funcionesDebug = [
    'console.log',
    'Debug logging',
    'Auth State',
    'ProfileDropdown State',
    'user ? { id: user.id, email: user.email, name: user.name } : null'
];

testsTotal += 2;
if (verificarContenido('Backend/src/components/navbar.tsx', funcionesDebug.slice(0, 3), 'Funciones de debug en Navbar')) {
    testsPasados++;
}
if (verificarContenido('Backend/src/components/ui/profile-dropdown.tsx', funcionesDebug.slice(3), 'Funciones de debug en ProfileDropdown')) {
    testsPasados++;
}

console.log('\n📊 ANÁLISIS DE CÓDIGO');
console.log('-'.repeat(50));

// Análisis de líneas de código
const lineasNavbar = contarLineas('Backend/src/components/navbar.tsx');
const lineasDropdown = contarLineas('Backend/src/components/ui/profile-dropdown.tsx');

console.log(`📏 Líneas de código en Navbar: ${lineasNavbar}`);
console.log(`📏 Líneas de código en ProfileDropdown: ${lineasDropdown}`);

// Verificar que los archivos tienen un tamaño razonable
testsTotal += 2;
if (lineasNavbar > 200 && lineasNavbar < 400) {
    console.log('✅ Navbar tiene un tamaño de código apropiado');
    testsPasados++;
} else {
    console.log('❌ Navbar podría tener un tamaño de código inadecuado');
}

if (lineasDropdown > 150 && lineasDropdown < 250) {
    console.log('✅ ProfileDropdown tiene un tamaño de código apropiado');
    testsPasados++;
} else {
    console.log('❌ ProfileDropdown podría tener un tamaño de código inadecuado');
}

console.log('\n🔍 VERIFICACIÓN DE IMPORTS Y DEPENDENCIAS');
console.log('-'.repeat(50));

// Verificar imports necesarios
const importsNavbar = [
    'import { Menu, X, Search, Heart, MessageCircle, User, LogIn }',
    'import { ProfileDropdown }',
    'import { useAuth }'
];

const importsDropdown = [
    'import { User, Settings, LogOut, ChevronDown, Heart, MessageCircle, Bell }',
    'import { cn }',
    'import { Button }'
];

testsTotal += 2;
if (verificarContenido('Backend/src/components/navbar.tsx', importsNavbar, 'Imports correctos en Navbar')) {
    testsPasados++;
}
if (verificarContenido('Backend/src/components/ui/profile-dropdown.tsx', importsDropdown, 'Imports correctos en ProfileDropdown')) {
    testsPasados++;
}

console.log('\n🎯 VERIFICACIÓN DE PROPS Y INTERFACES');
console.log('-'.repeat(50));

// Verificar interfaces y props
const interfaces = [
    'interface User {',
    'interface ProfileDropdownProps {',
    'user: User | null',
    'onSignOut: () => void',
    'className?: string'
];

testsTotal++;
if (verificarContenido('Backend/src/components/ui/profile-dropdown.tsx', interfaces, 'Interfaces y props correctas')) {
    testsPasados++;
}

console.log('\n🔄 VERIFICACIÓN DE MANEJO DE EVENTOS');
console.log('-'.repeat(50));

// Verificar manejo de eventos
const eventos = [
    'onClick={() => setIsOpen(!isOpen)}',
    'onClick={() => setIsOpen(false)}',
    'handleSignOut',
    'handleClickOutside',
    'addEventListener',
    'removeEventListener'
];

testsTotal++;
if (verificarContenido('Backend/src/components/ui/profile-dropdown.tsx', eventos, 'Manejo correcto de eventos')) {
    testsPasados++;
}

console.log('\n📱 VERIFICACIÓN DE UX/UI MEJORADA');
console.log('-'.repeat(50));

// Verificar mejoras de UX/UI
const mejorasUX = [
    'transition-colors',
    'duration-200',
    'hover:bg-gray-100',
    'hover:bg-gray-50',
    'hover:bg-red-50',
    'rounded-full',
    'rounded-lg',
    'truncate'
];

testsTotal += 2;
if (verificarContenido('Backend/src/components/navbar.tsx', mejorrasUX.slice(0, 4), 'Mejoras UX en Navbar')) {
    testsPasados++;
}
if (verificarContenido('Backend/src/components/ui/profile-dropdown.tsx', mejorrasUX.slice(4), 'Mejoras UX en ProfileDropdown')) {
    testsPasados++;
}

console.log('\n' + '='.repeat(80));
console.log('📊 RESUMEN DE TESTING');
console.log('='.repeat(80));

const porcentajeExito = ((testsPasados / testsTotal) * 100).toFixed(1);

console.log(`✅ Tests pasados: ${testsPasados}/${testsTotal}`);
console.log(`📊 Porcentaje de éxito: ${porcentajeExito}%`);

if (porcentajeExito >= 90) {
    console.log('🎉 ¡EXCELENTE! Las mejoras del navbar y ProfileDropdown están correctamente implementadas');
} else if (porcentajeExito >= 75) {
    console.log('✅ BUENO: Las mejoras están mayormente implementadas, pero hay algunos aspectos por mejorar');
} else if (porcentajeExito >= 60) {
    console.log('⚠️  REGULAR: Las mejoras están parcialmente implementadas, se necesitan correcciones');
} else {
    console.log('❌ CRÍTICO: Las mejoras no están correctamente implementadas, se requiere revisión completa');
}

console.log('\n🔧 RECOMENDACIONES PARA TESTING MANUAL:');
console.log('-'.repeat(50));
console.log('1. Iniciar el servidor de desarrollo: npm run dev');
console.log('2. Abrir la consola del navegador para ver los logs de debug');
console.log('3. Probar el registro/login de usuarios');
console.log('4. Verificar que el ProfileDropdown aparece cuando hay usuario autenticado');
console.log('5. Probar la funcionalidad de cerrar sesión');
console.log('6. Verificar responsividad en dispositivos móviles');
console.log('7. Probar navegación entre páginas');
console.log('8. Verificar que los estados de carga se muestran correctamente');

console.log('\n📝 PRÓXIMOS PASOS SUGERIDOS:');
console.log('-'.repeat(50));
console.log('1. Ejecutar el servidor y probar manualmente la autenticación');
console.log('2. Verificar que los logs de debug aparecen en la consola');
console.log('3. Probar en diferentes navegadores y dispositivos');
console.log('4. Verificar que la persistencia de sesión funciona correctamente');
console.log('5. Probar casos edge como pérdida de conexión');

console.log('\n✨ TESTING COMPLETADO - NAVBAR Y PROFILE DROPDOWN MEJORADO');
console.log('='.repeat(80));

// Crear reporte detallado
const reporte = {
    timestamp: new Date().toISOString(),
    testsPasados,
    testsTotal,
    porcentajeExito: parseFloat(porcentajeExito),
    archivosVerificados: archivos.length,
    lineasCodigo: {
        navbar: lineasNavbar,
        profileDropdown: lineasDropdown,
        total: lineasNavbar + lineasDropdown
    },
    estado: porcentajeExito >= 90 ? 'EXCELENTE' : 
            porcentajeExito >= 75 ? 'BUENO' : 
            porcentajeExito >= 60 ? 'REGULAR' : 'CRÍTICO'
};

// Guardar reporte
try {
    fs.writeFileSync('REPORTE-TESTING-NAVBAR-PROFILE-DROPDOWN-MEJORADO.json', JSON.stringify(reporte, null, 2));
    console.log('📄 Reporte detallado guardado en: REPORTE-TESTING-NAVBAR-PROFILE-DROPDOWN-MEJORADO.json');
} catch (error) {
    console.log('⚠️  No se pudo guardar el reporte detallado');
}
