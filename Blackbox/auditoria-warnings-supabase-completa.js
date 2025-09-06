const { createClient } = require('@supabase/supabase-js');

console.log('🔍 AUDITORÍA COMPLETA DE WARNINGS EN SUPABASE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function auditarWarningsSupabase() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const warnings = [];
    const soluciones = [];

    console.log('🔗 Conectando a Supabase...');
    console.log('');

    try {
        // 1. AUDITAR TABLAS Y ESTRUCTURA
        console.log('📋 PASO 1: AUDITANDO ESTRUCTURA DE TABLAS...');
        console.log('-'.repeat(50));

        // Obtener todas las tablas
        const { data: tablas, error: tablasError } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'public')
            .order('table_name');

        if (tablasError) {
            console.log('❌ Error obteniendo tablas:', tablasError.message);
            warnings.push('Error accediendo a información de tablas');
        } else {
            console.log('✅ Tablas encontradas:');
            tablas.forEach(tabla => {
                console.log(`   - ${tabla.table_name}`);
            });

            // Verificar tablas críticas esperadas
            const tablasEsperadas = ['users', 'properties', 'agents', 'favorites', 'conversations', 'messages'];
            const tablasExistentes = tablas.map(t => t.table_name);
            
            tablasEsperadas.forEach(tablaEsperada => {
                if (!tablasExistentes.includes(tablaEsperada)) {
                    warnings.push(`⚠️ Tabla crítica faltante: ${tablaEsperada}`);
                    soluciones.push(`Crear tabla ${tablaEsperada} con estructura apropiada`);
                }
            });
        }

        console.log('');

        // 2. AUDITAR POLÍTICAS RLS
        console.log('🔒 PASO 2: AUDITANDO POLÍTICAS RLS...');
        console.log('-'.repeat(50));

        const { data: politicas, error: politicasError } = await supabase
            .from('pg_policies')
            .select('schemaname, tablename, policyname, cmd, roles, qual')
            .eq('schemaname', 'public');

        if (politicasError) {
            console.log('❌ Error obteniendo políticas:', politicasError.message);
            warnings.push('No se pueden verificar políticas RLS');
        } else {
            console.log('🛡️ Políticas RLS encontradas:');
            if (politicas.length === 0) {
                warnings.push('⚠️ NO HAY POLÍTICAS RLS CONFIGURADAS');
                soluciones.push('Configurar políticas RLS para todas las tablas críticas');
            } else {
                const tablasSinPoliticas = [];
                tablas?.forEach(tabla => {
                    const tienePoliticas = politicas.some(p => p.tablename === tabla.table_name);
                    if (!tienePoliticas && tabla.table_name !== 'schema_migrations') {
                        tablasSinPoliticas.push(tabla.table_name);
                    }
                });

                if (tablasSinPoliticas.length > 0) {
                    warnings.push(`⚠️ Tablas sin políticas RLS: ${tablasSinPoliticas.join(', ')}`);
                    soluciones.push('Configurar políticas RLS para tablas sin protección');
                }

                politicas.forEach(politica => {
                    console.log(`   - ${politica.tablename}: ${politica.policyname} (${politica.cmd})`);
                });
            }
        }

        console.log('');

        // 3. AUDITAR FUNCIONES Y TRIGGERS
        console.log('⚙️ PASO 3: AUDITANDO FUNCIONES Y TRIGGERS...');
        console.log('-'.repeat(50));

        const { data: funciones, error: funcionesError } = await supabase
            .from('information_schema.routines')
            .select('routine_name, routine_type, security_type')
            .eq('routine_schema', 'public');

        if (funcionesError) {
            console.log('❌ Error obteniendo funciones:', funcionesError.message);
        } else {
            console.log('📋 Funciones encontradas:');
            if (funciones.length === 0) {
                warnings.push('⚠️ No hay funciones personalizadas');
            } else {
                funciones.forEach(func => {
                    console.log(`   - ${func.routine_name} (${func.routine_type})`);
                });
            }
        }

        const { data: triggers, error: triggersError } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name, event_object_table, action_timing, event_manipulation')
            .eq('trigger_schema', 'public');

        if (triggersError) {
            console.log('❌ Error obteniendo triggers:', triggersError.message);
        } else {
            console.log('🔄 Triggers encontrados:');
            if (triggers.length === 0) {
                warnings.push('⚠️ No hay triggers configurados');
                soluciones.push('Configurar triggers para updated_at automático');
            } else {
                triggers.forEach(trigger => {
                    console.log(`   - ${trigger.trigger_name} en ${trigger.event_object_table}`);
                });
            }
        }

        console.log('');

        // 4. AUDITAR ÍNDICES
        console.log('📊 PASO 4: AUDITANDO ÍNDICES...');
        console.log('-'.repeat(50));

        const { data: indices, error: indicesError } = await supabase
            .from('pg_indexes')
            .select('tablename, indexname, indexdef')
            .eq('schemaname', 'public');

        if (indicesError) {
            console.log('❌ Error obteniendo índices:', indicesError.message);
        } else {
            console.log('🔍 Índices encontrados:');
            const tablasSinIndices = [];
            
            tablas?.forEach(tabla => {
                const tieneIndices = indices.some(i => i.tablename === tabla.table_name);
                if (!tieneIndices && tabla.table_name !== 'schema_migrations') {
                    tablasSinIndices.push(tabla.table_name);
                }
            });

            if (tablasSinIndices.length > 0) {
                warnings.push(`⚠️ Tablas sin índices: ${tablasSinIndices.join(', ')}`);
                soluciones.push('Crear índices para campos consultados frecuentemente');
            }

            indices.forEach(indice => {
                console.log(`   - ${indice.tablename}: ${indice.indexname}`);
            });
        }

        console.log('');

        // 5. AUDITAR STORAGE Y BUCKETS
        console.log('📁 PASO 5: AUDITANDO STORAGE...');
        console.log('-'.repeat(50));

        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.log('❌ Error obteniendo buckets:', bucketsError.message);
            warnings.push('No se puede acceder al storage');
        } else {
            console.log('🗂️ Buckets encontrados:');
            if (buckets.length === 0) {
                warnings.push('⚠️ No hay buckets de storage configurados');
                soluciones.push('Crear buckets para avatars, property-images, documents');
            } else {
                buckets.forEach(bucket => {
                    console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
                });

                // Verificar buckets esperados
                const bucketsEsperados = ['avatars', 'property-images', 'documents'];
                const bucketsExistentes = buckets.map(b => b.name);
                
                bucketsEsperados.forEach(bucketEsperado => {
                    if (!bucketsExistentes.includes(bucketEsperado)) {
                        warnings.push(`⚠️ Bucket faltante: ${bucketEsperado}`);
                        soluciones.push(`Crear bucket ${bucketEsperado}`);
                    }
                });
            }
        }

        console.log('');

        // 6. AUDITAR CONFIGURACIÓN DE AUTH
        console.log('🔐 PASO 6: AUDITANDO CONFIGURACIÓN DE AUTH...');
        console.log('-'.repeat(50));

        // Verificar usuarios de prueba
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.log('❌ Error obteniendo usuarios auth:', authError.message);
            warnings.push('No se puede acceder a usuarios de auth');
        } else {
            console.log(`👥 Usuarios registrados: ${authUsers.users.length}`);
            
            if (authUsers.users.length === 0) {
                warnings.push('⚠️ No hay usuarios registrados');
            }

            // Verificar usuarios sin confirmar
            const usuariosSinConfirmar = authUsers.users.filter(u => !u.email_confirmed_at);
            if (usuariosSinConfirmar.length > 0) {
                warnings.push(`⚠️ ${usuariosSinConfirmar.length} usuarios sin confirmar email`);
                soluciones.push('Configurar confirmación automática de email o SMTP');
            }
        }

        console.log('');

        // 7. VERIFICAR DATOS DE PRUEBA
        console.log('🧪 PASO 7: VERIFICANDO DATOS DE PRUEBA...');
        console.log('-'.repeat(50));

        const tablasConDatos = [];
        const tablasSinDatos = [];

        if (tablas) {
            for (const tabla of tablas) {
                if (tabla.table_name === 'schema_migrations') continue;
                
                try {
                    const { count, error } = await supabase
                        .from(tabla.table_name)
                        .select('*', { count: 'exact', head: true });

                    if (error) {
                        console.log(`   ❌ ${tabla.table_name}: Error - ${error.message}`);
                        warnings.push(`Error accediendo a tabla ${tabla.table_name}`);
                    } else {
                        console.log(`   📊 ${tabla.table_name}: ${count || 0} registros`);
                        if (count === 0) {
                            tablasSinDatos.push(tabla.table_name);
                        } else {
                            tablasConDatos.push(tabla.table_name);
                        }
                    }
                } catch (error) {
                    console.log(`   ❌ ${tabla.table_name}: Error - ${error.message}`);
                }
            }
        }

        if (tablasSinDatos.length > 0) {
            warnings.push(`⚠️ Tablas sin datos: ${tablasSinDatos.join(', ')}`);
            soluciones.push('Agregar datos de prueba para testing');
        }

        console.log('');

        // RESUMEN FINAL
        console.log('📊 RESUMEN DE AUDITORÍA');
        console.log('='.repeat(70));
        
        console.log(`✅ Tablas encontradas: ${tablas?.length || 0}`);
        console.log(`🛡️ Políticas RLS: ${politicas?.length || 0}`);
        console.log(`⚙️ Funciones: ${funciones?.length || 0}`);
        console.log(`🔄 Triggers: ${triggers?.length || 0}`);
        console.log(`📊 Índices: ${indices?.length || 0}`);
        console.log(`📁 Buckets: ${buckets?.length || 0}`);
        console.log(`👥 Usuarios auth: ${authUsers?.users?.length || 0}`);

        console.log('');
        console.log('🚨 WARNINGS ENCONTRADOS:');
        if (warnings.length === 0) {
            console.log('   ✅ No se encontraron warnings críticos');
        } else {
            warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }

        console.log('');
        console.log('🔧 SOLUCIONES RECOMENDADAS:');
        if (soluciones.length === 0) {
            console.log('   ✅ No se requieren acciones adicionales');
        } else {
            soluciones.forEach((solucion, index) => {
                console.log(`   ${index + 1}. ${solucion}`);
            });
        }

        // Guardar reporte
        const reporte = {
            timestamp: new Date().toISOString(),
            warnings: warnings,
            soluciones: soluciones,
            estadisticas: {
                tablas: tablas?.length || 0,
                politicas: politicas?.length || 0,
                funciones: funciones?.length || 0,
                triggers: triggers?.length || 0,
                indices: indices?.length || 0,
                buckets: buckets?.length || 0,
                usuarios: authUsers?.users?.length || 0
            }
        };

        require('fs').writeFileSync(
            'REPORTE-WARNINGS-SUPABASE-COMPLETO.json',
            JSON.stringify(reporte, null, 2)
        );

        console.log('');
        console.log('📄 Reporte guardado en: REPORTE-WARNINGS-SUPABASE-COMPLETO.json');
        console.log('✅ AUDITORÍA COMPLETADA');

        return { warnings, soluciones };

    } catch (error) {
        console.error('❌ Error general en auditoría:', error.message);
        return { warnings: ['Error general en auditoría'], soluciones: ['Revisar conexión y credenciales'] };
    }
}

auditarWarningsSupabase().catch(console.error);
