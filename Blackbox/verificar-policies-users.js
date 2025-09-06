const { createClient } = require('@supabase/supabase-js');

console.log('🔒 VERIFICACIÓN DE POLÍTICAS RLS - TABLA USERS');
console.log('=' .repeat(60));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function verificarPoliciesUsers() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase...');
    console.log('');

    const resultado = {
        rlsHabilitado: false,
        politicasEncontradas: [],
        totalPoliticas: 0,
        politicasRequeridas: [
            'Users can view own profile',
            'Users can update own profile', 
            'Users can insert own profile',
            'Users can delete own profile',
            'Public profiles viewable by authenticated users',
            'Admins can view all profiles',
            'Service role full access'
        ],
        politicasFaltantes: [],
        requiereCreacion: false,
        estadoGeneral: 'VERIFICANDO'
    };

    try {
        // 1. VERIFICAR SI RLS ESTÁ HABILITADO
        console.log('🔍 VERIFICANDO SI RLS ESTÁ HABILITADO...');
        console.log('-'.repeat(50));

        const { data: rlsStatus, error: rlsError } = await supabase
            .from('pg_tables')
            .select('schemaname, tablename, rowsecurity')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .single();

        if (rlsError) {
            console.log('   ❌ Error verificando RLS:', rlsError.message);
        } else {
            resultado.rlsHabilitado = rlsStatus.rowsecurity;
            if (rlsStatus.rowsecurity) {
                console.log('   ✅ RLS HABILITADO en tabla users');
            } else {
                console.log('   ❌ RLS NO HABILITADO en tabla users');
            }
        }

        // 2. VERIFICAR POLÍTICAS EXISTENTES
        console.log('');
        console.log('📋 VERIFICANDO POLÍTICAS EXISTENTES...');
        console.log('-'.repeat(50));

        const { data: politicas, error: politicasError } = await supabase
            .from('pg_policies')
            .select('schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check')
            .eq('schemaname', 'public')
            .eq('tablename', 'users');

        if (politicasError) {
            console.log('   ❌ Error obteniendo políticas:', politicasError.message);
        } else {
            resultado.totalPoliticas = politicas.length;
            resultado.politicasEncontradas = politicas.map(p => p.policyname);

            console.log(`   📊 Total de políticas encontradas: ${politicas.length}`);
            
            if (politicas.length === 0) {
                console.log('   ❌ NO HAY POLÍTICAS CONFIGURADAS');
            } else {
                console.log('   📋 Políticas existentes:');
                politicas.forEach((politica, index) => {
                    console.log(`      ${index + 1}. ${politica.policyname}`);
                    console.log(`         - Comando: ${politica.cmd}`);
                    console.log(`         - Roles: ${politica.roles}`);
                    console.log('');
                });
            }
        }

        // 3. VERIFICAR POLÍTICAS FALTANTES
        console.log('🔍 VERIFICANDO POLÍTICAS FALTANTES...');
        console.log('-'.repeat(50));

        resultado.politicasFaltantes = resultado.politicasRequeridas.filter(
            requerida => !resultado.politicasEncontradas.includes(requerida)
        );

        if (resultado.politicasFaltantes.length === 0) {
            console.log('   ✅ TODAS LAS POLÍTICAS REQUERIDAS ESTÁN PRESENTES');
        } else {
            console.log(`   ⚠️ FALTAN ${resultado.politicasFaltantes.length} POLÍTICAS:`);
            resultado.politicasFaltantes.forEach((faltante, index) => {
                console.log(`      ${index + 1}. ${faltante}`);
            });
        }

        // 4. DETERMINAR SI SE REQUIERE CREACIÓN
        if (!resultado.rlsHabilitado || resultado.politicasFaltantes.length > 0) {
            resultado.requiereCreacion = true;
            resultado.estadoGeneral = 'REQUIERE CONFIGURACIÓN';
        } else {
            resultado.requiereCreacion = false;
            resultado.estadoGeneral = 'COMPLETAMENTE CONFIGURADO';
        }

        // 5. TEST DE ACCESO CON POLÍTICAS
        console.log('');
        console.log('🧪 TEST DE ACCESO CON POLÍTICAS...');
        console.log('-'.repeat(50));

        try {
            const { data: testData, error: testError } = await supabase
                .from('users')
                .select('id, name, email')
                .limit(1);

            if (testError) {
                console.log('   ❌ Error en test de acceso:', testError.message);
                if (testError.code === 'PGRST301') {
                    console.log('   🚨 PROBLEMA: Políticas RLS muy restrictivas o mal configuradas');
                }
            } else {
                console.log('   ✅ Test de acceso exitoso');
                console.log(`   📊 Registros accesibles: ${testData.length}`);
            }
        } catch (error) {
            console.log('   ❌ Error en test:', error.message);
        }

        // RESUMEN FINAL
        console.log('');
        console.log('📊 RESUMEN DE VERIFICACIÓN');
        console.log('='.repeat(60));
        
        console.log(`🔒 RLS habilitado: ${resultado.rlsHabilitado ? '✅' : '❌'}`);
        console.log(`📋 Políticas encontradas: ${resultado.totalPoliticas}`);
        console.log(`⚠️ Políticas faltantes: ${resultado.politicasFaltantes.length}`);
        console.log(`🎯 Estado general: ${resultado.estadoGeneral}`);

        if (resultado.requiereCreacion) {
            console.log('');
            console.log('🛠️ ACCIÓN REQUERIDA:');
            console.log('   1. Ejecutar el archivo: crear-policies-users-supabase.sql');
            console.log('   2. Ir a Supabase Dashboard > SQL Editor');
            console.log('   3. Copiar y pegar el contenido del archivo SQL');
            console.log('   4. Ejecutar el script');
            console.log('   5. Verificar que las políticas se crearon correctamente');
        } else {
            console.log('');
            console.log('✅ NO SE REQUIERE ACCIÓN - POLÍTICAS COMPLETAMENTE CONFIGURADAS');
        }

        // Guardar resultado
        require('fs').writeFileSync(
            'REPORTE-VERIFICACION-POLICIES-USERS.json',
            JSON.stringify(resultado, null, 2)
        );

        console.log('');
        console.log('📄 Reporte guardado en: REPORTE-VERIFICACION-POLICIES-USERS.json');
        console.log('✅ VERIFICACIÓN COMPLETADA');

        return resultado;

    } catch (error) {
        console.error('❌ Error general en verificación:', error.message);
        resultado.estadoGeneral = 'ERROR EN VERIFICACIÓN';
        return resultado;
    }
}

verificarPoliciesUsers().catch(console.error);
