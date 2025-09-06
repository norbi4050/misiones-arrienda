// =====================================================
// TEST DE CONEXIÓN SUPABASE
// =====================================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
    console.log('🔗 TESTEANDO CONEXIÓN A SUPABASE');
    console.log('=' .repeat(50));

    try {
        // Test básico de conexión
        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.log('❌ ERROR DE CONEXIÓN:', error.message);
            return false;
        }

        console.log('✅ CONEXIÓN EXITOSA');
        console.log(`📊 Registros en tabla users: ${data}`);

        // Verificar políticas actuales
        const { data: policies, error: polError } = await supabase.rpc('sql', {
            query: `
                SELECT COUNT(*) as total_policies
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename IN ('users', 'favorites', 'property_inquiries');
            `
        });

        if (!polError && policies.length > 0) {
            console.log(`📋 Políticas totales: ${policies[0].total_policies}`);
        }

        // Verificar políticas problemáticas
        const { data: problematic, error: probError } = await supabase.rpc('sql', {
            query: `
                SELECT COUNT(*) as problematic_policies
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename IN ('users', 'favorites', 'property_inquiries')
                    AND qual LIKE '%auth.uid()%'
                    AND qual NOT LIKE '%(select auth.uid())%';
            `
        });

        if (!probError && problematic.length > 0) {
            console.log(`🚨 Políticas problemáticas: ${problematic[0].problematic_policies}`);
        }

        return true;

    } catch (error) {
        console.log('❌ ERROR INESPERADO:', error.message);
        return false;
    }
}

// Ejecutar test
if (require.main === module) {
    testConnection().then(success => {
        console.log('');
        console.log(success ? '✅ TEST COMPLETADO' : '❌ TEST FALLIDO');
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testConnection };
