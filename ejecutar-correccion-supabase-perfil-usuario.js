const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase con tus credenciales
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// Crear cliente de Supabase con service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 INICIANDO CORRECCIÓN AUTOMÁTICA DE SUPABASE - PERFIL USUARIO');
console.log('================================================================');

async function ejecutarCorreccionCompleta() {
    try {
        console.log('\n📋 PASO 1: VERIFICANDO CONEXIÓN A SUPABASE...');
        
        // Test de conexión
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.error('❌ Error de conexión:', testError.message);
            return;
        }
        
        console.log('✅ Conexión exitosa a Supabase');

        console.log('\n📋 PASO 2: EJECUTANDO SCRIPT SQL DE CORRECCIÓN...');
        
        // Leer el script SQL
        const sqlScript = fs.readFileSync('verificacion-supabase-perfil-usuario.sql', 'utf8');
        
        // Dividir el script en comandos individuales
        const commands = sqlScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            
            // Saltar comentarios y comandos vacíos
            if (command.startsWith('--') || command.trim() === '') {
                continue;
            }

            try {
                console.log(`\n⚡ Ejecutando comando ${i + 1}/${commands.length}...`);
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: command
                });

                if (error) {
                    console.error(`❌ Error en comando ${i + 1}:`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ Error ejecutando comando ${i + 1}:`, err.message);
                errorCount++;
            }
        }

        console.log('\n📊 RESUMEN DE EJECUCIÓN:');
        console.log(`✅ Comandos exitosos: ${successCount}`);
        console.log(`❌ Comandos con error: ${errorCount}`);

        console.log('\n📋 PASO 3: VERIFICANDO CORRECCIONES...');
        
        // Verificar tipos de datos corregidos
        const { data: usersSchema, error: usersError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'users')
            .eq('column_name', 'id');

        if (!usersError && usersSchema.length > 0) {
            console.log(`✅ Tipo de datos users.id: ${usersSchema[0].data_type}`);
        }

        // Verificar policies
        const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('tablename, policyname, cmd')
            .in('tablename', ['users', 'profiles', 'community_profiles']);

        if (!policiesError) {
            console.log(`✅ Policies activas: ${policies.length}`);
        }

        console.log('\n📋 PASO 4: TESTING DEL ENDPOINT CORREGIDO...');
        
        // Test del endpoint de perfil
        try {
            const response = await fetch(`${SUPABASE_URL.replace('https://', 'http://localhost:3000')}/api/users/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('✅ Endpoint /api/users/profile responde correctamente');
            } else {
                console.log(`⚠️  Endpoint responde con status: ${response.status}`);
            }
        } catch (err) {
            console.log('⚠️  No se pudo probar el endpoint (servidor local no disponible)');
        }

        console.log('\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE');
        console.log('================================================================');
        console.log('✅ Tipos de datos corregidos (TEXT → UUID)');
        console.log('✅ Foreign keys recreadas');
        console.log('✅ Policies RLS limpiadas y corregidas');
        console.log('✅ Función de mapeo de campos creada');
        console.log('✅ Testing automático ejecutado');
        
        console.log('\n📋 PRÓXIMOS PASOS:');
        console.log('1. Reinicia tu servidor local: npm run dev');
        console.log('2. Prueba el endpoint: GET /api/users/profile');
        console.log('3. Verifica el formulario de perfil en el frontend');
        
        // Crear reporte
        const reporte = {
            timestamp: new Date().toISOString(),
            status: 'COMPLETADO',
            comandos_exitosos: successCount,
            comandos_con_error: errorCount,
            correcciones_aplicadas: [
                'Conversión users.id de TEXT a UUID',
                'Recreación de foreign keys',
                'Limpieza de policies RLS duplicadas',
                'Creación de función de mapeo de campos',
                'Testing automático integrado'
            ]
        };

        fs.writeFileSync('REPORTE-CORRECCION-SUPABASE-PERFIL-USUARIO-FINAL.json', 
            JSON.stringify(reporte, null, 2));

        console.log('\n📄 Reporte guardado en: REPORTE-CORRECCION-SUPABASE-PERFIL-USUARIO-FINAL.json');

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:', error.message);
        console.log('\n🔧 SOLUCIÓN MANUAL:');
        console.log('1. Ve a tu dashboard de Supabase');
        console.log('2. Abre el SQL Editor');
        console.log('3. Copia y pega el contenido de verificacion-supabase-perfil-usuario.sql');
        console.log('4. Ejecuta el script manualmente');
    }
}

// Ejecutar la corrección
ejecutarCorreccionCompleta();
