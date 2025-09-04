/**
 * BLACKBOX AI - TESTING EXHAUSTIVO DIAGNÓSTICO FINAL CREDENCIALES
 * Análisis completo del problema de credenciales Supabase
 * Fecha: 3 de Septiembre de 2025
 */

const fs = require('fs');
const path = require('path');

class DiagnosticoFinalCredenciales {
    constructor() {
        this.resultados = [];
        this.errores = [];
        this.advertencias = [];
        this.timestamp = new Date().toISOString();
        
        console.log('🔍 INICIANDO DIAGNÓSTICO FINAL DE CREDENCIALES SUPABASE...');
        console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
        console.log('🎯 Objetivo: Identificar la causa raíz del problema de credenciales');
        console.log('============================================================\n');
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = { message, type, timestamp };
        
        this.resultados.push(logEntry);
        
        const emoji = {
            'INFO': '📋',
            'SUCCESS': '✅',
            'WARNING': '⚠️',
            'ERROR': '❌',
            'CRITICAL': '🚨'
        }[type] || '📋';
        
        console.log(`[${timestamp}] ${emoji} ${message}`);
        
        if (type === 'ERROR' || type === 'CRITICAL') {
            this.errores.push(logEntry);
        } else if (type === 'WARNING') {
            this.advertencias.push(logEntry);
        }
    }

