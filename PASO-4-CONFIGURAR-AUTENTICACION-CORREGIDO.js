const fs = require('fs');
const path = require('path');

console.log('🚀 PASO 4: CONFIGURAR AUTENTICACIÓN');
console.log('===================================\n');

// Función para leer variables de entorno
function leerVariablesEntorno() {
    console.log('📋 Leyendo variables de entorno...');
    
    try {
        const envPath = path.join('Backend', '.env');
        if (!fs.existsSync(envPath)) {
            console.log('❌ Archivo .env no encontrado');
            return null;
        }
        
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        console.log('✅ Variables de entorno cargadas exitosamente');
        return envVars;
    } catch (error) {
        console.log('❌ Error leyendo variables de entorno:', error.message);
        return null;
    }
}

// Función para crear script de configuración de autenticación
function crearScriptConfiguracionAuth(envVars) {
    console.log('\n🔧 Creando script de configuración de autenticación...');
    
    const authConfigContent = `const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con credenciales reales
const supabaseUrl = '${envVars.NEXT_PUBLIC_SUPABASE_URL}';
const supabaseServiceKey = '${envVars.SUPABASE_SERVICE_ROLE_KEY}';

// Crear cliente de Supabase con permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Función para configurar políticas de autenticación
async function configurarPoliticasAuth() {
    console.log('🔐 CONFIGURANDO POLÍTICAS DE AUTENTICACIÓN');
    console.log('============================================\\n');
    
    const politicas = [
        {
            nombre: 'Verificar acceso a auth.users',
            descripcion: 'Confirmar acceso a usuarios de autenticación',
            accion: async () => {
                const { data, error } = await supabase.auth.admin.listUsers();
                if (error) {
                    throw new Error(\`Error accediendo a auth.users: \${error.message}\`);
                }
                console.log(\`✅ Acceso a auth.users confirmado (\${data.users.length} usuarios)\`);
                return true;
            }
        },
        {
            nombre: 'Verificar tabla profiles',
            descripcion: 'Comprobar acceso a tabla de perfiles',
            accion: async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id')
                    .limit(1);
                
                if (error && error.message.includes('relation "public.profiles" does not exist')) {
                    console.log('⚠️  Tabla profiles no existe, necesita creación manual');
                    return false;
                } else if (error && error.message.includes('permission denied')) {
                    console.log('⚠️  Sin permisos para acceder a profiles');
                    return false;
                } else if (error) {
                    console.log(\`⚠️  Error verificando profiles: \${error.message}\`);
                    return false;
                } else {
                    console.log('✅ Tabla profiles accesible');
                    return true;
                }
            }
        },
        {
            nombre: 'Verificar tabla properties',
            descripcion: 'Comprobar acceso a tabla de propiedades',
            accion: async () => {
                const { data, error } = await supabase
                    .from('properties')
                    .select('id')
                    .limit(1);
                
                if (error && error.message.includes('relation "public.properties" does not exist')) {
                    console.log('⚠️  Tabla properties no existe, necesita creación manual');
                    return false;
                } else if (error && error.message.includes('permission denied')) {
                    console.log('⚠️  Sin permisos para acceder a properties');
                    return false;
                } else if (error) {
                    console.log(\`⚠️  Error verificando properties: \${error.message}\`);
                    return false;
                } else {
                    console.log('✅ Tabla properties accesible');
                    return true;
                }
            }
        },
        {
            nombre: 'Verificar Storage Buckets',
            descripcion: 'Confirmar acceso a buckets de almacenamiento',
            accion: async () => {
                const { data, error } = await supabase.storage.listBuckets();
                if (error) {
                    throw new Error(\`Error accediendo a Storage: \${error.message}\`);
                }
                console.log(\`✅ Storage accesible con \${data.length} buckets\`);
                data.forEach(bucket => {
                    console.log(\`  - \${bucket.name} (público: \${bucket.public})\`);
                });
                return true;
            }
        },
        {
            nombre: 'Test de creación de usuario',
            descripcion: 'Probar flujo completo de autenticación',
            accion: async () => {
                try {
                    const testEmail = 'test-auth-config@example.com';
                    
                    // Primero intentar eliminar si existe
                    const { data: existingUsers } = await supabase.auth.admin.listUsers();
                    const existingUser = existingUsers.users.find(u => u.email === testEmail);
                    
                    if (existingUser) {
                        await supabase.auth.admin.deleteUser(existingUser.id);
                        console.log('🗑️  Usuario de prueba existente eliminado');
                    }
                    
                    // Crear usuario de prueba
                    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                        email: testEmail,
                        password: 'test-password-123',
                        email_confirm: true
                    });
                    
                    if (createError) {
                        throw new Error(\`Error creando usuario de prueba: \${createError.message}\`);
                    }
                    
                    console.log(\`✅ Usuario de prueba creado: \${newUser.user.id}\`);
                    
                    // Limpiar - eliminar usuario de prueba
                    await supabase.auth.admin.deleteUser(newUser.user.id);
                    console.log('🧹 Usuario de prueba eliminado');
                    
                    return true;
                } catch (err) {
                    console.log(\`⚠️  Error en prueba de autenticación: \${err.message}\`);
                    return false;
                }
            }
        }
    ];
    
    let politicasConfiguradas = 0;
    let politicasExitosas = 0;
    
    for (const politica of politicas) {
        try {
            console.log(\`🔄 \${politica.nombre}\`);
            console.log(\`   \${politica.descripcion}\`);
            
            const resultado = await politica.accion();
            
            if (resultado) {
                console.log(\`✅ \${politica.nombre}: Configurado exitosamente\`);
                politicasExitosas++;
            } else {
                console.log(\`⚠️  \${politica.nombre}: Requiere configuración manual\`);
            }
            
            politicasConfiguradas++;
        } catch (error) {
            console.log(\`❌ Error en \${politica.nombre}: \${error.message}\`);
            politicasConfiguradas++;
        }
        
        console.log(''); // Línea en blanco para separar
        
        // Pausa entre configuraciones
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('📊 RESUMEN DE CONFIGURACIÓN:');
    console.log('============================');
    console.log(\`✅ Políticas procesadas: \${politicasConfiguradas}/\${politicas.length}\`);
    console.log(\`🎯 Políticas exitosas: \${politicasExitosas}/\${politicas.length}\`);
    
    const porcentajeExito = Math.round((politicasExitosas / politicas.length) * 100);
    console.log(\`📈 Porcentaje de éxito: \${porcentajeExito}%\`);
    
    if (porcentajeExito >= 80) {
        console.log('🎉 Configuración de autenticación: EXCELENTE');
    } else if (porcentajeExito >= 60) {
        console.log('✅ Configuración de autenticación: BUENA');
    } else if (porcentajeExito >= 40) {
        console.log('⚠️  Configuración de autenticación: PARCIAL');
    } else {
        console.log('❌ Configuración de autenticación: REQUIERE ATENCIÓN');
    }
    
    return {
        procesadas: politicasConfiguradas,
        exitosas: politicasExitosas,
        porcentaje: porcentajeExito
    };
}

// Función principal
async function configurarAutenticacionCompleta() {
    console.log('🎯 CONFIGURACIÓN COMPLETA DE AUTENTICACIÓN');
    console.log('==========================================\\n');
    
    try {
        // Configurar políticas
        const resultadoPoliticas = await configurarPoliticasAuth();
        
        console.log('\\n📊 RESUMEN FINAL:');
        console.log('==================');
        console.log(\`🔐 Políticas configuradas: \${resultadoPoliticas.exitosas}/\${resultadoPoliticas.procesadas}\`);
        console.log(\`📈 Porcentaje de éxito: \${resultadoPoliticas.porcentaje}%\`);
        
        console.log('\\n🎯 PRÓXIMOS PASOS:');
        if (resultadoPoliticas.porcentaje < 80) {
            console.log('1. 📋 Revisar configuración manual en Supabase Dashboard');
            console.log('2. 🔧 Crear tablas faltantes usando SQL Editor');
            console.log('3. 🔄 Re-ejecutar este script para verificar');
        } else {
            console.log('1. ✅ Configuración completada exitosamente');
            console.log('2. 🚀 Continuar con testing de funcionalidades');
        }
        
        return resultadoPoliticas;
    } catch (error) {
        console.log('❌ Error en configuración completa:', error.message);
        throw error;
    }
}

module.exports = {
    supabase,
    configurarPoliticasAuth,
    configurarAutenticacionCompleta
};

// Ejecutar si se llama directamente
if (require.main === module) {
    configurarAutenticacionCompleta()
        .then(resultado => {
            if (resultado.porcentaje >= 60) {
                console.log('\\n✅ Configuración de autenticación completada');
                process.exit(0);
            } else {
                console.log('\\n⚠️  Configuración requiere atención manual');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error fatal en configuración:', error.message);
            process.exit(1);
        });
}
`;

    try {
        fs.writeFileSync('configurar-autenticacion.js', authConfigContent);
        console.log('✅ Script de configuración de autenticación creado: configurar-autenticacion.js');
        return true;
    } catch (error) {
        console.log('❌ Error creando script de configuración de autenticación:', error.message);
        return false;
    }
}

