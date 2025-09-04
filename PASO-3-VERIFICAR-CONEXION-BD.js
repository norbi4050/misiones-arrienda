const fs = require('fs');
const path = require('path');

console.log('🚀 PASO 3: VERIFICAR CONEXIÓN CON LA BASE DE DATOS');
console.log('==================================================\n');

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

// Función para crear script de conexión alternativo
function crearScriptConexionAlternativo(envVars) {
    console.log('\n🔧 Creando script de conexión alternativo...');
    
    const scriptContent = `const { createClient } = require('@supabase/supabase-js');

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

// Función para verificar conexión básica
async function verificarConexionBasica() {
    console.log('🔍 Verificando conexión básica a Supabase...');
    
    try {
        // Intentar una consulta simple a auth.users
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (error) {
            console.log('❌ Error de conexión auth:', error.message);
            return false;
        }
        
        console.log('✅ Conexión a Supabase Auth exitosa');
        console.log(\`📊 Usuarios encontrados: \${data.users ? data.users.length : 0}\`);
        return true;
    } catch (err) {
        console.log('❌ Error de conexión:', err.message);
        return false;
    }
}

// Función para verificar tablas existentes
async function verificarTablasExistentes() {
    console.log('\\n🔍 Verificando tablas existentes...');
    
    const tablasEsperadas = ['properties', 'users', 'profiles'];
    let tablasEncontradas = 0;
    
    for (const tabla of tablasEsperadas) {
        try {
            const { data, error } = await supabase
                .from(tabla)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(\`❌ Tabla '\${tabla}': \${error.message}\`);
            } else {
                console.log(\`✅ Tabla '\${tabla}': Accesible\`);
                tablasEncontradas++;
            }
        } catch (err) {
            console.log(\`❌ Error verificando tabla '\${tabla}':\`, err.message);
        }
    }
    
    console.log(\`\\n📊 Tablas encontradas: \${tablasEncontradas}/\${tablasEsperadas.length}\`);
    return tablasEncontradas;
}

// Función para verificar storage
async function verificarStorage() {
    console.log('\\n🔍 Verificando Supabase Storage...');
    
    try {
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.log('❌ Error accediendo a Storage:', error.message);
            return false;
        }
        
        console.log('✅ Supabase Storage accesible');
        console.log(\`📊 Buckets encontrados: \${data ? data.length : 0}\`);
        
        if (data && data.length > 0) {
            data.forEach(bucket => {
                console.log(\`  - \${bucket.name} (público: \${bucket.public})\`);
            });
        }
        
        return true;
    } catch (err) {
        console.log('❌ Error verificando Storage:', err.message);
        return false;
    }
}

// Función para ejecutar scripts SQL básicos
async function ejecutarScriptsBasicos() {
    console.log('\\n🔧 Ejecutando scripts SQL básicos...');
    
    const scriptsBasicos = [
        {
            nombre: 'Verificar extensiones',
            sql: "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');"
        },
        {
            nombre: 'Verificar esquemas',
            sql: "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('public', 'auth', 'storage');"
        }
    ];
    
    let scriptosEjecutados = 0;
    
    for (const script of scriptsBasicos) {
        try {
            console.log(\`🔄 Ejecutando: \${script.nombre}\`);
            
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql_query: script.sql 
            });
            
            if (error) {
                console.log(\`❌ Error en \${script.nombre}:\`, error.message);
            } else {
                console.log(\`✅ \${script.nombre}: Ejecutado exitosamente\`);
                if (data && Array.isArray(data)) {
                    console.log(\`   📊 Resultados: \${data.length} registros\`);
                }
                scriptosEjecutados++;
            }
        } catch (err) {
            console.log(\`❌ Error ejecutando \${script.nombre}:\`, err.message);
        }
    }
    
    return scriptosEjecutados;
}

// Función principal de verificación
async function verificarConexionCompleta() {
    console.log('🚀 VERIFICACIÓN COMPLETA DE CONEXIÓN');
    console.log('====================================\\n');
    
    const resultados = {
        conexionBasica: false,
        tablas: 0,
        storage: false,
        scripts: 0
    };
    
    // Verificar conexión básica
    resultados.conexionBasica = await verificarConexionBasica();
    
    // Verificar tablas
    resultados.tablas = await verificarTablasExistentes();
    
    // Verificar storage
    resultados.storage = await verificarStorage();
    
    // Ejecutar scripts básicos
    resultados.scripts = await ejecutarScriptsBasicos();
    
    console.log('\\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log('============================');
    console.log(\`🔗 Conexión básica: \${resultados.conexionBasica ? '✅ OK' : '❌ Error'}\`);
    console.log(\`📋 Tablas accesibles: \${resultados.tablas}/3\`);
    console.log(\`💾 Storage: \${resultados.storage ? '✅ OK' : '❌ Error'}\`);
    console.log(\`🔧 Scripts ejecutados: \${resultados.scripts}/2\`);
    
    const puntuacion = (
        (resultados.conexionBasica ? 25 : 0) +
        (resultados.tablas * 8.33) +
        (resultados.storage ? 25 : 0) +
        (resultados.scripts * 12.5)
    );
    
    console.log(\`\\n🎯 PUNTUACIÓN TOTAL: \${Math.round(puntuacion)}/100\`);
    
    if (puntuacion >= 75) {
        console.log('🎉 Conexión a Supabase: EXCELENTE');
    } else if (puntuacion >= 50) {
        console.log('⚠️  Conexión a Supabase: PARCIAL - Requiere atención');
    } else {
        console.log('❌ Conexión a Supabase: PROBLEMÁTICA - Requiere configuración');
    }
    
    return resultados;
}

module.exports = {
    supabase,
    verificarConexionBasica,
    verificarTablasExistentes,
    verificarStorage,
    ejecutarScriptsBasicos,
    verificarConexionCompleta
};

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarConexionCompleta()
        .then(resultados => {
            const puntuacion = (
                (resultados.conexionBasica ? 25 : 0) +
                (resultados.tablas * 8.33) +
                (resultados.storage ? 25 : 0) +
                (resultados.scripts * 12.5)
            );
            
            if (puntuacion >= 50) {
                console.log('\\n✅ Verificación completada exitosamente');
                process.exit(0);
            } else {
                console.log('\\n⚠️  Verificación completada con problemas');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error fatal en verificación:', error.message);
            process.exit(1);
        });
}
`;

    try {
        fs.writeFileSync('supabase-connection-alternativo.js', scriptContent);
        console.log('✅ Script de conexión alternativo creado: supabase-connection-alternativo.js');
        return true;
    } catch (error) {
        console.log('❌ Error creando script de conexión alternativo:', error.message);
        return false;
    }
}

