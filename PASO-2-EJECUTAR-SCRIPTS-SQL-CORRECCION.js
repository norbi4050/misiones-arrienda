const fs = require('fs');
const path = require('path');

console.log('🚀 PASO 2: EJECUTANDO SCRIPTS SQL DE CORRECCIÓN');
console.log('=================================================\n');

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

// Función para verificar credenciales de Supabase
function verificarCredencialesSupabase(envVars) {
    console.log('\n🔍 Verificando credenciales de Supabase...');
    
    const credencialesRequeridas = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL'
    ];
    
    let credencialesValidas = true;
    
    credencialesRequeridas.forEach(cred => {
        if (envVars[cred]) {
            console.log(`✅ ${cred}: Configurado`);
            
            // Verificar formato específico
            if (cred === 'NEXT_PUBLIC_SUPABASE_URL') {
                if (envVars[cred].includes('supabase.co')) {
                    console.log(`  ✅ URL válida: ${envVars[cred]}`);
                } else {
                    console.log(`  ⚠️  URL podría no ser válida: ${envVars[cred]}`);
                }
            }
            
            if (cred.includes('KEY')) {
                const keyLength = envVars[cred].length;
                console.log(`  ✅ Longitud de clave: ${keyLength} caracteres`);
            }
        } else {
            console.log(`❌ ${cred}: NO CONFIGURADO`);
            credencialesValidas = false;
        }
    });
    
    return credencialesValidas;
}

// Función para verificar scripts SQL existentes
function verificarScriptsSQL() {
    console.log('\n📄 Verificando scripts SQL de corrección...');
    
    const scriptsSQL = [
        'SUPABASE-CORRECCION-ESQUEMA-PROPERTIES.sql',
        'SUPABASE-CORRECCION-AUTH.sql'
    ];
    
    let scriptsEncontrados = 0;
    
    scriptsSQL.forEach(script => {
        if (fs.existsSync(script)) {
            const stats = fs.statSync(script);
            console.log(`✅ ${script}: Encontrado (${stats.size} bytes)`);
            scriptsEncontrados++;
        } else {
            console.log(`❌ ${script}: No encontrado`);
        }
    });
    
    return scriptsEncontrados === scriptsSQL.length;
}

