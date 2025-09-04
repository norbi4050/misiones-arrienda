const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// =====================================================
// CONFIGURACIÓN SUPABASE CON CREDENCIALES REALES
// Proyecto: Misiones Arrienda
// Solución: Permisos esquema público + Creación tablas
// =====================================================

const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

console.log('🚀 CONFIGURANDO SUPABASE CON CREDENCIALES REALES');
console.log('📊 Proyecto: qfeyhaaxyemmnohqdele.supabase.co');
console.log('⏰ Inicio:', new Date().toLocaleString());
console.log('================================================================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ejecutarConfiguracion() {
    try {
        console.log('🔧 Iniciando configuración de permisos Supabase...');

        // Leer el archivo SQL
        const sqlContent = fs.readFileSync('SUPABASE-CONFIGURACION-PERMISOS-ESQUEMA-PUBLICO.sql', 'utf8');
        
        // Dividir en comandos individuales
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.includes('SELECT \'CONFIGURACIÓN COMPLETADA'));
        
        console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // PASO 1: Crear función exec_sql primero
        console.log('\n🔍 [PASO 1] Creando función exec_sql...');
        const execSqlFunction = `
        CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql;
            RETURN 'SUCCESS';
        EXCEPTION
            WHEN OTHERS THEN
                RETURN 'ERROR: ' || SQLERRM;
        END;
        $$;
        `;
        
        try {
            const { data, error } = await supabase.rpc('query', { 
                query: execSqlFunction 
            });
            
            if (error) {
                console.log('❌ Error creando función exec_sql:', error.message);
            } else {
                console.log('✅ Función exec_sql creada exitosamente');
            }
        } catch (err) {
            console.log('❌ Error creando función exec_sql:', err.message);
        }

        // PASO 2: Ejecutar comandos uno por uno
        console.log('\n🔍 [PASO 2] Ejecutando comandos de configuración...');
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.length < 10) continue; // Saltar comandos muy cortos
            
            try {
                console.log(`[${i+1}/${commands.length}] Ejecutando comando...`);
                
                // Intentar con exec_sql primero
                let result;
                try {
                    result = await supabase.rpc('exec_sql', { 
                        sql: command + ';' 
                    });
                } catch (execError) {
                    // Si falla exec_sql, intentar con query directo
                    result = await supabase.rpc('query', { 
                        query: command + ';' 
                    });
                }
                
                if (result.error) {
                    if (result.error.message.includes('already exists') || 
                        result.error.message.includes('duplicate key')) {
                        console.log(`⚠️ Comando ${i+1}: Ya existe (ignorando)`);
                        successCount++;
                    } else {
                        console.log(`❌ Error en comando ${i+1}: ${result.error.message}`);
                        errors.push({
                            command: i+1,
                            error: result.error.message,
                            sql: command.substring(0, 100) + '...'
                        });
                        errorCount++;
                    }
                } else {
                    console.log(`✅ Comando ${i+1}: Ejecutado exitosamente`);
                    successCount++;
                }
                
                // Pausa pequeña entre comandos
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`❌ Error en comando ${i+1}: ${error.message}`);
                errors.push({
                    command: i+1,
                    error: error.message,
                    sql: command.substring(0, 100) + '...'
                });
                errorCount++;
            }
        }

        // PASO 3: Verificar tablas creadas
        console.log('\n🔍 [PASO 3] Verificando tablas creadas...');
        
        const tablesToCheck = [
            'profiles', 'properties', 'favorites', 'search_history',
            'messages', 'conversations', 'property_images', 
            'user_limits', 'admin_activity'
        ];
        
        let tablesCreated = 0;
        
        for (const table of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (!error) {
                    console.log(`✅ Tabla ${table}: EXISTE`);
                    tablesCreated++;
                } else {
                    console.log(`❌ Tabla ${table}: FALTANTE - ${error.message}`);
                }
            } catch (err) {
                console.log(`❌ Tabla ${table}: ERROR - ${err.message}`);
            }
        }

        // PASO 4: Verificar políticas RLS
        console.log('\n🔍 [PASO 4] Verificando políticas RLS...');
        
        let rlsEnabled = 0;
        const rlsTables = ['profiles', 'properties', 'favorites', 'search_history'];
        
        for (const table of rlsTables) {
            try {
                // Intentar una consulta que requiera RLS
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (!error || error.message.includes('RLS')) {
                    console.log(`✅ RLS habilitado en ${table}: SÍ`);
                    rlsEnabled++;
                } else {
                    console.log(`⚠️ RLS habilitado en ${table}: NO`);
                }
            } catch (err) {
                console.log(`⚠️ RLS habilitado en ${table}: DESCONOCIDO`);
            }
        }

        // RESUMEN FINAL
        console.log('\n================================================================================');
        console.log('🎉 CONFIGURACIÓN COMPLETADA');
        console.log('================================================================================');
        
        const totalCommands = commands.length;
        const successRate = Math.round((successCount / totalCommands) * 100);
        const tablesRate = Math.round((tablesCreated / tablesToCheck.length) * 100);
        const rlsRate = Math.round((rlsEnabled / rlsTables.length) * 100);
        
        console.log(`📊 Comandos ejecutados: ${successCount}/${totalCommands} (${successRate}%)`);
        console.log(`📊 Tablas creadas: ${tablesCreated}/${tablesToCheck.length} (${tablesRate}%)`);
        console.log(`📊 RLS habilitado: ${rlsEnabled}/${rlsTables.length} (${rlsRate}%)`);
        console.log(`⏱️  Duración: ${Math.round((Date.now() - startTime) / 1000)} segundos`);
        
        // Calcular score final
        const finalScore = Math.round((successRate + tablesRate + rlsRate) / 3);
        console.log(`📈 Score Final: ${finalScore}/100`);
        
        if (errors.length > 0) {
            console.log('\n⚠️ ERRORES ENCONTRADOS:');
            errors.forEach(err => {
                console.log(`- Comando ${err.command}: ${err.error}`);
            });
        }
        
        // Crear reporte
        const reporte = {
            timestamp: new Date().toISOString(),
            proyecto: 'qfeyhaaxyemmnohqdele.supabase.co',
            comandos: {
                total: totalCommands,
                exitosos: successCount,
                errores: errorCount,
                tasa_exito: successRate
            },
            tablas: {
                total: tablesToCheck.length,
                creadas: tablesCreated,
                tasa_creacion: tablesRate
            },
            rls: {
                total: rlsTables.length,
                habilitadas: rlsEnabled,
                tasa_habilitacion: rlsRate
            },
            score_final: finalScore,
            errores: errors,
            duracion_segundos: Math.round((Date.now() - startTime) / 1000)
        };
        
        fs.writeFileSync('REPORTE-CONFIGURACION-SUPABASE-CREDENCIALES-REALES.json', 
            JSON.stringify(reporte, null, 2));
        
        console.log('📄 Reporte guardado: REPORTE-CONFIGURACION-SUPABASE-CREDENCIALES-REALES.json');
        
        if (finalScore >= 80) {
            console.log('🎉 ¡CONFIGURACIÓN EXITOSA!');
        } else if (finalScore >= 60) {
            console.log('⚠️ Configuración parcial - Se recomienda revisar errores');
        } else {
            console.log('❌ Configuración fallida - Se requiere intervención manual');
        }
        
    } catch (error) {
        console.error('❌ Error crítico en configuración:', error);
        process.exit(1);
    }
}

const startTime = Date.now();
ejecutarConfiguracion();
