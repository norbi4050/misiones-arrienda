const fs = require('fs');
const path = require('path');

console.log('🚀 PASO 1: CONFIGURANDO VARIABLES DE ENTORNO DE SUPABASE');
console.log('=========================================================\n');

// Función para crear archivo .env si no existe
function crearArchivoEnv() {
    const envPath = path.join('Backend', '.env.local');
    const envExamplePath = path.join('Backend', '.env.example');
    
    console.log('📝 Creando archivo de variables de entorno...');
    
    const envContent = `# Configuración de Supabase
# =============================
# IMPORTANTE: Reemplaza estos valores con tus credenciales reales de Supabase

# URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave pública anónima de Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clave de servicio de Supabase (SOLO para servidor)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Base de datos URL (opcional, para conexiones directas)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Configuración de autenticación
NEXTAUTH_SECRET=tu-secret-key-muy-seguro-aqui
NEXTAUTH_URL=http://localhost:3000

# Configuración de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion

# Configuración de MercadoPago (opcional)
MERCADOPAGO_ACCESS_TOKEN=tu-access-token-de-mercadopago
MERCADOPAGO_PUBLIC_KEY=tu-public-key-de-mercadopago

# Configuración de desarrollo
NODE_ENV=development
`;

    try {
        // Crear archivo .env.local
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Archivo .env.local creado exitosamente');
        
        // Crear archivo .env.example para referencia
        fs.writeFileSync(envExamplePath, envContent);
        console.log('✅ Archivo .env.example creado como referencia');
        
        return true;
    } catch (error) {
        console.log('❌ Error creando archivos de entorno:', error.message);
        return false;
    }
}

// Función para verificar estructura de directorios
function verificarEstructura() {
    console.log('🔍 Verificando estructura de directorios...');
    
    const directoriosRequeridos = [
        'Backend',
        'Backend/src',
        'Backend/src/lib',
        'Backend/src/lib/supabase'
    ];
    
    let estructuraCorrecta = true;
    
    directoriosRequeridos.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`✅ ${dir}: Existe`);
        } else {
            console.log(`❌ ${dir}: No existe`);
            estructuraCorrecta = false;
        }
    });
    
    return estructuraCorrecta;
}

// Función para verificar archivos de configuración de Supabase
function verificarArchivosSupabase() {
    console.log('\n🔍 Verificando archivos de configuración de Supabase...');
    
    const archivosSupabase = [
        'Backend/src/lib/supabase/client.ts',
        'Backend/src/lib/supabase/server.ts',
        'Backend/src/middleware.ts'
    ];
    
    let archivosCorrectos = 0;
    
    archivosSupabase.forEach(archivo => {
        if (fs.existsSync(archivo)) {
            console.log(`✅ ${archivo}: Existe`);
            archivosCorrectos++;
        } else {
            console.log(`❌ ${archivo}: No existe`);
        }
    });
    
    return archivosCorrectos === archivosSupabase.length;
}

// Función para crear guía de configuración
function crearGuiaConfiguracion() {
    console.log('\n📚 Creando guía de configuración...');
    
    const guiaContent = `# 🚀 GUÍA DE CONFIGURACIÓN DE SUPABASE

## 📋 PASOS PARA CONFIGURAR SUPABASE

### 1. Crear Proyecto en Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota el nombre y región del proyecto

### 2. Obtener Credenciales
1. En tu dashboard de Supabase, ve a **Settings > API**
2. Copia los siguientes valores:
   - **Project URL**: \`https://tu-proyecto.supabase.co\`
   - **anon public key**: La clave pública anónima
   - **service_role key**: La clave de servicio (¡MANTÉN SECRETA!)

### 3. Configurar Variables de Entorno
1. Abre el archivo \`.env.local\` en la carpeta Backend
2. Reemplaza los valores de ejemplo con tus credenciales reales:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-real.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-real
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-real
\`\`\`

### 4. Configurar Base de Datos
1. En Supabase, ve a **SQL Editor**
2. Ejecuta los scripts SQL de corrección:
   - \`SUPABASE-CORRECCION-ESQUEMA-PROPERTIES.sql\`
   - \`SUPABASE-CORRECCION-AUTH.sql\`

### 5. Configurar Autenticación
1. En Supabase, ve a **Authentication > Settings**
2. Configura los providers que necesites (Email, Google, etc.)
3. Configura las URLs de redirección:
   - Site URL: \`http://localhost:3000\`
   - Redirect URLs: \`http://localhost:3000/auth/callback\`

### 6. Configurar Storage (Opcional)
1. En Supabase, ve a **Storage**
2. Crea buckets para imágenes:
   - \`property-images\`
   - \`profile-images\`
3. Configura políticas de acceso según necesites

### 7. Verificar Configuración
1. Ejecuta el script de verificación:
   \`\`\`bash
   node verificar-supabase-env.js
   \`\`\`

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Invalid API key"
- Verifica que las claves estén correctas
- Asegúrate de no tener espacios extra
- Verifica que el proyecto esté activo

### Error: "CORS policy"
- Configura las URLs permitidas en Supabase
- Verifica la configuración de Site URL

### Error: "Database connection"
- Verifica que la DATABASE_URL esté correcta
- Asegúrate de que el proyecto no esté pausado

## 📞 SOPORTE
Si tienes problemas, revisa:
1. La documentación oficial de Supabase
2. Los logs en la consola del navegador
3. Los logs del servidor Next.js
`;

    try {
        fs.writeFileSync('Backend/GUIA-CONFIGURACION-SUPABASE-PASO-A-PASO.md', guiaContent);
        console.log('✅ Guía de configuración creada exitosamente');
        return true;
    } catch (error) {
        console.log('❌ Error creando guía:', error.message);
        return false;
    }
}

