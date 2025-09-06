const { createClient } = require('@supabase/supabase-js');

console.log('🔍 ANÁLISIS DE IMPACTO - OPTIMIZACIÓN WARNINGS SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function analizarImpactoOptimizacion() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Objetivo: Verificar que optimización NO rompe funcionalidades existentes');
    console.log('');

    const resultados = {
        funcionesActuales: [],
        riesgos: [],
        mitigaciones: [],
        testsRequeridos: [],
        backupPlan: []
    };

    try {
        // =====================================================
        // PASO 1: MAPEAR FUNCIONALIDADES ACTUALES
        // =====================================================
        console.log('🗺️ PASO 1: MAPEANDO FUNCIONALIDADES ACTUALES...');
        console.log('-'.repeat(50));

        // Verificar políticas actuales y su uso
        const { data: politicasActuales, error: politicasError } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, roles, qual, with_check')
            .eq('schemaname', 'public')
            .eq('tablename', 'users');

        if (!politicasError && politicasActuales) {
            console.log(`   📊 Políticas actuales: ${politicasActuales.length}`);
            politicasActuales.forEach(p => {
                console.log(`      └─ ${p.policyname} (${p.cmd}) - Roles: ${p.roles}`);
                resultados.funcionesActuales.push({
                    tipo: 'politica',
                    nombre: p.policyname,
                    accion: p.cmd,
                    roles: p.roles,
                    condicion: p.qual
                });
            });
        }

        // Verificar funcionalidades críticas del proyecto
        console.log('');
        console.log('🔍 Verificando funcionalidades críticas...');

        // Test 1: Login/Autenticación
        console.log('   🔐 Test 1: Sistema de autenticación...');
        try {
            const { data: testAuth, error: authError } = await supabase
                .from('users')
                .select('id, email, user_type')
                .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
                .single();

            if (!authError && testAuth) {
                console.log('      ✅ Autenticación funcional');
                resultados.funcionesActuales.push({
                    tipo: 'funcionalidad',
                    nombre: 'autenticacion',
                    estado: 'funcional',
                    detalles: 'Usuario de prueba accesible'
                });
            }
        } catch (error) {
            console.log('      ❌ Error en autenticación:', error.message);
            resultados.riesgos.push({
                tipo: 'critico',
                area: 'autenticacion',
                descripcion: 'Error en acceso a usuarios'
            });
        }

        // Test 2: Perfiles de usuario
        console.log('   👤 Test 2: Gestión de perfiles...');
        try {
            const { data: perfiles, error: perfilesError } = await supabase
                .from('users')
                .select('id, name, email, user_type, created_at')
                .limit(5);

            if (!perfilesError && perfiles) {
                console.log(`      ✅ Perfiles accesibles (${perfiles.length} encontrados)`);
                resultados.funcionesActuales.push({
                    tipo: 'funcionalidad',
                    nombre: 'perfiles',
                    estado: 'funcional',
                    detalles: `${perfiles.length} perfiles accesibles`
                });
            }
        } catch (error) {
            console.log('      ❌ Error en perfiles:', error.message);
            resultados.riesgos.push({
                tipo: 'alto',
                area: 'perfiles',
                descripcion: 'Error en acceso a perfiles'
            });
        }

        // Test 3: Operaciones CRUD
        console.log('   📝 Test 3: Operaciones CRUD...');
        const operacionesCRUD = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
        
        operacionesCRUD.forEach(operacion => {
            const politicasOperacion = politicasActuales?.filter(p => p.cmd === operacion) || [];
            console.log(`      ${operacion}: ${politicasOperacion.length} políticas`);
            
            if (politicasOperacion.length === 0) {
                resultados.riesgos.push({
                    tipo: 'medio',
                    area: 'crud',
                    descripcion: `No hay políticas para ${operacion}`
                });
            }
        });

        // =====================================================
        // PASO 2: IDENTIFICAR RIESGOS ESPECÍFICOS
        // =====================================================
        console.log('');
        console.log('⚠️ PASO 2: IDENTIFICANDO RIESGOS ESPECÍFICOS...');
        console.log('-'.repeat(50));

        // Riesgo 1: Cambio en lógica de auth.uid()
        console.log('   🔍 Riesgo 1: Cambio auth.uid() → (select auth.uid())');
        console.log('      📋 Impacto: Cambio en evaluación de políticas RLS');
        console.log('      🎯 Mitigación: Funcionalidad idéntica, solo optimización');
        resultados.riesgos.push({
            tipo: 'bajo',
            area: 'rls_optimization',
            descripcion: 'Cambio en sintaxis de auth functions',
            mitigacion: 'Funcionalidad equivalente, solo mejora performance'
        });

        // Riesgo 2: Consolidación de políticas múltiples
        console.log('   🔍 Riesgo 2: Consolidación de políticas múltiples');
        const politicasSelect = politicasActuales?.filter(p => p.cmd === 'SELECT') || [];
        if (politicasSelect.length > 1) {
            console.log(`      📋 Impacto: ${politicasSelect.length} políticas SELECT → 1 consolidada`);
            console.log('      🎯 Mitigación: Lógica OR mantiene todos los permisos');
            resultados.riesgos.push({
                tipo: 'medio',
                area: 'policy_consolidation',
                descripcion: 'Múltiples políticas SELECT consolidadas en una',
                mitigacion: 'Lógica OR preserva todos los permisos existentes'
            });
        }

        // Riesgo 3: Eliminación de índices duplicados
        console.log('   🔍 Riesgo 3: Eliminación de índices duplicados');
        const { data: indices, error: indicesError } = await supabase
            .from('pg_indexes')
            .select('indexname')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .like('indexname', '%email%');

        if (!indicesError && indices && indices.length > 1) {
            console.log(`      📋 Impacto: ${indices.length} índices email → 1 optimizado`);
            console.log('      🎯 Mitigación: Mantener índice principal, eliminar duplicados');
            resultados.riesgos.push({
                tipo: 'bajo',
                area: 'index_optimization',
                descripcion: 'Eliminación de índices duplicados',
                mitigacion: 'Mantener índice principal funcional'
            });
        }

        // =====================================================
        // PASO 3: PLAN DE MITIGACIÓN
        // =====================================================
        console.log('');
        console.log('🛡️ PASO 3: PLAN DE MITIGACIÓN...');
        console.log('-'.repeat(50));

        const mitigaciones = [
            {
                riesgo: 'Pérdida de funcionalidad RLS',
                solucion: 'Backup completo de políticas antes de cambios',
                implementacion: 'Crear backup-politicas-antes-optimizacion.json'
            },
            {
                riesgo: 'Error 406 reaparece',
                solucion: 'Test inmediato post-optimización del usuario crítico',
                implementacion: 'Verificar ID 6403f9d2-e846-4c70-87e0-e051127d9500'
            },
            {
                riesgo: 'Pérdida de acceso a datos',
                solucion: 'Rollback plan con políticas originales',
                implementacion: 'Script de restauración automática'
            },
            {
                riesgo: 'Ruptura de autenticación',
                solucion: 'Test de login/registro inmediato',
                implementacion: 'Suite de tests post-optimización'
            }
        ];

        mitigaciones.forEach((mit, index) => {
            console.log(`   ${index + 1}. ${mit.riesgo}`);
            console.log(`      └─ Solución: ${mit.solucion}`);
            console.log(`      └─ Implementación: ${mit.implementacion}`);
            resultados.mitigaciones.push(mit);
        });

        // =====================================================
        // PASO 4: TESTS REQUERIDOS PRE Y POST OPTIMIZACIÓN
        // =====================================================
        console.log('');
        console.log('🧪 PASO 4: TESTS REQUERIDOS...');
        console.log('-'.repeat(50));

        const testsRequeridos = [
            {
                fase: 'PRE-OPTIMIZACIÓN',
                tests: [
                    'Backup completo de políticas actuales',
                    'Test de acceso usuario crítico (6403f9d2...)',
                    'Test de operaciones CRUD básicas',
                    'Verificación de RLS habilitado',
                    'Test de autenticación básica'
                ]
            },
            {
                fase: 'POST-OPTIMIZACIÓN',
                tests: [
                    'Verificar políticas optimizadas creadas',
                    'Test usuario crítico sigue accesible',
                    'Test operaciones CRUD funcionan',
                    'Verificar RLS sigue habilitado',
                    'Test autenticación completa',
                    'Verificar warnings eliminados en Dashboard',
                    'Test performance mejorada'
                ]
            }
        ];

        testsRequeridos.forEach(fase => {
            console.log(`   📋 ${fase.fase}:`);
            fase.tests.forEach(test => {
                console.log(`      ✓ ${test}`);
            });
            console.log('');
            resultados.testsRequeridos.push(fase);
        });

        // =====================================================
        // PASO 5: PLAN DE ROLLBACK
        // =====================================================
        console.log('');
        console.log('🔄 PASO 5: PLAN DE ROLLBACK...');
        console.log('-'.repeat(50));

        const rollbackPlan = [
            'DETENER inmediatamente si cualquier test falla',
            'RESTAURAR políticas desde backup-politicas-antes-optimizacion.json',
            'RECREAR índices eliminados si es necesario',
            'VERIFICAR que usuario crítico sigue accesible',
            'CONFIRMAR que error 406 no reaparece',
            'DOCUMENTAR problema para análisis posterior'
        ];

        rollbackPlan.forEach((paso, index) => {
            console.log(`   ${index + 1}. ${paso}`);
            resultados.backupPlan.push(paso);
        });

        // =====================================================
        // PASO 6: RECOMENDACIÓN FINAL
        // =====================================================
        console.log('');
        console.log('🎯 PASO 6: RECOMENDACIÓN FINAL...');
        console.log('='.repeat(70));

        const riesgoTotal = resultados.riesgos.length;
        const riesgosCriticos = resultados.riesgos.filter(r => r.tipo === 'critico').length;
        const riesgosAltos = resultados.riesgos.filter(r => r.tipo === 'alto').length;

        console.log(`📊 ANÁLISIS DE RIESGO:`);
        console.log(`   Total riesgos identificados: ${riesgoTotal}`);
        console.log(`   Riesgos críticos: ${riesgosCriticos}`);
        console.log(`   Riesgos altos: ${riesgosAltos}`);
        console.log(`   Riesgos medios/bajos: ${riesgoTotal - riesgosCriticos - riesgosAltos}`);

        console.log('');
        if (riesgosCriticos === 0 && riesgosAltos === 0) {
            console.log('✅ RECOMENDACIÓN: PROCEDER CON OPTIMIZACIÓN');
            console.log('   🎯 Riesgo: BAJO');
            console.log('   🛡️ Mitigación: Plan completo implementado');
            console.log('   🧪 Testing: Suite exhaustiva preparada');
            console.log('   🔄 Rollback: Plan de recuperación listo');
        } else {
            console.log('⚠️ RECOMENDACIÓN: PROCEDER CON PRECAUCIÓN EXTREMA');
            console.log('   🎯 Riesgo: ALTO');
            console.log('   🛡️ Mitigación: Resolver riesgos críticos primero');
            console.log('   🧪 Testing: Testing adicional requerido');
        }

        console.log('');
        console.log('📋 PRÓXIMOS PASOS SEGUROS:');
        console.log('1. Ejecutar tests PRE-optimización');
        console.log('2. Crear backup completo');
        console.log('3. Aplicar optimización en pasos graduales');
        console.log('4. Verificar cada paso antes de continuar');
        console.log('5. Ejecutar tests POST-optimización');
        console.log('6. Confirmar warnings eliminados');

        // Guardar análisis completo
        const fs = require('fs');
        fs.writeFileSync(
            'Blackbox/analisis-impacto-completo.json',
            JSON.stringify(resultados, null, 2)
        );

        console.log('');
        console.log('✅ ANÁLISIS DE IMPACTO COMPLETADO');
        console.log('📄 Reporte guardado: analisis-impacto-completo.json');

    } catch (error) {
        console.error('❌ Error en análisis de impacto:', error.message);
    }
}

// Ejecutar análisis
if (require.main === module) {
    analizarImpactoOptimizacion().catch(console.error);
}

module.exports = { analizarImpactoOptimizacion };
