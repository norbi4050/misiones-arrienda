// =====================================================
// TEST DE CONEXIÓN SUPABASE CON OUTPUT A ARCHIVO
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
    const logFile = 'Blackbox/TEST-CONNECTION-RESULTS.txt';
    let log = '';

    log += '🔗 TESTEANDO CONEXIÓN A SUPABASE\n';
    log += '=' .repeat(50) + '\n';
    log += `Timestamp: ${new Date().toISOString()}\n\n`;

    try {
        // Test básico de conexión
        log += '📡 Probando conexión básica...\n';
        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        if (error) {
            log += `❌ ERROR DE CONEXIÓN: ${error.message}\n`;
            fs.writeFileSync(logFile, log);
            return false;
        }

        log += `✅ CONEXIÓN EXITOSA\n`;
        log += `📊 Registros en tabla users: ${data}\n\n`;

        // Verificar políticas actuales
        log += '📋 Verificando políticas...\n';
        const { data: policies, error: polError } = await supabase.rpc('sql', {
            query: `
                SELECT COUNT(*) as total_policies
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename IN ('users', 'favorites', 'property_inquiries');
            `
        });

        if (!polError && policies.length > 0) {
            log += `📋 Políticas totales: ${policies[0].total_policies}\n`;
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
            log += `🚨 Políticas problemáticas: ${problematic[0].problematic_policies}\n`;
        }

        log += '\n✅ TEST COMPLETADO EXITOSAMENTE\n';

        fs.writeFileSync(logFile, log);
        return true;

    } catch (error) {
        log += `❌ ERROR INESPERADO: ${error.message}\n`;
        fs.writeFileSync(logFile, log);
        return false;
    }
}

// Ejecutar test
testConnection().then(success => {
    console.log(success ? '✅ Test completado - revisar TEST-CONNECTION-RESULTS.txt' : '❌ Test fallido');
}).catch(err => {
    console.log('❌ Error fatal:', err.message);
});
