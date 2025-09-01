// 10. SCRIPT IMPLEMENTACIÓN CORRECCIÓN ENV
// Automatización para corregir archivos de variables de entorno

const fs = require('fs');
const path = require('path');

console.log('🔧 INICIANDO CORRECCIÓN DE ARCHIVOS ENV...\n');

// Configuración de archivos
const CONFIG = {
    // Archivos a eliminar
    filesToDelete: [
        '.env',                    // Raíz del proyecto
        'Backend/.env.production'  // Archivo de producción innecesario
    ],
    
    // Archivos a crear/actualizar
    filesToCreate: {
        'Backend/.env': {
            description: 'Archivo principal para desarrollo',
            content: `# === CONFIGURACIÓN DE BASE DE DATOS ===
DATABASE_URL=postgresql://postgres.qfeyhaaxyemmnohqdele:Yanina302472%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require

# === SUPABASE CONFIGURACIÓN ===
NEXT_PUBLIC_SUPABASE_URL=https://qfeyhaaxyemmnohqdele.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM

# === AUTENTICACIÓN ===
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=5685128fb42e3ceca234ecd61cac3
JWT_SECRET=671f25e53c5624cc07054c5c9fb30d5e92bccc37d7718c543a6bc02305e8011a

# === MERCADOPAGO ===
MERCADOPAGO_ACCESS_TOKEN=APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419
MERCADOPAGO_PUBLIC_KEY=APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5
MERCADOPAGO_CLIENT_ID=3647290553297438
MERCADOPAGO_CLIENT_SECRET=ENlqoDJIZ0fffS8QftXGYfvePfMDd8NO

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# === SERVICIOS EXTERNOS ===
RESEND_API_KEY=re_ZopLXSBZ_6MdVdspijuQL8A4AB3WABx9o
UPLOADTHING_SECRET=sk_live_f61619561b2e3acf1bb74a68d78348aaa5aee68aabca7213dd3d9fc76ab5bef5
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2Y2MTYxOTU2MWIyZTNhY2YxYmI3NGE2OGQ3ODM0OGFhYTVhZWU2OGFhYmNhNzIxM2RkM2Q5ZmM3NmFiNWJlZjUiLCJhcHBJZCI6Indmd29rOHV5eTYiLCJyZWdpb25zIjpbInNlYTEiXX0=

# === EMAIL CONFIGURACIÓN ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cgonzalezarchilla@gmail.com
SMTP_PASS=epfa kbht yorh gefp

# === CONFIGURACIÓN DE DESARROLLO ===
NEXT_PUBLIC_DEBUG=true
LOG_LEVEL=debug`
        },
        
        'Backend/.env.example': {
            description: 'Plantilla sin credenciales reales',
            content: `# === CONFIGURACIÓN DE BASE DE DATOS ===
# URL de conexión a PostgreSQL - Obtener de Supabase Dashboard
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/DATABASE?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:PASSWORD@HOST:PORT/DATABASE?sslmode=require

# === SUPABASE CONFIGURACIÓN ===
# Obtener de: https://app.supabase.com/project/tu-proyecto/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# === AUTENTICACIÓN ===
# URL base de la aplicación
NEXTAUTH_URL=http://localhost:3000
# Generar con: openssl rand -base64 32
NEXTAUTH_SECRET=tu-nextauth-secret-muy-seguro
JWT_SECRET=tu-jwt-secret-muy-seguro

# === MERCADOPAGO ===
# Obtener de: https://www.mercadopago.com.ar/developers/panel/credentials
MERCADOPAGO_ACCESS_TOKEN=tu-mercadopago-access-token
MERCADOPAGO_PUBLIC_KEY=tu-mercadopago-public-key
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu-mercadopago-public-key
MERCADOPAGO_CLIENT_ID=tu-client-id
MERCADOPAGO_CLIENT_SECRET=tu-client-secret

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# === SERVICIOS EXTERNOS ===
# Obtener de: https://resend.com/api-keys
RESEND_API_KEY=tu-resend-api-key
# Obtener de: https://uploadthing.com/dashboard
UPLOADTHING_SECRET=tu-uploadthing-secret
UPLOADTHING_TOKEN=tu-uploadthing-token

# === EMAIL CONFIGURACIÓN ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion

# === CONFIGURACIÓN DE DESARROLLO ===
NEXT_PUBLIC_DEBUG=true
LOG_LEVEL=debug`
        },
        
        'Backend/.env.local': {
            description: 'Archivo para desarrollo local seguro (NO commitear)',
            content: `# === ARCHIVO PARA DESARROLLO LOCAL ===
# Este archivo debe estar en .gitignore y contener credenciales reales para desarrollo

# === CONFIGURACIÓN DE BASE DE DATOS ===
DATABASE_URL=postgresql://postgres.qfeyhaaxyemmnohqdele:Yanina302472%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require

# === SUPABASE CONFIGURACIÓN ===
NEXT_PUBLIC_SUPABASE_URL=https://qfeyhaaxyemmnohqdele.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM

# === AUTENTICACIÓN ===
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=5685128fb42e3ceca234ecd61cac3
JWT_SECRET=671f25e53c5624cc07054c5c9fb30d5e92bccc37d7718c543a6bc02305e8011a

# === MERCADOPAGO ===
MERCADOPAGO_ACCESS_TOKEN=APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419
MERCADOPAGO_PUBLIC_KEY=APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5
MERCADOPAGO_CLIENT_ID=3647290553297438
MERCADOPAGO_CLIENT_SECRET=ENlqoDJIZ0fffS8QftXGYfvePfMDd8NO

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# === SERVICIOS EXTERNOS ===
RESEND_API_KEY=re_ZopLXSBZ_6MdVdspijuQL8A4AB3WABx9o
UPLOADTHING_SECRET=sk_live_f61619561b2e3acf1bb74a68d78348aaa5aee68aabca7213dd3d9fc76ab5bef5
UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX2Y2MTYxOTU2MWIyZTNhY2YxYmI3NGE2OGQ3ODM0OGFhYTVhZWU2OGFhYmNhNzIxM2RkM2Q5ZmM3NmFiNWJlZjUiLCJhcHBJZCI6Indmd29rOHV5eTYiLCJyZWdpb25zIjpbInNlYTEiXX0=

# === EMAIL CONFIGURACIÓN ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cgonzalezarchilla@gmail.com
SMTP_PASS=epfa kbht yorh gefp

# === CONFIGURACIÓN DE DESARROLLO ===
NEXT_PUBLIC_DEBUG=true
LOG_LEVEL=debug`
        }
    },
    
    // Configuración de .gitignore
    gitignoreEntries: [
        '.env.local',
        '.env',
        '*.env.local'
    ]
};