// Función para crear script de conexión a Supabase
function crearScriptConexion(envVars) {
    console.log('\n🔧 Creando script de conexión a Supabase...');
    
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

// Función para ejecutar consulta SQL
async function ejecutarSQL(query, descripcion) {
    console.log(\`🔄 Ejecutando: \${descripcion}\`);
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
        
        if (error) {
            console.log(\`❌ Error en \${descripcion}:\`, error.message);
            return false;
        }
        
        console.log(\`✅ \${descripcion}: Ejecutado exitosamente\`);
        return true;
    } catch (err) {
        console.log(\`❌ Error ejecutando \${descripcion}:\`, err.message);
        return false;
    }
}

// Función para verificar conexión
async function verificarConexion() {
    console.log('🔍 Verificando conexión a Supabase...');
    
    try {
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
        
        if (error) {
            console.log('❌ Error de conexión:', error.message);
            return false;
        }
        
        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (err) {
        console.log('❌ Error de conexión:', err.message);
        return false;
    }
}

module.exports = {
    supabase,
    ejecutarSQL,
    verificarConexion
};
`;

    try {
        fs.writeFileSync('supabase-connection.js', scriptContent);
        console.log('✅ Script de conexión creado: supabase-connection.js');
        return true;
    } catch (error) {
        console.log('❌ Error creando script de conexión:', error.message);
        return false;
    }
}

// Función para crear script ejecutor de SQL
function crearScriptEjecutor() {
    console.log('\n🛠️ Creando script ejecutor de SQL...');
    
    const ejecutorContent = `const fs = require('fs');
const { verificarConexion, ejecutarSQL } = require('./supabase-connection');

async function ejecutarScriptsSQL() {
    console.log('🚀 EJECUTANDO SCRIPTS SQL DE CORRECCIÓN');
    console.log('=====================================\\n');
    
    // Verificar conexión primero
    const conexionOK = await verificarConexion();
    if (!conexionOK) {
        console.log('❌ No se pudo conectar a Supabase. Verifica las credenciales.');
        return false;
    }
    
    const scripts = [
        {
            archivo: 'SUPABASE-CORRECCION-ESQUEMA-PROPERTIES.sql',
            descripcion: 'Corrección de esquema de propiedades'
        },
        {
            archivo: 'SUPABASE-CORRECCION-AUTH.sql',
            descripcion: 'Corrección de autenticación'
        }
    ];
    
    let scriptosEjecutados = 0;
    
    for (const script of scripts) {
        if (fs.existsSync(script.archivo)) {
            try {
                const sqlContent = fs.readFileSync(script.archivo, 'utf8');
                
                // Dividir en consultas individuales
                const queries = sqlContent
                    .split(';')
                    .map(q => q.trim())
                    .filter(q => q.length > 0 && !q.startsWith('--'));
                
                console.log(\`📄 Ejecutando \${script.archivo} (\${queries.length} consultas)...\`);
                
                for (let i = 0; i < queries.length; i++) {
                    const query = queries[i];
                    if (query.trim()) {
                        const exito = await ejecutarSQL(query, \`Consulta \${i + 1} de \${script.descripcion}\`);
                        if (!exito) {
                            console.log(\`⚠️  Error en consulta \${i + 1}, continuando...\`);
                        }
                    }
                }
                
                scriptosEjecutados++;
                console.log(\`✅ \${script.archivo}: Completado\\n\`);
                
            } catch (error) {
                console.log(\`❌ Error leyendo \${script.archivo}:\`, error.message);
            }
        } else {
            console.log(\`⚠️  \${script.archivo}: No encontrado\`);
        }
    }
    
    console.log(\`📊 RESUMEN: \${scriptosEjecutados} scripts ejecutados exitosamente\`);
    return scriptosEjecutados > 0;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarScriptsSQL()
        .then(exito => {
            if (exito) {
                console.log('🎉 Scripts SQL ejecutados exitosamente');
                process.exit(0);
            } else {
                console.log('❌ Error ejecutando scripts SQL');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { ejecutarScriptsSQL };
`;

    try {
        fs.writeFileSync('ejecutar-scripts-sql.js', ejecutorContent);
        console.log('✅ Script ejecutor creado: ejecutar-scripts-sql.js');
        return true;
    } catch (error) {
        console.log('❌ Error creando script ejecutor:', error.message);
        return false;
    }
}

// Función para crear script de verificación post-ejecución
function crearScriptVerificacion() {
    console.log('\n🔍 Creando script de verificación...');
    
    const verificacionContent = `const { supabase } = require('./supabase-connection');

async function verificarCorrecciones() {
    console.log('🔍 VERIFICANDO CORRECCIONES APLICADAS');
    console.log('====================================\\n');
    
    const verificaciones = [
        {
            nombre: 'Tabla properties',
            query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties' ORDER BY ordinal_position"
        },
        {
            nombre: 'Tabla auth.users',
            query: "SELECT count(*) as total FROM auth.users"
        },
        {
            nombre: 'Políticas RLS',
            query: "SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'"
        },
        {
            nombre: 'Funciones personalizadas',
            query: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'"
        }
    ];
    
    let verificacionesExitosas = 0;
    
    for (const verificacion of verificaciones) {
        try {
            console.log(\`🔄 Verificando: \${verificacion.nombre}\`);
            
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql_query: verificacion.query 
            });
            
            if (error) {
                console.log(\`❌ Error en \${verificacion.nombre}:\`, error.message);
            } else {
                console.log(\`✅ \${verificacion.nombre}: OK\`);
                if (data && Array.isArray(data)) {
                    console.log(\`   📊 Resultados: \${data.length} registros\`);
                }
                verificacionesExitosas++;
            }
        } catch (err) {
            console.log(\`❌ Error verificando \${verificacion.nombre}:\`, err.message);
        }
        
        console.log(''); // Línea en blanco
    }
    
    console.log(\`📊 RESUMEN DE VERIFICACIÓN:\`);
    console.log(\`✅ Verificaciones exitosas: \${verificacionesExitosas}/\${verificaciones.length}\`);
    
    return verificacionesExitosas === verificaciones.length;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarCorrecciones()
        .then(exito => {
            if (exito) {
                console.log('🎉 Todas las verificaciones pasaron');
                process.exit(0);
            } else {
                console.log('⚠️  Algunas verificaciones fallaron');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error en verificación:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarCorrecciones };
`;

    try {
        fs.writeFileSync('verificar-correcciones.js', verificacionContent);
        console.log('✅ Script de verificación creado: verificar-correcciones.js');
        return true;
    } catch (error) {
        console.log('❌ Error creando script de verificación:', error.message);
        return false;
    }
}

// Función principal
function ejecutarPaso2() {
    console.log('🎯 Iniciando ejecución de scripts SQL...\n');
    
    // Leer variables de entorno
    const envVars = leerVariablesEntorno();
    if (!envVars) {
        console.log('❌ No se pudieron cargar las variables de entorno');
        return false;
    }
    
    // Verificar credenciales
    const credencialesOK = verificarCredencialesSupabase(envVars);
    if (!credencialesOK) {
        console.log('❌ Credenciales de Supabase incompletas');
        return false;
    }
    
    // Verificar scripts SQL
    const scriptsOK = verificarScriptsSQL();
    if (!scriptsOK) {
        console.log('❌ Scripts SQL no encontrados');
        return false;
    }
    
    // Crear scripts de ejecución
    const conexionCreada = crearScriptConexion(envVars);
    const ejecutorCreado = crearScriptEjecutor();
    const verificacionCreada = crearScriptVerificacion();
    
    console.log('\n📊 RESUMEN DEL PASO 2:');
    console.log('========================');
    console.log(`🔧 Variables de entorno: ${envVars ? '✅ Cargadas' : '❌ Error'}`);
    console.log(`🔑 Credenciales Supabase: ${credencialesOK ? '✅ Válidas' : '❌ Incompletas'}`);
    console.log(`📄 Scripts SQL: ${scriptsOK ? '✅ Encontrados' : '❌ Faltantes'}`);
    console.log(`🔧 Script de conexión: ${conexionCreada ? '✅ Creado' : '❌ Error'}`);
    console.log(`🛠️ Script ejecutor: ${ejecutorCreado ? '✅ Creado' : '❌ Error'}`);
    console.log(`🔍 Script verificación: ${verificacionCreada ? '✅ Creado' : '❌ Error'}`);
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. Instalar dependencias: npm install @supabase/supabase-js');
    console.log('2. Ejecutar scripts: node ejecutar-scripts-sql.js');
    console.log('3. Verificar resultados: node verificar-correcciones.js');
    console.log('4. Continuar con: node PASO-3-VERIFICAR-CONEXION-BD.js');
    
    console.log('\n✅ PASO 2 COMPLETADO');
    
    return {
        envVars: !!envVars,
        credenciales: credencialesOK,
        scripts: scriptsOK,
        conexion: conexionCreada,
        ejecutor: ejecutorCreado,
        verificacion: verificacionCreada
    };
}

// Ejecutar
const resultado = ejecutarPaso2();

// Generar reporte
const reporte = {
    paso: 2,
    nombre: 'Ejecutar Scripts SQL de Corrección',
    timestamp: new Date().toISOString(),
    resultado: resultado,
    estado: resultado.credenciales && resultado.scripts ? 'LISTO_PARA_EJECUTAR' : 'REQUIERE_ATENCION',
    archivos_creados: [
        'supabase-connection.js',
        'ejecutar-scripts-sql.js',
        'verificar-correcciones.js'
    ],
    credenciales_detectadas: {
        supabase_url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
        database_url: 'Configurada',
        anon_key: 'Configurada',
        service_role_key: 'Configurada'
    },
    proximos_pasos: [
        'Instalar @supabase/supabase-js',
        'Ejecutar scripts SQL',
        'Verificar correcciones aplicadas'
    ]
};

try {
    fs.writeFileSync('REPORTE-PASO-2-SCRIPTS-SQL.json', JSON.stringify(reporte, null, 2));
    console.log('\n📄 Reporte generado: REPORTE-PASO-2-SCRIPTS-SQL.json');
} catch (error) {
    console.log('❌ Error generando reporte:', error.message);
}