// Función principal
function ejecutarPaso1() {
    console.log('🎯 Iniciando configuración de variables de entorno...\n');
    
    // Verificar estructura
    const estructuraOK = verificarEstructura();
    if (!estructuraOK) {
        console.log('\n⚠️  Advertencia: Algunos directorios no existen');
    }
    
    // Verificar archivos de Supabase
    const archivosOK = verificarArchivosSupabase();
    if (!archivosOK) {
        console.log('\n⚠️  Advertencia: Algunos archivos de Supabase no existen');
    }
    
    // Crear archivos de entorno
    const envCreado = crearArchivoEnv();
    
    // Crear guía de configuración
    const guiaCreada = crearGuiaConfiguracion();
    
    console.log('\n📊 RESUMEN DEL PASO 1:');
    console.log('========================');
    console.log(`📁 Estructura de directorios: ${estructuraOK ? '✅ Correcta' : '⚠️  Con advertencias'}`);
    console.log(`📄 Archivos de Supabase: ${archivosOK ? '✅ Correctos' : '⚠️  Con advertencias'}`);
    console.log(`🔧 Archivos .env: ${envCreado ? '✅ Creados' : '❌ Error'}`);
    console.log(`📚 Guía de configuración: ${guiaCreada ? '✅ Creada' : '❌ Error'}`);
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Abre Backend/.env.local');
    console.log('2. Reemplaza las credenciales de ejemplo con las reales');
    console.log('3. Lee la guía: Backend/GUIA-CONFIGURACION-SUPABASE-PASO-A-PASO.md');
    console.log('4. Ejecuta: node PASO-2-EJECUTAR-SCRIPTS-SQL.js');
    
    console.log('\n✅ PASO 1 COMPLETADO');
    
    return {
        estructura: estructuraOK,
        archivos: archivosOK,
        env: envCreado,
        guia: guiaCreada
    };
}

// Ejecutar
const resultado = ejecutarPaso1();

// Generar reporte
const reporte = {
    paso: 1,
    nombre: 'Configurar Variables de Entorno de Supabase',
    timestamp: new Date().toISOString(),
    resultado: resultado,
    estado: resultado.env && resultado.guia ? 'COMPLETADO' : 'CON_ADVERTENCIAS',
    archivos_creados: [
        'Backend/.env.local',
        'Backend/.env.example',
        'Backend/GUIA-CONFIGURACION-SUPABASE-PASO-A-PASO.md'
    ],
    proximos_pasos: [
        'Configurar credenciales reales en .env.local',
        'Ejecutar scripts SQL de corrección',
        'Verificar conexión con Supabase'
    ]
};

try {
    fs.writeFileSync('REPORTE-PASO-1-CONFIGURACION-ENV.json', JSON.stringify(reporte, null, 2));
    console.log('\n📄 Reporte generado: REPORTE-PASO-1-CONFIGURACION-ENV.json');
} catch (error) {
    console.log('❌ Error generando reporte:', error.message);
}