// Funciones auxiliares
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

function deleteFile(filePath) {
    try {
        if (fileExists(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Eliminado: ${filePath}`);
            return true;
        } else {
            console.log(`⚠️  No existe: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error eliminando ${filePath}:`, error.message);
        return false;
    }
}

function createFile(filePath, content, description) {
    try {
        // Crear directorio si no existe
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Creado: ${filePath} (${description})`);
        return true;
    } catch (error) {
        console.error(`❌ Error creando ${filePath}:`, error.message);
        return false;
    }
}

function updateGitignore() {
    const gitignorePath = 'Backend/.gitignore';
    
    try {
        let gitignoreContent = '';
        
        // Leer contenido existente si existe
        if (fileExists(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        }
        
        // Agregar entradas si no existen
        let updated = false;
        CONFIG.gitignoreEntries.forEach(entry => {
            if (!gitignoreContent.includes(entry)) {
                gitignoreContent += `\n${entry}`;
                updated = true;
            }
        });
        
        if (updated) {
            fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
            console.log(`✅ Actualizado: ${gitignorePath}`);
        } else {
            console.log(`⚠️  .gitignore ya está actualizado`);
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Error actualizando .gitignore:`, error.message);
        return false;
    }
}

function verifyEnvironment() {
    console.log('\n🔍 VERIFICANDO CONFIGURACIÓN...\n');
    
    const checks = [
        {
            name: 'Backend/.env existe',
            check: () => fileExists('Backend/.env')
        },
        {
            name: 'Backend/.env.example existe',
            check: () => fileExists('Backend/.env.example')
        },
        {
            name: 'Backend/.env.local existe',
            check: () => fileExists('Backend/.env.local')
        },
        {
            name: '.env (raíz) eliminado',
            check: () => !fileExists('.env')
        },
        {
            name: 'Backend/.env.production eliminado',
            check: () => !fileExists('Backend/.env.production')
        },
        {
            name: '.gitignore actualizado',
            check: () => {
                if (!fileExists('Backend/.gitignore')) return false;
                const content = fs.readFileSync('Backend/.gitignore', 'utf8');
                return CONFIG.gitignoreEntries.every(entry => content.includes(entry));
            }
        }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
        const passed = check.check();
        console.log(`${passed ? '✅' : '❌'} ${check.name}`);
        if (!passed) allPassed = false;
    });
    
    return allPassed;
}

function generateVercelConfig() {
    const vercelVars = {
        'DATABASE_URL': 'postgresql://postgres.qfeyhaaxyemmnohqdele:Yanina302472%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1',
        'DIRECT_URL': 'postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require',
        'NEXT_PUBLIC_SUPABASE_URL': 'https://qfeyhaaxyemmnohqdele.supabase.co',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
        'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
        'NEXTAUTH_URL': 'https://www.misionesarrienda.com.ar',
        'NEXTAUTH_SECRET': '5685128fb42e3ceca234ecd61cac3',
        'JWT_SECRET': '671f25e53c5624cc07054c5c9fb30d5e92bccc37d7718c543a6bc02305e8011a',
        'MERCADOPAGO_ACCESS_TOKEN': 'APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419',
        'MERCADOPAGO_PUBLIC_KEY': 'APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5',
        'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY': 'APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5',
        'MERCADOPAGO_CLIENT_ID': '3647290553297438',
        'MERCADOPAGO_CLIENT_SECRET': 'ENlqoDJIZ0fffS8QftXGYfvePfMDd8NO',
        'NODE_ENV': 'production',
        'NEXT_PUBLIC_APP_URL': 'https://www.misionesarrienda.com.ar',
        'NEXT_PUBLIC_API_URL': 'https://www.misionesarrienda.com.ar/api',
        'RESEND_API_KEY': 're_ZopLXSBZ_6MdVdspijuQL8A4AB3WABx9o',
        'UPLOADTHING_SECRET': 'sk_live_f61619561b2e3acf1bb74a68d78348aaa5aee68aabca7213dd3d9fc76ab5bef5',
        'UPLOADTHING_TOKEN': 'eyJhcGlLZXkiOiJza19saXZlX2Y2MTYxOTU2MWIyZTNhY2YxYmI3NGE2OGQ3ODM0OGFhYTVhZWU2OGFhYmNhNzIxM2RkM2Q5ZmM3NmFiNWJlZjUiLCJhcHBJZCI6Indmd29rOHV5eTYiLCJyZWdpb25zIjpbInNlYTEiXX0=',
        'SMTP_HOST': 'smtp.gmail.com',
        'SMTP_PORT': '587',
        'SMTP_USER': 'cgonzalezarchilla@gmail.com',
        'SMTP_PASS': 'epfa kbht yorh gefp',
        'NEXT_PUBLIC_DEBUG': 'false',
        'LOG_LEVEL': 'error'
    };
    
    console.log('\n📋 VARIABLES PARA VERCEL DASHBOARD:\n');
    console.log('Copiar y pegar en Vercel > Settings > Environment Variables:\n');
    
    Object.entries(vercelVars).forEach(([key, value]) => {
        console.log(`${key}=${value}`);
    });
    
    // Crear archivo de referencia
    const vercelConfigContent = Object.entries(vercelVars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    createFile('Blackbox/VERCEL-VARIABLES-ENTORNO.txt', vercelConfigContent, 'Variables para Vercel');
}

// Función principal
async function main() {
    console.log('🚀 CORRECCIÓN DE ARCHIVOS ENV - INICIANDO\n');
    
    let success = true;
    
    // PASO 1: Eliminar archivos innecesarios
    console.log('📁 PASO 1: ELIMINANDO ARCHIVOS INNECESARIOS...\n');
    CONFIG.filesToDelete.forEach(filePath => {
        if (!deleteFile(filePath)) {
            success = false;
        }
    });
    
    // PASO 2: Crear archivos corregidos
    console.log('\n📝 PASO 2: CREANDO ARCHIVOS CORREGIDOS...\n');
    Object.entries(CONFIG.filesToCreate).forEach(([filePath, config]) => {
        if (!createFile(filePath, config.content, config.description)) {
            success = false;
        }
    });
    
    // PASO 3: Actualizar .gitignore
    console.log('\n🔒 PASO 3: ACTUALIZANDO .GITIGNORE...\n');
    if (!updateGitignore()) {
        success = false;
    }
    
    // PASO 4: Verificar configuración
    const verificationPassed = verifyEnvironment();
    if (!verificationPassed) {
        success = false;
    }
    
    // PASO 5: Generar configuración de Vercel
    console.log('\n☁️  PASO 5: GENERANDO CONFIGURACIÓN DE VERCEL...\n');
    generateVercelConfig();
    
    // Resultado final
    console.log('\n' + '='.repeat(60));
    if (success && verificationPassed) {
        console.log('✅ CORRECCIÓN COMPLETADA EXITOSAMENTE');
        console.log('\n🎯 PRÓXIMOS PASOS:');
        console.log('1. Verificar que los archivos se crearon correctamente');
        console.log('2. Configurar variables en Vercel Dashboard');
        console.log('3. Probar aplicación en desarrollo: npm run dev');
        console.log('4. Hacer commit de los cambios (sin .env.local)');
        console.log('5. Desplegar a producción');
    } else {
        console.log('❌ CORRECCIÓN COMPLETADA CON ERRORES');
        console.log('\n⚠️  REVISAR:');
        console.log('1. Permisos de archivos');
        console.log('2. Estructura de directorios');
        console.log('3. Errores mostrados arriba');
    }
    console.log('='.repeat(60));
    
    // Crear reporte de ejecución
    const reportContent = `# REPORTE DE CORRECCIÓN ENV
Fecha: ${new Date().toISOString()}
Estado: ${success && verificationPassed ? 'EXITOSO' : 'CON ERRORES'}

## Archivos Eliminados:
${CONFIG.filesToDelete.map(f => `- ${f}`).join('\n')}

## Archivos Creados:
${Object.keys(CONFIG.filesToCreate).map(f => `- ${f}`).join('\n')}

## Verificación:
${success && verificationPassed ? 'TODAS LAS VERIFICACIONES PASARON' : 'ALGUNAS VERIFICACIONES FALLARON'}

## Próximos Pasos:
1. Configurar variables en Vercel
2. Probar en desarrollo
3. Desplegar a producción
`;
    
    createFile('Blackbox/REPORTE-CORRECCION-ENV.md', reportContent, 'Reporte de ejecución');
}

// Ejecutar script
if (require.main === module) {
    main().catch(error => {
        console.error('❌ ERROR CRÍTICO:', error);
        process.exit(1);
    });
}

module.exports = {
    main,
    CONFIG,
    fileExists,
    deleteFile,
    createFile,
    updateGitignore,
    verifyEnvironment,
    generateVercelConfig
};