    async analizarResultadosAnteriores() {
        this.log('🔍 FASE 1: ANALIZANDO RESULTADOS DE TESTING ANTERIOR', 'INFO');
        
        try {
            // Leer el reporte anterior
            const reportePath = path.join(__dirname, '115-Reporte-Configuracion-Supabase-Corregida-Final.json');
            
            if (fs.existsSync(reportePath)) {
                const reporteAnterior = JSON.parse(fs.readFileSync(reportePath, 'utf8'));
                
                this.log(`📊 Reporte anterior encontrado`, 'SUCCESS');
                this.log(`📈 Tasa de éxito anterior: ${reporteAnterior.summary.successRate}%`, 'INFO');
                this.log(`❌ Errores detectados: ${reporteAnterior.summary.errors}`, 'INFO');
                this.log(`⚠️ Advertencias: ${reporteAnterior.summary.warnings}`, 'INFO');
                
                // Analizar errores específicos
                const erroresCredenciales = reporteAnterior.errors.filter(error => 
                    error.message.includes('Invalid API key') || 
                    error.message.includes('signature verification failed')
                );
                
                this.log(`🔑 Errores de credenciales: ${erroresCredenciales.length}`, 'CRITICAL');
                
                erroresCredenciales.forEach(error => {
                    this.log(`   - ${error.message}`, 'ERROR');
                });
                
                return reporteAnterior;
            } else {
                this.log('❌ No se encontró reporte anterior', 'ERROR');
                return null;
            }
        } catch (error) {
            this.log(`❌ Error leyendo reporte anterior: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async verificarArchivosCredenciales() {
        this.log('🔍 FASE 2: VERIFICANDO ARCHIVOS DE CREDENCIALES', 'INFO');
        
        const archivosCredenciales = [
            'Backend/.env',
            'Backend/.env.local',
            'Backend/.env.example',
            '.env',
            '.env.local'
        ];
        
        let credencialesEncontradas = 0;
        
        for (const archivo of archivosCredenciales) {
            try {
                if (fs.existsSync(archivo)) {
                    this.log(`✅ Archivo encontrado: ${archivo}`, 'SUCCESS');
                    credencialesEncontradas++;
                    
                    // Leer contenido (sin mostrar credenciales reales)
                    const contenido = fs.readFileSync(archivo, 'utf8');
                    const lineas = contenido.split('\n');
                    
                    const variablesSupabase = lineas.filter(linea => 
                        linea.includes('SUPABASE') || 
                        linea.includes('NEXT_PUBLIC_SUPABASE')
                    );
                    
                    this.log(`   📋 Variables Supabase encontradas: ${variablesSupabase.length}`, 'INFO');
                    
                    variablesSupabase.forEach(variable => {
                        const [key] = variable.split('=');
                        if (key) {
                            this.log(`   - ${key.trim()}`, 'INFO');
                        }
                    });
                } else {
                    this.log(`❌ Archivo no encontrado: ${archivo}`, 'WARNING');
                }
            } catch (error) {
                this.log(`❌ Error leyendo ${archivo}: ${error.message}`, 'ERROR');
            }
        }
        
        this.log(`📊 Total archivos de credenciales encontrados: ${credencialesEncontradas}`, 'INFO');
        
        if (credencialesEncontradas === 0) {
            this.log('🚨 PROBLEMA CRÍTICO: No se encontraron archivos de credenciales', 'CRITICAL');
        }
    }

    async analizarScriptsAnteriores() {
        this.log('🔍 FASE 3: ANALIZANDO SCRIPTS DE CONFIGURACIÓN ANTERIORES', 'INFO');
        
        const scriptsAnteriores = [
            '112-Script-Configuracion-Automatica-Supabase-Completa.js',
            '115-Script-Configuracion-Supabase-Credenciales-Corregidas.js'
        ];
        
        for (const script of scriptsAnteriores) {
            try {
                const scriptPath = path.join(__dirname, script);
                
                if (fs.existsSync(scriptPath)) {
                    this.log(`✅ Script encontrado: ${script}`, 'SUCCESS');
                    
                    const contenido = fs.readFileSync(scriptPath, 'utf8');
                    
                    // Buscar configuración de credenciales
                    const tieneCredenciales = contenido.includes('SUPABASE_URL') && 
                                            contenido.includes('SUPABASE_ANON_KEY');
                    
                    this.log(`   🔑 Configuración de credenciales: ${tieneCredenciales ? 'SÍ' : 'NO'}`, 
                            tieneCredenciales ? 'SUCCESS' : 'ERROR');
                    
                    // Buscar manejo de errores
                    const tieneManejadorErrores = contenido.includes('catch') || 
                                                contenido.includes('error');
                    
                    this.log(`   🛡️ Manejo de errores: ${tieneManejadorErrores ? 'SÍ' : 'NO'}`, 
                            tieneManejadorErrores ? 'SUCCESS' : 'WARNING');
                    
                } else {
                    this.log(`❌ Script no encontrado: ${script}`, 'WARNING');
                }
            } catch (error) {
                this.log(`❌ Error analizando ${script}: ${error.message}`, 'ERROR');
            }
        }
    }

    async identificarCausaRaiz() {
        this.log('🔍 FASE 4: IDENTIFICANDO CAUSA RAÍZ DEL PROBLEMA', 'INFO');
        
        const problemasIdentificados = [];
        
        // Problema 1: Credenciales inválidas
        if (this.errores.some(error => error.message.includes('Invalid API key'))) {
            problemasIdentificados.push({
                tipo: 'CRÍTICO',
                problema: 'Credenciales API inválidas',
                descripcion: 'Las API keys de Supabase no son válidas o están mal configuradas',
                solucion: 'Obtener nuevas credenciales desde el dashboard de Supabase'
            });
        }
        
        // Problema 2: Verificación de firma fallida
        if (this.errores.some(error => error.message.includes('signature verification failed'))) {
            problemasIdentificados.push({
                tipo: 'CRÍTICO',
                problema: 'Fallo en verificación de firma',
                descripcion: 'Las credenciales no coinciden con el proyecto de Supabase',
                solucion: 'Verificar que las credenciales correspondan al proyecto correcto'
            });
        }
        
        // Problema 3: Configuración de entorno
        problemasIdentificados.push({
            tipo: 'ALTO',
            problema: 'Configuración de variables de entorno',
            descripcion: 'Las variables de entorno pueden no estar cargándose correctamente',
            solucion: 'Verificar la carga de variables de entorno en el script'
        });
        
        this.log(`🚨 PROBLEMAS IDENTIFICADOS: ${problemasIdentificados.length}`, 'CRITICAL');
        
        problemasIdentificados.forEach((problema, index) => {
            this.log(`${index + 1}. [${problema.tipo}] ${problema.problema}`, 'ERROR');
            this.log(`   📝 ${problema.descripcion}`, 'INFO');
            this.log(`   💡 Solución: ${problema.solucion}`, 'INFO');
        });
        
        return problemasIdentificados;
    }

    async generarPlanSolucion(problemas) {
        this.log('🔍 FASE 5: GENERANDO PLAN DE SOLUCIÓN DEFINITIVA', 'INFO');
        
        const planSolucion = {
            objetivo: 'Alcanzar 100% de éxito en configuración Supabase',
            estrategia: 'Enfoque paso a paso con verificación en cada etapa',
            pasos: [
                {
                    paso: 1,
                    titulo: 'Verificación manual de credenciales',
                    descripcion: 'Acceder al dashboard de Supabase y obtener credenciales frescas',
                    prioridad: 'CRÍTICA'
                },
                {
                    paso: 2,
                    titulo: 'Configuración de variables de entorno',
                    descripcion: 'Crear archivo .env con credenciales verificadas',
                    prioridad: 'CRÍTICA'
                },
                {
                    paso: 3,
                    titulo: 'Script de testing básico',
                    descripcion: 'Crear script simple para verificar conexión',
                    prioridad: 'ALTA'
                },
                {
                    paso: 4,
                    titulo: 'Configuración incremental',
                    descripcion: 'Configurar Supabase paso a paso con validación',
                    prioridad: 'ALTA'
                },
                {
                    paso: 5,
                    titulo: 'Testing exhaustivo final',
                    descripcion: 'Ejecutar testing completo para confirmar 100% éxito',
                    prioridad: 'MEDIA'
                }
            ]
        };
        
        this.log('📋 PLAN DE SOLUCIÓN GENERADO:', 'SUCCESS');
        planSolucion.pasos.forEach(paso => {
            this.log(`   ${paso.paso}. [${paso.prioridad}] ${paso.titulo}`, 'INFO');
            this.log(`      ${paso.descripcion}`, 'INFO');
        });
        
        return planSolucion;
    }

    async ejecutarDiagnostico() {
        try {
            // Ejecutar todas las fases
            const reporteAnterior = await this.analizarResultadosAnteriores();
            await this.verificarArchivosCredenciales();
            await this.analizarScriptsAnteriores();
            const problemas = await this.identificarCausaRaiz();
            const planSolucion = await this.generarPlanSolucion(problemas);
            
            // Generar resumen final
            const resumen = {
                timestamp: this.timestamp,
                status: 'COMPLETADO',
                approach: 'Diagnóstico exhaustivo de credenciales',
                fases: [
                    'Análisis de resultados anteriores',
                    'Verificación de archivos de credenciales',
                    'Análisis de scripts anteriores',
                    'Identificación de causa raíz',
                    'Generación de plan de solución'
                ],
                resultados: this.resultados,
                errores: this.errores,
                advertencias: this.advertencias,
                problemas: problemas,
                planSolucion: planSolucion,
                summary: {
                    totalOperaciones: this.resultados.length,
                    errores: this.errores.length,
                    advertencias: this.advertencias.length,
                    problemasIdentificados: problemas.length,
                    confianzaSolucion: problemas.length > 0 ? 'ALTA' : 'MEDIA'
                }
            };
            
            // Guardar reporte
            const reportePath = path.join(__dirname, '118-Reporte-Diagnostico-Final-Credenciales.json');
            fs.writeFileSync(reportePath, JSON.stringify(resumen, null, 2));
            
            this.log(`📊 Reporte guardado en: ${reportePath}`, 'SUCCESS');
            
            // Mostrar resumen final
            console.log('\n============================================================');
            console.log('📊 RESUMEN DE DIAGNÓSTICO FINAL:');
            console.log(`✅ Operaciones completadas: ${resumen.summary.totalOperaciones}`);
            console.log(`❌ Errores detectados: ${resumen.summary.errores}`);
            console.log(`⚠️  Advertencias: ${resumen.summary.advertencias}`);
            console.log(`🚨 Problemas identificados: ${resumen.summary.problemasIdentificados}`);
            console.log(`🎯 Confianza en solución: ${resumen.summary.confianzaSolucion}`);
            console.log('============================================================');
            
            if (problemas.length > 0) {
                console.log('\n🚨 ACCIÓN REQUERIDA:');
                console.log('1. Revisar el plan de solución generado');
                console.log('2. Obtener credenciales frescas de Supabase');
                console.log('3. Ejecutar script de solución definitiva');
            } else {
                console.log('\n✅ No se detectaron problemas críticos adicionales.');
            }
            
            return resumen;
            
        } catch (error) {
            this.log(`❌ Error en diagnóstico: ${error.message}`, 'CRITICAL');
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
}

// Ejecutar diagnóstico
async function main() {
    const diagnostico = new DiagnosticoFinalCredenciales();
    
    try {
        await diagnostico.ejecutarDiagnostico();
        process.exit(0);
    } catch (error) {
        console.error('❌ Diagnóstico falló:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = DiagnosticoFinalCredenciales;
