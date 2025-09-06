const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnosticarEsquemaProperty() {
    console.log('🔍 DIAGNOSTICANDO ESQUEMA DE TABLA PROPERTY');
    console.log('=' .repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('=' .repeat(60));
    console.log('');

    try {
        // Obtener estructura de la tabla Property
        const { data: columns, error: colError } = await supabase.rpc('sql', {
            query: `
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                    AND table_name = 'Property'
                ORDER BY ordinal_position;
            `
        });

        if (colError) {
            console.log('❌ ERROR obteniendo columnas:', colError.message);
            return;
        }

        console.log('📋 COLUMNAS ACTUALES EN TABLA PROPERTY:');
        console.log('=' .repeat(60));

        let hasCurrency = false;
        columns.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULLABLE)' : '(NOT NULL)'}`);
            if (col.column_name === 'currency') {
                hasCurrency = true;
            }
        });

        console.log('\n' + '=' .repeat(60));
        console.log('🔍 ANÁLISIS DE COLUMNA CURRENCY:');
        console.log('=' .repeat(60));

        if (hasCurrency) {
            console.log('✅ La columna "currency" existe en la tabla Property');
        } else {
            console.log('❌ La columna "currency" NO existe en la tabla Property');
            console.log('🔧 Necesario agregar la columna currency');
        }

        // Verificar políticas RLS
        console.log('\n' + '=' .repeat(60));
        console.log('🔒 POLÍTICAS RLS DE PROPERTY:');
        console.log('=' .repeat(60));

        const { data: policies, error: polError } = await supabase.rpc('sql', {
            query: `
                SELECT
                    schemaname,
                    tablename,
                    policyname,
                    cmd,
                    qual,
                    with_check
                FROM pg_policies
                WHERE schemaname = 'public'
                    AND tablename = 'Property'
                ORDER BY policyname;
            `
        });

        if (polError) {
            console.log('❌ ERROR obteniendo políticas:', polError.message);
        } else {
            console.log(`📋 ${policies.length} políticas encontradas:`);
            policies.forEach(policy => {
                console.log(`\n🔍 ${policy.policyname} (${policy.cmd})`);

                if (policy.qual) {
                    const hasRawAuthUid = policy.qual.includes('auth.uid()') && !policy.qual.includes('(select auth.uid())');
                    console.log(`   USING: ${policy.qual}`);
                    console.log(`   ❌ Raw auth.uid(): ${hasRawAuthUid ? 'SÍ' : 'NO'}`);
                }

                if (policy.with_check) {
                    const hasRawAuthUid = policy.with_check.includes('auth.uid()') && !policy.with_check.includes('(select auth.uid())');
                    console.log(`   WITH CHECK: ${policy.with_check}`);
                    console.log(`   ❌ Raw auth.uid(): ${hasRawAuthUid ? 'SÍ' : 'NO'}`);
                }
            });
        }

        // Generar SQL de corrección
        console.log('\n' + '=' .repeat(60));
        console.log('🔧 SQL DE CORRECCIÓN GENERADO:');
        console.log('=' .repeat(60));

        let sqlStatements = [];

        // Agregar columna currency si no existe
        if (!hasCurrency) {
            sqlStatements.push(`
-- Agregar columna currency faltante
ALTER TABLE public.Property
ADD COLUMN currency VARCHAR(10) DEFAULT 'USD';
            `);
        }

        // Corregir políticas RLS si es necesario
        if (policies && policies.length > 0) {
            policies.forEach(policy => {
                let needsFix = false;
                let sql = '';

                if (policy.qual && policy.qual.includes('auth.uid()') && !policy.qual.includes('(select auth.uid())')) {
                    needsFix = true;
                    sql = `ALTER POLICY "${policy.policyname}" ON public.Property\nTO anon, authenticated, authenticator, dashboard_user\nUSING (\n    ${policy.qual.replace(/auth\.uid\(\)/g, '(select auth.uid())')}\n);`;
                }

                if (policy.with_check && policy.with_check.includes('auth.uid()') && !policy.with_check.includes('(select auth.uid())')) {
                    needsFix = true;
                    if (sql) {
                        sql += '\n' + `ALTER POLICY "${policy.policyname}" ON public.Property\nTO anon, authenticated, authenticator, dashboard_user\nWITH CHECK (\n    ${policy.with_check.replace(/auth\.uid\(\)/g, '(select auth.uid())')}\n);`;
                    } else {
                        sql = `ALTER POLICY "${policy.policyname}" ON public.Property\nTO anon, authenticated, authenticator, dashboard_user\nWITH CHECK (\n    ${policy.with_check.replace(/auth\.uid\(\)/g, '(select auth.uid())')}\n);`;
                    }
                }

                if (needsFix && sql) {
                    sqlStatements.push(`-- Fix for ${policy.policyname}\n${sql}`);
                }
            });
        }

        // Guardar reporte
        const reporte = {
            timestamp: new Date().toISOString(),
            columns: columns,
            hasCurrency: hasCurrency,
            policies: policies || [],
            sqlCorrections: sqlStatements
        };

        const fs = require('fs');
        fs.writeFileSync('Blackbox/REPORTE-DIAGNOSTICO-PROPERTY.json', JSON.stringify(reporte, null, 2));

        console.log('\n📄 Reporte guardado en: Blackbox/REPORTE-DIAGNOSTICO-PROPERTY.json');

        // Mostrar SQL generado
        if (sqlStatements.length > 0) {
            console.log('\n🔧 SQL A EJECUTAR:');
            sqlStatements.forEach((sql, index) => {
                console.log(`\n-- Corrección ${index + 1}`);
                console.log(sql);
            });
        } else {
            console.log('\n✅ No se requieren correcciones SQL');
        }

        console.log('\n✅ Diagnóstico completado');

        return reporte;

    } catch (error) {
        console.log('❌ ERROR DURANTE EL DIAGNÓSTICO:', error.message);
        return null;
    }
}

// Ejecutar
if (require.main === module) {
    diagnosticarEsquemaProperty().catch(console.error);
}

module.exports = { diagnosticarEsquemaProperty };