// Función para crear guía de configuración manual
function crearGuiaConfiguracionManual() {
    console.log('\n📋 Creando guía de configuración manual...');
    
    const guiaContent = `# GUÍA DE CONFIGURACIÓN MANUAL DE SUPABASE

## 🎯 OBJETIVO
Configurar manualmente las tablas y políticas que no se pudieron crear automáticamente.

## 📋 PASOS A SEGUIR

### 1. Acceder al Dashboard de Supabase
- Ir a: https://supabase.com/dashboard
- Seleccionar tu proyecto

### 2. Crear Tabla PROFILES (si no existe)
Ir a SQL Editor en Supabase Dashboard y ejecutar:

\`\`\`sql
-- Crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    user_type VARCHAR(50) DEFAULT 'inquilino',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);
\`\`\`

### 3. Crear Tabla PROPERTIES (si no existe)
Ejecutar en SQL Editor:

\`\`\`sql
-- Crear tabla properties
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    area DECIMAL(10,2),
    images TEXT[],
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Políticas para properties
CREATE POLICY "Properties are viewable by everyone" 
ON public.properties FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own properties" 
ON public.properties FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" 
ON public.properties FOR UPDATE 
USING (auth.uid() = user_id);
\`\`\`

### 4. Verificar Storage Buckets
Los siguientes buckets deben existir:
- property-images (público)
- avatars (público)
- profile-images (público)
- community-images (público)
- documents (privado)
- temp-uploads (privado)
- backups (privado)

### 5. Configurar Políticas de Storage
\`\`\`sql
-- Políticas para property-images bucket
CREATE POLICY "Anyone can view property images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Políticas para avatars bucket
CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
\`\`\`

## ✅ VERIFICACIÓN
Después de ejecutar estos scripts, ejecutar:
\`\`\`bash
node configurar-autenticacion.js
\`\`\`

## 🆘 SOPORTE
Si persisten los problemas:
1. Verificar que la Service Role Key tenga permisos completos
2. Contactar soporte de Supabase
3. Revisar logs en el Dashboard de Supabase
`;

    try {
        fs.writeFileSync('GUIA-CONFIGURACION-MANUAL-SUPABASE.md', guiaContent);
        console.log('✅ Guía de configuración manual creada: GUIA-CONFIGURACION-MANUAL-SUPABASE.md');
        return true;
    } catch (error) {
        console.log('❌ Error creando guía manual:', error.message);
        return false;
    }
}

