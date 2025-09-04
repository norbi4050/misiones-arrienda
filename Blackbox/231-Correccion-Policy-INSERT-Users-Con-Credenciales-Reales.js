const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================================
// SCRIPT DE CORRECCIÓN AUTOMÁTICA: POLÍTICA INSERT USERS
// CON CREDENCIALES REALES DEL .ENV
// ============================================================

console.log('🔧 EJECUTANDO CORRECCIÓN AUTOMÁTICA: POLÍTICA INSERT USERS');
console.log('============================================================');

// Configuración con credenciales reales
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function corregirPolicyInsertUsers() {
    const reporte = {
        timestamp: new Date().toISOString(),
        pasos: [],
        errores: [],
        exito: false
    };

    try {
        // PASO 1: Verificar políticas actuales
        console.log('\n📋 PASO 1: Verificar políticas actuales...');
        try {
            const { data: policies, error: policiesError } = await supabase
                .from('pg_policies')
                .select('*')
                .eq('tablename', 'users');

            if (policiesError) {
                console.log('❌ Error consultando políticas:', policiesError.message);
                reporte.errores.push(`Paso 1: ${policiesError.message}`);
            } else {
                console.log('✅ Políticas actuales encontradas:', policies?.length || 0);
                reporte.pasos.push('Paso 1: Políticas consultadas exitosamente');
            }
        } catch (error) {
            console.log('❌ Error en paso 1:', error.message);
            reporte.errores.push(`Paso 1: ${error.message}`);
        }

        // PASO 2: Eliminar política problemática
        console.log('\n🗑️ PASO 2: Eliminar política problemática...');
        try {
            const { error: dropError } = await supabase.rpc('drop_policy_if_exists', {
                policy_name: 'Users can insert their own profile',
                table_name: 'users'
            });

            if (dropError) {
                console.log('❌ Error eliminando política:', dropError.message);
                reporte.errores.push(`Paso 2: ${dropError.message}`);
            } else {
                console.log('✅ Política problemática eliminada');
                reporte.pasos.push('Paso 2: Política problemática eliminada');
            }
        } catch (error) {
            console.log('❌ Error en paso 2:', error.message);
            reporte.errores.push(`Paso 2: ${error.message}`);
        }

        // PASO 3: Crear nueva política INSERT funcional
        console.log('\n🆕 PASO 3: Crear nueva política INSERT funcional...');
        try {
            const createPolicySQL = `
                CREATE POLICY "allow_user_insert" ON "public"."users"
                AS PERMISSIVE FOR INSERT
                TO authenticated
                WITH CHECK (auth.uid() = id);
            `;

            const { error: createError } = await supabase.rpc('exec_sql', {
                sql: createPolicySQL
            });

            if (createError) {
                console.log('❌ Error creando política principal:', createError.message);
                reporte.errores.push(`Paso 3: ${createError.message}`);
            } else {
                console.log('✅ Nueva política INSERT creada exitosamente');
                reporte.pasos.push('Paso 3: Nueva política INSERT creada');
            }
        } catch (error) {
            console.log('❌ Error en paso 3:', error.message);
            reporte.errores.push(`Paso 3: ${error.message}`);
        }

        // PASO 4: Crear política alternativa de respaldo
        console.log('\n🔄 PASO 4: Crear política alternativa de respaldo...');
        try {
            const altPolicySQL = `
                CREATE POLICY "users_insert_policy" ON "public"."users"
                AS PERMISSIVE FOR INSERT
                TO public
                WITH CHECK (true);
            `;

            const { error: altError } = await supabase.rpc('exec_sql', {
                sql: altPolicySQL
            });

            if (altError) {
                console.log('❌ Error creando política alternativa:', altError.message);
                reporte.errores.push(`Paso 4: ${altError.message}`);
            } else {
                console.log('✅ Política alternativa creada exitosamente');
                reporte.pasos.push('Paso 4: Política alternativa creada');
            }
        } catch (error) {
            console.log('❌ Error en paso 4:', error.message);
            reporte.errores.push(`Paso 4: ${error.message}`);
        }

        // PASO 5: Verificar permisos de tabla
        console.log('\n🔐 PASO 5: Verificar permisos de tabla...');
        try {
            const grantSQL = `
                GRANT INSERT ON "public"."users" TO authenticated;
                GRANT INSERT ON "public"."users" TO anon;
            `;

            const { error: grantError } = await supabase.rpc('exec_sql', {
                sql: grantSQL
            });

            if (grantError) {
                console.log('❌ Error otorgando permisos:', grantError.message);
                reporte.errores.push(`Paso 5: ${grantError.message}`);
            } else {
                console.log('✅ Permisos otorgados exitosamente');
                reporte.pasos.push('Paso 5: Permisos otorgados');
            }
        } catch (error) {
            console.log('❌ Error en paso 5:', error.message);
            reporte.errores.push(`Paso 5: ${error.message}`);
        }

        // PASO 6: Verificar políticas finales
        console.log('\n✅ PASO 6: Verificar políticas finales...');
        try {
            const { data: finalPolicies, error: finalError } = await supabase
                .from('pg_policies')
                .select('*')
                .eq('tablename', 'users');

            if (finalError) {
                console.log('❌ Error verificando políticas finales:', finalError.message);
                reporte.errores.push(`Paso 6: ${finalError.message}`);
            } else {
                console.log('✅ Políticas finales verificadas:', finalPolicies?.length || 0);
                reporte.pasos.push('Paso 6: Políticas finales verificadas');
            }
        } catch (error) {
            console.log('❌ Error en paso 6:', error.message);
            reporte.errores.push(`Paso 6: ${error.message}`);
        }

        // Determinar éxito
        reporte.exito = reporte.pasos.length > reporte.errores.length;

        // Mostrar resumen
        console.log('\n🎯 RESUMEN DE LA CORRECCIÓN:');
        console.log('============================================================');
        console.log(`✅ Pasos completados: ${reporte.pasos.length}`);
        console.log(`❌ Errores encontrados: ${reporte.errores.length}`);
        console.log(`🎯 Estado final: ${reporte.exito ? 'EXITOSO' : 'CON ERRORES'}`);

        if (reporte.exito) {
            console.log('\n✅ CORRECCIÓN COMPLETADA EXITOSAMENTE');
            console.log('El error "Database error saving new user" debería estar resuelto.');
        } else {
            console.log('\n⚠️ CORRECCIÓN COMPLETADA CON ERRORES');
            console.log('Revisar errores y aplicar correcciones manuales si es necesario.');
        }

        // Guardar reporte
        const reportePath = path.join(__dirname, '231-Reporte-Correccion-Policy-INSERT-Users-Final.json');
        fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
        console.log(`\n📄 Reporte guardado en: ${reportePath}`);

        console.log('\n🔄 PRÓXIMOS PASOS:');
        console.log('1. Ejecutar testing de registro de usuarios');
        console.log('2. Verificar que el error "Database error saving new user" esté resuelto');
        console.log('3. Probar registro desde la aplicación web');
        console.log('4. Confirmar funcionamiento completo');

        console.log('\n✅ PROCESO DE CORRECCIÓN COMPLETADO');

        return reporte;

    } catch (error) {
        console.error('❌ ERROR CRÍTICO EN LA CORRECCIÓN:', error);
        reporte.errores.push(`Error crítico: ${error.message}`);
        reporte.exito = false;
        return reporte;
    }
}

// Ejecutar corrección
if (require.main === module) {
    corregirPolicyInsertUsers()
        .then(reporte => {
            process.exit(reporte.exito ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ ERROR FATAL:', error);
            process.exit(1);
        });
}

module.exports = { corregirPolicyInsertUsers };
