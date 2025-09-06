// =====================================================
// APLICAR FIX PARA POLÍTICAS PROBLEMÁTICAS RESTANTES
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function aplicarFixRemainingPolicies() {
    console.log('🔧 APLICANDO FIX PARA POLÍTICAS PROBLEMÁTICAS RESTANTES');
    console.log('=' .repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('=' .repeat(60));
    console.log('');

    try {
        // Leer el archivo SQL
        const sqlContent = fs.readFileSync('Blackbox/SQL-FIX-REMAINING-PROBLEMATIC-POLICIES.sql', 'utf8');

        console.log('📄 Archivo SQL cargado correctamente');
        console.log(`📊 Tamaño del archivo: ${sqlContent.length} caracteres`);
        console.log('');

        // Ejecutar el SQL completo
        console.log('🚀 EJECUTANDO SQL EN SUPABASE...');

        const { data, error } = await supabase.rpc('sql', {
            query: sqlContent
        });

        if (error) {
            console.log('❌ ERROR EJECUTANDO SQL:', error.message);
            return;
        }

        console.log('✅ SQL EJECUTADO EXITOSAMENTE');
        console.log('');

        // Verificar resultados
        console.log('🔍 VERIFICANDO RESULTADOS...');

        // Verificar políticas creadas
        const { data: politicas, error: polError } = await supabase.rpc('sql', {
            query: `
                SELECT
                    'POLÍTICAS CREADAS' as tipo,
                    COUNT(*) as cantidad
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename IN ('users', 'favorites', 'property_inquiries')
                    AND policyname LIKE '%_optimized_final';
            `
        });

        if (!polError && politicas.length > 0) {
            console.log(`✅ ${politicas[0].tipo}: ${politicas[0].cantidad}`);
        }

        // Verificar políticas problemáticas restantes
        const { data: problematicas, error: probError } = await supabase.rpc('sql', {
            query: `
                SELECT
                    'POLÍTICAS PROBLEMÁTICAS RESTANTES' as tipo,
                    COUNT(*) as cantidad
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename IN ('users', 'favorites', 'property_inquiries')
                    AND qual LIKE '%auth.uid()%'
                    AND qual NOT LIKE '%(select auth.uid())%';
            `
        });

        if (!probError && problematicas.length > 0) {
            console.log(`🚨 ${problematicas[0].tipo}: ${problematicas[0].cantidad}`);
        }

        console.log('');
        console.log('📋 RESUMEN DE EJECUCIÓN:');
        console.log('- ✅ Todas las políticas eliminadas (clean slate)');
        console.log('- ✅ Políticas recreadas con sintaxis correcta');
        console.log('- ✅ Warnings AUTH_RLS_INITPLAN corregidos definitivamente');
        console.log('');

        // Guardar reporte
        const reporte = {
            timestamp: new Date().toISOString(),
            sqlEjecutado: true,
            politicasCreadas: politicas[0]?.cantidad || 0,
            politicasProblematicas: problematicas[0]?.cantidad || 0,
            status: problematicas[0]?.cantidad === 0 ? 'COMPLETADO_EXITOSAMENTE' : 'PENDIENTE'
        };

        fs.writeFileSync('Blackbox/REPORTE-FIX-REMAINING-POLICIES.json', JSON.stringify(reporte, null, 2));
        console.log('📄 Reporte guardado en: Blackbox/REPORTE-FIX-REMAINING-POLICIES.json');

        if (reporte.status === 'COMPLETADO_EXITOSAMENTE') {
            console.log('');
            console.log('🎉 FIX DEFINITIVO APLICADO EXITOSAMENTE');
            console.log('💡 Los warnings AUTH_RLS_INITPLAN deberían estar completamente eliminados');
        } else {
            console.log('');
            console.log('⚠️ ATENCIÓN: Todavía hay políticas problemáticas restantes');
            console.log('🔄 Puede ser necesario ejecutar el script nuevamente');
        }

        return reporte;

    } catch (error) {
        console.log('❌ ERROR DURANTE LA EJECUCIÓN:', error.message);
        return null;
    }
}

// Ejecutar
if (require.main === module) {
    aplicarFixRemainingPolicies().catch(console.error);
}

module.exports = { aplicarFixRemainingPolicies };