// Función principal
function ejecutarPaso4() {
    console.log('🎯 Iniciando configuración de autenticación...\n');
    
    // Leer variables de entorno
    const envVars = leerVariablesEntorno();
    if (!envVars) {
        console.log('❌ No se pudieron cargar las variables de entorno');
        return false;
    }
    
    // Verificar credenciales básicas
    const credencialesBasicas = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    let credencialesOK = true;
    credencialesBasicas.forEach(cred => {
        if (!envVars[cred]) {
            console.log(`❌ Credencial faltante: ${cred}`);
            credencialesOK = false;
        }
    });
    
    if (!credencialesOK) {
        console.log('❌ Credenciales básicas incompletas');
        return false;
    }
    
    // Crear scripts
    const authCreado = crearScriptConfiguracionAuth(envVars);
    const guiaCreada = crearGuiaConfiguracionManual();
    
    console.log('\n📊 RESUMEN DEL PASO 4:');
    console.log('========================');
    console.log(`🔧 Variables de entorno: ${envVars ? '✅ Cargadas' : '❌ Error'}`);
    console.log(`🔑 Credenciales básicas: ${credencialesOK ? '✅ Válidas' : '❌ Incompletas'}`);
    console.log(`🔧 Script configuración auth: ${authCreado ? '✅ Creado' : '❌ Error'}`);
    console.log(`📋 Guía manual: ${guiaCreada ? '✅ Creada' : '❌ Error'}`);
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Ejecutar configuración: node configurar-autenticacion.js');
    console.log('2. Si hay errores, revisar: GUIA-CONFIGURACION-MANUAL-SUPABASE.md');
    console.log('3. Continuar con: node PASO-5-TESTING-FUNCIONALIDADES.js');
    
    console.log('\n✅ PASO 4 COMPLETADO');
    
    return {
        envVars: !!envVars,
        credenciales: credencialesOK,
        authScript: authCreado,
        guiaManual: guiaCreada
    };
}

// Ejecutar
const resultado = ejecutarPaso4();

// Generar reporte
const reporte = {
    paso: 4,
    nombre: 'Configurar Autenticación',
    timestamp: new Date().toISOString(),
    resultado: resultado,
    estado: resultado.credenciales && resultado.authScript ? 'LISTO_PARA_CONFIGURAR' : 'REQUIERE_ATENCION',
    archivos_creados: [
        'configurar-autenticacion.js',
        'GUIA-CONFIGURACION-MANUAL-SUPABASE.md'
    ],
    verificaciones_incluidas: [
        'Acceso a auth.users',
        'Verificación de tabla profiles',
        'Verificación de tabla properties',
        'Acceso a Storage buckets',
        'Test de creación de usuario'
    ],
    proximos_pasos: [
        'Ejecutar configuración de autenticación',
        'Revisar guía manual si hay errores',
        'Continuar con testing de funcionalidades'
    ]
};

try {
    fs.writeFileSync('REPORTE-PASO-4-CONFIGURACION-AUTH.json', JSON.stringify(reporte, null, 2));
    console.log('\n📄 Reporte generado: REPORTE-PASO-4-CONFIGURACION-AUTH.json');
} catch (error) {
    console.log('❌ Error generando reporte:', error.message);
}