// Función para crear script de corrección de esquema
function crearScriptCorreccionEsquema() {
    console.log('\n🛠️ Creando script de corrección de esquema...');
    
    const correccionContent = `const { supabase } = require('./supabase-connection-alternativo');

async function aplicarCorreccionesEsquema() {
    console.log('🔧 APLICANDO CORRECCIONES DE ESQUEMA');
    console.log('====================================\\n');
    
    const correcciones = [
        {
            nombre: 'Crear tabla properties si no existe',
            sql: \`
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
            \`
        },
        {
            nombre: 'Crear tabla profiles si no existe',
            sql: \`
                CREATE TABLE IF NOT EXISTS public.profiles (
                    id UUID REFERENCES auth.users(id) PRIMARY KEY,
                    full_name VARCHAR(255),
                    phone VARCHAR(20),
                    user_type VARCHAR(50) DEFAULT 'inquilino',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            \`
        },
        {
            nombre: 'Habilitar RLS en properties',
            sql: \`
                ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
            \`
        },
        {
            nombre: 'Habilitar RLS en profiles',
            sql: \`
                ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            \`
        },
        {
            nombre: 'Política de lectura para properties',
            sql: \`
                CREATE POLICY IF NOT EXISTS "Properties are viewable by everyone" 
                ON public.properties FOR SELECT 
                USING (true);
            \`
        },
        {
            nombre: 'Política de inserción para properties',
            sql: \`
                CREATE POLICY IF NOT EXISTS "Users can insert their own properties" 
                ON public.properties FOR INSERT 
                WITH CHECK (auth.uid() = user_id);
            \`
        },
        {
            nombre: 'Política de actualización para properties',
            sql: \`
                CREATE POLICY IF NOT EXISTS "Users can update their own properties" 
                ON public.properties FOR UPDATE 
                USING (auth.uid() = user_id);
            \`
        },
        {
            nombre: 'Política de lectura para profiles',
            sql: \`
                CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone" 
                ON public.profiles FOR SELECT 
                USING (true);
            \`
        },
        {
            nombre: 'Política de inserción para profiles',
            sql: \`
                CREATE POLICY IF NOT EXISTS "Users can insert their own profile" 
                ON public.profiles FOR INSERT 
                WITH CHECK (auth.uid() = id);
            \`
        },
        {
            nombre: 'Política de actualización para profiles',
            sql: \`
                CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
                ON public.profiles FOR UPDATE 
                USING (auth.uid() = id);
            \`
        }
    ];
    
    let correccionesAplicadas = 0;
    
    for (const correccion of correcciones) {
        try {
            console.log(\`🔄 Aplicando: \${correccion.nombre}\`);
            
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql_query: correccion.sql 
            });
            
            if (error) {
                console.log(\`⚠️  \${correccion.nombre}: \${error.message}\`);
                // Continuar con las siguientes correcciones
            } else {
                console.log(\`✅ \${correccion.nombre}: Aplicado exitosamente\`);
                correccionesAplicadas++;
            }
        } catch (err) {
            console.log(\`❌ Error aplicando \${correccion.nombre}:\`, err.message);
        }
        
        // Pequeña pausa entre correcciones
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(\`\\n📊 RESUMEN DE CORRECCIONES:\`);
    console.log(\`✅ Correcciones aplicadas: \${correccionesAplicadas}/\${correcciones.length}\`);
    
    return correccionesAplicadas;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    aplicarCorreccionesEsquema()
        .then(correcciones => {
            if (correcciones > 0) {
                console.log('🎉 Correcciones de esquema aplicadas exitosamente');
                process.exit(0);
            } else {
                console.log('⚠️  No se pudieron aplicar correcciones');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error aplicando correcciones:', error.message);
            process.exit(1);
        });
}

module.exports = { aplicarCorreccionesEsquema };
`;

    try {
        fs.writeFileSync('aplicar-correcciones-esquema.js', correccionContent);
        console.log('✅ Script de corrección de esquema creado: aplicar-correcciones-esquema.js');
        return true;
    } catch (error) {
        console.log('❌ Error creando script de corrección de esquema:', error.message);
        return false;
    }
}

