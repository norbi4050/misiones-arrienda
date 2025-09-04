// ============================================================
// SCRIPT AUTOMATIZADO: CORRECCIÓN POLÍTICA INSERT USERS
// ============================================================
// Aplica la solución definitiva para el error de registro
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase con credenciales reales
const SUPABASE_URL = 'https://pqmjfwmbitodwtpedlle.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWpmd21iaXRvZHd0cGVkbGxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTkzODY3MSwiZXhwIjoyMDUxNTE0NjcxfQ.oaVblFsOgm8SUNOTOCgmSJG_-6FL4_AQx_DjAhKQhSs';

// Cliente con permisos de service_role para modificar políticas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔧 EJECUTANDO CORRECCIÓN AUTOMÁTICA: POLÍTICA INSERT USERS');
console.log('============================================================\n');

async function aplicarCorreccionPoliticas() {
    const reporte = {
        timestamp: new Date().toISOString(),
        proceso: 'Corrección Automática Política INSERT Users',
        pasos: [],
        errores: [],
        exito: false
    };

    try {
        console.log('📋 PASO 1: Verificar políticas actuales...');
        
        // Consultar políticas actuales
        const { data: politicasActuales, error: errorConsulta } = await supabase
            .rpc('exec_sql', {
                sql: `
                SELECT 
                    schemaname,
                    tablename,
                    policyname,
                    permissive,
                    roles,
                    cmd,
                    qual,
                    with_check
                FROM pg_policies 
                WHERE tablename = 'users' 
                AND schemaname = 'public'
                AND cmd = 'INSERT'
                ORDER BY policyname;
                `
            });

        if (errorConsulta) {
            console.log('❌ Error consultando políticas:', errorConsulta.message);
            reporte.errores.push(`Error consultando políticas: ${errorConsulta.message}`);
        } else {
            console.log('✅ Políticas INSERT actuales encontradas:', politicasActuales?.length || 0);
            reporte.pasos.push({
                paso: 1,
                descripcion: 'Verificación políticas actuales',
                resultado: 'exitoso',
                detalles: `${politicasActuales?.length || 0} políticas INSERT encontradas`
            });
        }

        console.log('\n🗑️ PASO 2: Eliminar política problemática...');
        
        // Eliminar política problemática
        const { error: errorEliminar } = await supabase
            .rpc('exec_sql', {
                sql: `DROP POLICY IF EXISTS "Enable insert for registration" ON public.users;`
            });

        if (errorEliminar) {
            console.log('❌ Error eliminando política:', errorEliminar.message);
            reporte.errores.push(`Error eliminando política: ${errorEliminar.message}`);
        } else {
            console.log('✅ Política problemática eliminada exitosamente');
            reporte.pasos.push({
                paso: 2,
                descripcion: 'Eliminación política problemática',
                resultado: 'exitoso',
                detalles: 'Política "Enable insert for registration" eliminada'
            });
        }

        console.log('\n🆕 PASO 3: Crear nueva política INSERT funcional...');
        
        // Crear nueva política funcional
        const { error: errorCrear1 } = await supabase
            .rpc('exec_sql', {
                sql: `
                CREATE POLICY "users_insert_policy_fixed" ON public.users
                    FOR INSERT
                    WITH CHECK (
                        (auth.uid() IS NOT NULL) OR 
                        (auth.role() = 'anon') OR 
                        (auth.role() = 'service_role')
                    );
                `
            });

        if (errorCrear1) {
            console.log('❌ Error creando política principal:', errorCrear1.message);
            reporte.errores.push(`Error creando política principal: ${errorCrear1.message}`);
        } else {
            console.log('✅ Nueva política principal creada exitosamente');
            reporte.pasos.push({
                paso: 3,
                descripcion: 'Creación política principal',
                resultado: 'exitoso',
                detalles: 'Política "users_insert_policy_fixed" creada'
            });
        }

        console.log('\n🔄 PASO 4: Crear política alternativa de respaldo...');
        
        // Crear política alternativa más permisiva
        const { error: errorCrear2 } = await supabase
            .rpc('exec_sql', {
                sql: `
                CREATE POLICY "users_registration_insert" ON public.users
                    FOR INSERT
                    WITH CHECK (true);
                `
            });

        if (errorCrear2) {
            console.log('❌ Error creando política alternativa:', errorCrear2.message);
            reporte.errores.push(`Error creando política alternativa: ${errorCrear2.message}`);
        } else {
            console.log('✅ Política alternativa creada exitosamente');
            reporte.pasos.push({
                paso: 4,
                descripcion: 'Creación política alternativa',
                resultado: 'exitoso',
                detalles: 'Política "users_registration_insert" creada'
            });
        }

        console.log('\n🔐 PASO 5: Verificar permisos de tabla...');
        
        // Otorgar permisos necesarios
        const { error: errorPermisos } = await supabase
            .rpc('exec_sql', {
                sql: `
                GRANT INSERT ON public.users TO anon;
                GRANT INSERT ON public.users TO authenticated;
                `
            });

        if (errorPermisos) {
            console.log('❌ Error otorgando permisos:', errorPermisos.message);
            reporte.errores.push(`Error otorgando permisos: ${errorPermisos.message}`);
        } else {
            console.log('✅ Permisos otorgados exitosamente');
            reporte.pasos.push({
                paso: 5,
                descripcion: 'Otorgamiento de permisos',
                resultado: 'exitoso',
                detalles: 'Permisos INSERT otorgados a anon y authenticated'
            });
        }

        console.log('\n✅ PASO 6: Verificar políticas finales...');
        
        // Verificar políticas finales
        const { data: politicasFinales, error: errorVerificacion } = await supabase
            .rpc('exec_sql', {
                sql: `
                SELECT 
                    policyname,
                    cmd,
                    with_check
                FROM pg_policies 
                WHERE tablename = 'users' 
                AND schemaname = 'public'
                AND cmd = 'INSERT'
                ORDER BY policyname;
                `
            });

        if (errorVerificacion) {
            console.log('❌ Error verificando políticas finales:', errorVerificacion.message);
            reporte.errores.push(`Error verificando políticas finales: ${errorVerificacion.message}`);
        } else {
            console.log('✅ Verificación completada');
            console.log('📊 Políticas INSERT finales:');
            if (politicasFinales && politicasFinales.length > 0) {
                politicasFinales.forEach(politica => {
                    console.log(`   - ${politica.policyname}: ${politica.with_check}`);
                });
            }
            
            reporte.pasos.push({
                paso: 6,
                descripcion: 'Verificación políticas finales',
                resultado: 'exitoso',
                detalles: `${politicasFinales?.length || 0} políticas INSERT activas`,
                politicas: politicasFinales
            });
        }

        // Determinar éxito general
        reporte.exito = reporte.errores.length === 0;
        
        console.log('\n🎯 RESUMEN DE LA CORRECCIÓN:');
        console.log('============================================================');
        console.log(`✅ Pasos completados: ${reporte.pasos.length}`);
        console.log(`❌ Errores encontrados: ${reporte.errores.length}`);
        console.log(`🎯 Estado final: ${reporte.exito ? 'EXITOSO' : 'CON ERRORES'}`);
        
        if (reporte.exito) {
            console.log('\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE');
            console.log('La política INSERT problemática ha sido corregida.');
            console.log('El registro de usuarios debería funcionar ahora.');
        } else {
            console.log('\n⚠️ CORRECCIÓN COMPLETADA CON ERRORES');
            console.log('Revisar errores y aplicar correcciones manuales si es necesario.');
        }

    } catch (error) {
        console.log('❌ Error crítico en la corrección:', error.message);
        reporte.errores.push(`Error crítico: ${error.message}`);
        reporte.exito = false;
    }

    // Guardar reporte
    try {
        fs.writeFileSync(
            'Blackbox/227-Reporte-Correccion-Policy-INSERT-Users-Final.json',
            JSON.stringify(reporte, null, 2)
        );
        console.log('\n📄 Reporte guardado en: Blackbox/227-Reporte-Correccion-Policy-INSERT-Users-Final.json');
    } catch (errorArchivo) {
        console.log('❌ Error guardando reporte:', errorArchivo.message);
    }

    console.log('\n🔄 PRÓXIMOS PASOS:');
    console.log('1. Ejecutar testing de registro de usuarios');
    console.log('2. Verificar que el error "Database error saving new user" esté resuelto');
    console.log('3. Probar registro desde la aplicación web');
    console.log('4. Confirmar funcionamiento completo');

    return reporte;
}

// Ejecutar corrección
aplicarCorreccionPoliticas()
    .then(reporte => {
        console.log('\n✅ PROCESO DE CORRECCIÓN COMPLETADO');
        process.exit(reporte.exito ? 0 : 1);
    })
    .catch(error => {
        console.log('❌ Error fatal:', error.message);
        process.exit(1);
    });