// Función para crear script de testing de conexión
function crearScriptTestingConexion() {
    console.log('\n🧪 Creando script de testing de conexión...');
    
    const testingContent = `const { verificarConexionCompleta } = require('./supabase-connection-alternativo');
const { aplicarCorreccionesEsquema } = require('./aplicar-correcciones-esquema');

async function ejecutarTestingCompleto() {
    console.log('🧪 TESTING COMPLETO DE CONEXIÓN SUPABASE');
    console.log('=========================================\\n');
    
    let fase = 1;
    
    // Fase 1: Verificación inicial
    console.log(\`📋 FASE \${fase++}: Verificación inicial de conexión\`);
    console.log('─'.repeat(50));
    
    const resultadosIniciales = await verificarConexionCompleta();
    
    const puntuacionInicial = (
        (resultadosIniciales.conexionBasica ? 25 : 0) +
        (resultadosIniciales.tablas * 8.33) +
        (resultadosIniciales.storage ? 25 : 0) +
        (resultadosIniciales.scripts * 12.5)
    );
    
    console.log(\`\\n🎯 Puntuación inicial: \${Math.round(puntuacionInicial)}/100\\n\`);
    
    // Fase 2: Aplicar correcciones si es necesario
    if (puntuacionInicial < 75) {
        console.log(\`📋 FASE \${fase++}: Aplicando correcciones de esquema\`);
        console.log('─'.repeat(50));
        
        const correccionesAplicadas = await aplicarCorreccionesEsquema();
        console.log(\`\\n✅ Correcciones aplicadas: \${correccionesAplicadas}\\n\`);
        
        // Pausa para que las correcciones se apliquen
        console.log('⏳ Esperando que las correcciones se apliquen...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Fase 3: Verificación final
    console.log(\`📋 FASE \${fase++}: Verificación final de conexión\`);
    console.log('─'.repeat(50));
    
    const resultadosFinales = await verificarConexionCompleta();
    
    const puntuacionFinal = (
        (resultadosFinales.conexionBasica ? 25 : 0) +
        (resultadosFinales.tablas * 8.33) +
        (resultadosFinales.storage ? 25 : 0) +
        (resultadosFinales.scripts * 12.5)
    );
    
    console.log(\`\\n🎯 Puntuación final: \${Math.round(puntuacionFinal)}/100\\n\`);
    
    // Fase 4: Reporte final
    console.log(\`📋 FASE \${fase++}: Reporte final\`);
    console.log('─'.repeat(50));
    
    const mejora = puntuacionFinal - puntuacionInicial;
    
    console.log('📊 COMPARACIÓN DE RESULTADOS:');
    console.log(\`   Puntuación inicial: \${Math.round(puntuacionInicial)}/100\`);
    console.log(\`   Puntuación final:   \${Math.round(puntuacionFinal)}/100\`);
    console.log(\`   Mejora:            \${mejora > 0 ? '+' : ''}\${Math.round(mejora)} puntos\`);
    
    console.log('\\n🎯 ESTADO FINAL:');
    if (puntuacionFinal >= 90) {
        console.log('🎉 EXCELENTE - Supabase completamente funcional');
    } else if (puntuacionFinal >= 75) {
        console.log('✅ BUENO - Supabase funcional con configuración básica');
    } else if (puntuacionFinal >= 50) {
        console.log('⚠️  PARCIAL - Supabase parcialmente funcional');
    } else {
        console.log('❌ PROBLEMÁTICO - Supabase requiere configuración manual');
    }
    
    console.log('\\n📋 PRÓXIMOS PASOS RECOMENDADOS:');
    if (puntuacionFinal >= 75) {
        console.log('1. ✅ Continuar con el desarrollo del proyecto');
        console.log('2. ✅ Ejecutar testing de funcionalidades específicas');
        console.log('3. ✅ Configurar datos de prueba si es necesario');
    } else {
        console.log('1. 🔧 Revisar configuración manual en Supabase Dashboard');
        console.log('2. 🔧 Verificar permisos de la service role key');
        console.log('3. 🔧 Contactar soporte si persisten los problemas');
    }
    
    return {
        inicial: resultadosIniciales,
        final: resultadosFinales,
        puntuacionInicial: Math.round(puntuacionInicial),
        puntuacionFinal: Math.round(puntuacionFinal),
        mejora: Math.round(mejora),
        estado: puntuacionFinal >= 75 ? 'FUNCIONAL' : 'REQUIERE_ATENCION'
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarTestingCompleto()
        .then(resultados => {
            console.log('\\n🎉 Testing completo finalizado');
            
            if (resultados.estado === 'FUNCIONAL') {
                console.log('✅ Supabase está listo para usar');
                process.exit(0);
            } else {
                console.log('⚠️  Supabase requiere atención adicional');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error en testing completo:', error.message);
            process.exit(1);
        });
}

module.exports = { ejecutarTestingCompleto };
`;

    try {
        fs.writeFileSync('testing-conexion-completo.js', testingContent);
        console.log('✅ Script de testing completo creado: testing-conexion-completo.js');
        return true;
    } catch (error) {
        console.log('❌ Error creando script de testing completo:', error.message);
        return false;
    }
}

// Función principal
function ejecutarPaso3() {
    console.log('🎯 Iniciando verificación de conexión con BD...\n');
    
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
    const conexionCreada = crearScriptConexionAlternativo(envVars);
    const correccionCreada = crearScriptCorreccionEsquema();
    const testingCreado = crearScriptTestingConexion();
    
    console.log('\n📊 RESUMEN DEL PASO 3:');
    console.log('========================');
    console.log(`🔧 Variables de entorno: ${envVars ? '✅ Cargadas' : '❌ Error'}`);
    console.log(`🔑 Credenciales básicas: ${credencialesOK ? '✅ Válidas' : '❌ Incompletas'}`);
    console.log(`🔧 Script conexión alternativo: ${conexionCreada ? '✅ Creado' : '❌ Error'}`);
    console.log(`🛠️ Script corrección esquema: ${correccionCreada ? '✅ Creado' : '❌ Error'}`);
    console.log(`🧪 Script testing completo: ${testingCreado ? '✅ Creado' : '❌ Error'}`);
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Verificar conexión: node supabase-connection-alternativo.js');
    console.log('2. Aplicar correcciones: node aplicar-correcciones-esquema.js');
    console.log('3. Testing completo: node testing-conexion-completo.js');
    console.log('4. Continuar con: node PASO-4-CONFIGURAR-AUTENTICACION.js');
    
    console.log('\n✅ PASO 3 COMPLETADO');
    
    return {
        envVars: !!envVars,
        credenciales: credencialesOK,
        conexion: conexionCreada,
        correccion: correccionCreada,
        testing: testingCreado
    };
}

// Ejecutar
const resultado = ejecutarPaso3();

// Generar reporte
const reporte = {
    paso: 3,
    nombre: 'Verificar Conexión con la Base de Datos',
    timestamp: new Date().toISOString(),
    resultado: resultado,
    estado: resultado.credenciales && resultado.conexion ? 'LISTO_PARA_VERIFICAR' : 'REQUIERE_ATENCION',
    archivos_creados: [
        'supabase-connection-alternativo.js',
        'aplicar-correcciones-esquema.js',
        'testing-conexion-completo.js'
    ],
    metodo_conexion: 'Alternativo con Auth Admin API',
    verificaciones_incluidas: [
        'Conexión básica a Supabase Auth',
        'Verificación de tablas existentes',
        'Acceso a Supabase Storage',
        'Ejecución de scripts SQL básicos'
    ],
    proximos_pasos: [
        'Ejecutar verificación de conexión',
        'Aplicar correcciones de esquema si es necesario',
        'Ejecutar testing completo'
    ]
};

try {
    fs.writeFileSync('REPORTE-PASO-3-VERIFICACION-BD.json', JSON.stringify(reporte, null, 2));
    console.log('\n📄 Reporte generado: REPORTE-PASO-3-VERIFICACION-BD.json');
} catch (error) {
    console.log('❌ Error generando reporte:', error.message);
}
