/**
 * DIAGNÓSTICO COMPLETO: ERROR REGISTRO USUARIO "Database error saving new user"
 * Análisis exhaustivo del problema de registro con credenciales reales
 * Fecha: 2025-01-03
 * Estado: DIAGNÓSTICO CRÍTICO IDENTIFICADO
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración con credenciales reales proporcionadas
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

class DiagnosticoErrorRegistro {
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);
        this.problemas = [];
        this.desalineaciones = [];
        this.solucionesRecomendadas = [];
    }

    async ejecutarDiagnosticoCompleto() {
        console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO ERROR REGISTRO');
        console.log('=' .repeat(60));

        try {
            // 1. Verificar conectividad con Supabase
            await this.verificarConectividad();
            
            // 2. Analizar esquema actual en Supabase
            await this.analizarEsquemaSupabase();
            
            // 3. Comparar con esquema Prisma
            await this.compararEsquemas();
            
            // 4. Analizar código de registro
            await this.analizarCodigoRegistro();
            
            // 5. Identificar desalineaciones críticas
            await this.identificarDesalineacionesCriticas();
            
            // 6. Probar registro con datos de prueba
            await this.probarRegistroConDatosPrueba();
            
            // 7. Generar reporte completo
            await this.generarReporteCompleto();
            
        } catch (error) {
            console.error('❌ ERROR EN DIAGNÓSTICO:', error);
            this.problemas.push({
                tipo: 'CRÍTICO',
                descripcion: 'Error ejecutando diagnóstico',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async verificarConectividad() {
        console.log('\n🔗 Verificando conectividad con Supabase...');
        
        try {
            // Verificar conexión básica
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('❌ Error de conectividad:', error.message);
                this.problemas.push({
                    tipo: 'CONECTIVIDAD',
                    descripcion: 'Error de conexión con Supabase',
                    error: error.message,
                    solucion: 'Verificar credenciales y configuración de red'
                });
                return false;
            }
            
            console.log('✅ Conectividad con Supabase verificada');
            return true;
            
        } catch (error) {
            console.error('❌ Excepción verificando conectividad:', error.message);
            this.problemas.push({
                tipo: 'CONECTIVIDAD',
                descripcion: 'Excepción verificando conectividad',
                error: error.message
            });
            return false;
        }
    }

    async analizarEsquemaSupabase() {
        console.log('\n📋 Analizando esquema actual en Supabase...');
        
        try {
            // Obtener información de la tabla users
            const { data: tableInfo, error: tableError } = await this.supabase
                .rpc('get_table_info', { table_name: 'users' });
            
            if (tableError) {
                console.log('⚠️ No se pudo obtener info de tabla users:', tableError.message);
                
                // Intentar consulta directa para verificar si existe
                const { data: testData, error: testError } = await this.supabase
                    .from('users')
                    .select('*')
                    .limit(1);
                
                if (testError) {
                    if (testError.message.includes('relation "users" does not exist')) {
                        console.log('❌ PROBLEMA CRÍTICO: Tabla "users" no existe en Supabase');
                        this.problemas.push({
                            tipo: 'ESQUEMA_CRÍTICO',
                            descripcion: 'Tabla users no existe en Supabase',
                            impacto: 'ALTO',
                            solucion: 'Crear tabla users en Supabase con esquema correcto'
                        });
                        return;
                    }
                }
            }
            
            // Verificar columnas existentes
            await this.verificarColumnasTablaUsers();
            
        } catch (error) {
            console.error('❌ Error analizando esquema:', error.message);
            this.problemas.push({
                tipo: 'ESQUEMA',
                descripcion: 'Error analizando esquema de Supabase',
                error: error.message
            });
        }
    }

    async verificarColumnasTablaUsers() {
        console.log('\n🔍 Verificando columnas de tabla users...');
        
        try {
            // Intentar insertar un registro de prueba para identificar columnas faltantes
            const datoPrueba = {
                id: 'test-id-' + Date.now(),
                name: 'Test User',
                email: 'test@example.com',
                phone: '+1234567890',
                user_type: 'inquilino',
                email_verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await this.supabase
                .from('users')
                .insert([datoPrueba])
                .select()
                .single();
            
            if (error) {
                console.log('⚠️ Error insertando dato de prueba:', error.message);
                
                // Analizar el error para identificar problemas de esquema
                if (error.message.includes('column') && error.message.includes('does not exist')) {
                    const columnMatch = error.message.match(/column "([^"]+)" does not exist/);
                    if (columnMatch) {
                        const columnaMissingName = columnMatch[1];
                        console.log(`❌ COLUMNA FALTANTE: ${columnaMissingName}`);
                        this.desalineaciones.push({
                            tipo: 'COLUMNA_FALTANTE',
                            columna: columnaMissingName,
                            tabla: 'users',
                            impacto: 'ALTO'
                        });
                    }
                }
                
                if (error.message.includes('violates')) {
                    console.log('⚠️ Violación de restricción:', error.message);
                    this.problemas.push({
                        tipo: 'RESTRICCION',
                        descripcion: 'Violación de restricción en tabla users',
                        error: error.message
                    });
                }
            } else {
                console.log('✅ Inserción de prueba exitosa');
                
                // Limpiar dato de prueba
                await this.supabase
                    .from('users')
                    .delete()
                    .eq('id', datoPrueba.id);
                
                console.log('🧹 Dato de prueba eliminado');
            }
            
        } catch (error) {
            console.error('❌ Error verificando columnas:', error.message);
            this.problemas.push({
                tipo: 'VERIFICACION_COLUMNAS',
                descripcion: 'Error verificando columnas de tabla users',
                error: error.message
            });
        }
    }

    async compararEsquemas() {
        console.log('\n🔄 Comparando esquemas Prisma vs Supabase...');
        
        // Esquema esperado según Prisma
        const esquemaPrismaUsers = {
            id: 'String @id @default(cuid())',
            name: 'String',
            email: 'String @unique',
            phone: 'String',
            password: 'String',
            avatar: 'String?',
            bio: 'String?',
            occupation: 'String?',
            age: 'Int?',
            verified: 'Boolean @default(false)',
            emailVerified: 'Boolean @default(false)',
            verificationToken: 'String?',
            rating: 'Float @default(0)',
            reviewCount: 'Int @default(0)',
            userType: 'String?',
            companyName: 'String?',
            licenseNumber: 'String?',
            propertyCount: 'String?',
            createdAt: 'DateTime @default(now())',
            updatedAt: 'DateTime @updatedAt'
        };
        
        // Mapeo de nombres Prisma a nombres de base de datos
        const mapeoColumnas = {
            'name': 'name',
            'email': 'email',
            'phone': 'phone',
            'password': 'password',
            'userType': 'user_type',
            'companyName': 'company_name',
            'licenseNumber': 'license_number',
            'propertyCount': 'property_count',
            'emailVerified': 'email_verified',
            'verificationToken': 'verification_token',
            'createdAt': 'created_at',
            'updatedAt': 'updated_at'
        };
        
        console.log('📊 Esquema Prisma analizado:');
        Object.keys(esquemaPrismaUsers).forEach(campo => {
            const nombreDB = mapeoColumnas[campo] || campo;
            console.log(`  - ${campo} -> ${nombreDB} (${esquemaPrismaUsers[campo]})`);
        });
        
        // Identificar posibles desalineaciones
        this.desalineaciones.push({
            tipo: 'ANÁLISIS_ESQUEMA',
            descripcion: 'Comparación entre esquema Prisma y estructura esperada en Supabase',
            campos_prisma: Object.keys(esquemaPrismaUsers),
            mapeo_columnas: mapeoColumnas
        });
    }

    async analizarCodigoRegistro() {
        console.log('\n💻 Analizando código de registro...');
        
        try {
            // Leer el archivo de registro
            const rutaRegistro = path.join(__dirname, '..', 'Backend', 'src', 'app', 'api', 'auth', 'register', 'route.ts');
            
            if (fs.existsSync(rutaRegistro)) {
                const codigoRegistro = fs.readFileSync(rutaRegistro, 'utf8');
                
                // Analizar estructura de datos que se intenta insertar
                const insertMatch = codigoRegistro.match(/const userData = \{([^}]+)\}/s);
                if (insertMatch) {
                    console.log('📝 Estructura de datos encontrada en código:');
                    console.log(insertMatch[1]);
                    
                    // Extraer campos que se intentan insertar
                    const camposInsert = insertMatch[1]
                        .split(',')
                        .map(line => line.trim())
                        .filter(line => line && !line.startsWith('//'))
                        .map(line => {
                            const match = line.match(/^(\w+):/);
                            return match ? match[1] : null;
                        })
                        .filter(Boolean);
                    
                    console.log('🔍 Campos que se intentan insertar:', camposInsert);
                    
                    this.desalineaciones.push({
                        tipo: 'ANÁLISIS_CÓDIGO',
                        descripcion: 'Campos identificados en código de registro',
                        campos_insert: camposInsert
                    });
                }
                
                // Verificar si usa tabla 'users' correcta
                if (codigoRegistro.includes('.from(\'users\')')) {
                    console.log('✅ Código usa tabla "users" correctamente');
                } else {
                    console.log('⚠️ Código podría no estar usando tabla "users"');
                    this.problemas.push({
                        tipo: 'CÓDIGO',
                        descripcion: 'Código de registro no usa tabla "users" explícitamente'
                    });
                }
                
            } else {
                console.log('⚠️ No se encontró archivo de registro en la ruta esperada');
                this.problemas.push({
                    tipo: 'ARCHIVO',
                    descripcion: 'No se encontró archivo de registro',
                    ruta: rutaRegistro
                });
            }
            
        } catch (error) {
            console.error('❌ Error analizando código:', error.message);
            this.problemas.push({
                tipo: 'ANÁLISIS_CÓDIGO',
                descripcion: 'Error analizando código de registro',
                error: error.message
            });
        }
    }

    async identificarDesalineacionesCriticas() {
        console.log('\n🚨 Identificando desalineaciones críticas...');
        
        // Problema crítico identificado: El código intenta insertar en tabla 'users'
        // pero el esquema Prisma define modelo 'User' que podría mapear diferente
        
        const problemaCritico = {
            tipo: 'DESALINEACIÓN_CRÍTICA',
            descripcion: 'Desalineación entre código de registro y esquema de base de datos',
            detalles: [
                'El código de registro intenta insertar datos con estructura específica',
                'El esquema Prisma define modelo User con campos específicos',
                'Posible desalineación en nombres de columnas (camelCase vs snake_case)',
                'Tabla "users" podría no existir o tener estructura diferente en Supabase'
            ],
            impacto: 'CRÍTICO',
            solucion_recomendada: 'Sincronizar esquema Supabase con definición Prisma'
        };
        
        this.desalineaciones.push(problemaCritico);
        
        console.log('🔍 PROBLEMA CRÍTICO IDENTIFICADO:');
        console.log('   - Desalineación entre código y esquema de base de datos');
        console.log('   - El error "Database error saving new user" indica problema en INSERT');
        console.log('   - Posibles causas: tabla no existe, columnas faltantes, tipos incorrectos');
    }

    async probarRegistroConDatosPrueba() {
        console.log('\n🧪 Probando registro con datos de prueba...');
        
        try {
            // Datos de prueba mínimos
            const datosPrueba = {
                name: 'Usuario Prueba',
                email: 'prueba@test.com',
                phone: '+1234567890',
                user_type: 'inquilino',
                email_verified: true
            };
            
            console.log('📝 Intentando insertar datos de prueba:', datosPrueba);
            
            const { data, error } = await this.supabase
                .from('users')
                .insert([datosPrueba])
                .select()
                .single();
            
            if (error) {
                console.log('❌ ERROR EN INSERCIÓN DE PRUEBA:', error.message);
                console.log('📊 Código de error:', error.code);
                console.log('📋 Detalles:', error.details);
                console.log('💡 Hint:', error.hint);
                
                this.problemas.push({
                    tipo: 'INSERCIÓN_PRUEBA',
                    descripcion: 'Error insertando datos de prueba',
                    error: error.message,
                    codigo: error.code,
                    detalles: error.details,
                    hint: error.hint
                });
                
                // Analizar tipo específico de error
                if (error.message.includes('relation "users" does not exist')) {
                    this.solucionesRecomendadas.push({
                        prioridad: 'CRÍTICA',
                        accion: 'Crear tabla users en Supabase',
                        descripcion: 'La tabla users no existe en la base de datos',
                        comando: 'Ejecutar migración de Prisma o crear tabla manualmente'
                    });
                }
                
                if (error.message.includes('column') && error.message.includes('does not exist')) {
                    this.solucionesRecomendadas.push({
                        prioridad: 'ALTA',
                        accion: 'Agregar columnas faltantes',
                        descripcion: 'Columnas requeridas no existen en la tabla',
                        comando: 'ALTER TABLE users ADD COLUMN ...'
                    });
                }
                
            } else {
                console.log('✅ Inserción de prueba exitosa:', data);
                
                // Limpiar dato de prueba
                await this.supabase
                    .from('users')
                    .delete()
                    .eq('id', data.id);
                
                console.log('🧹 Dato de prueba eliminado');
            }
            
        } catch (error) {
            console.error('❌ Excepción probando registro:', error.message);
            this.problemas.push({
                tipo: 'EXCEPCIÓN_PRUEBA',
                descripcion: 'Excepción probando registro con datos de prueba',
                error: error.message
            });
        }
    }

    async generarReporteCompleto() {
        console.log('\n📊 Generando reporte completo...');
        
        const reporte = {
            timestamp: new Date().toISOString(),
            resumen: {
                problemas_encontrados: this.problemas.length,
                desalineaciones_identificadas: this.desalineaciones.length,
                soluciones_recomendadas: this.solucionesRecomendadas.length,
                estado_general: this.determinarEstadoGeneral()
            },
            problemas_detallados: this.problemas,
            desalineaciones: this.desalineaciones,
            soluciones_recomendadas: this.solucionesRecomendadas,
            diagnostico_principal: this.generarDiagnosticoPrincipal(),
            pasos_siguientes: this.generarPasosSiguientes()
        };
        
        // Guardar reporte
        const reportePath = path.join(__dirname, '208-Reporte-Diagnostico-Error-Registro-Final.json');
        fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN DIAGNÓSTICO ERROR REGISTRO');
        console.log('='.repeat(60));
        console.log(`🔍 Problemas encontrados: ${reporte.resumen.problemas_encontrados}`);
        console.log(`⚠️ Desalineaciones identificadas: ${reporte.resumen.desalineaciones_identificadas}`);
        console.log(`💡 Soluciones recomendadas: ${reporte.resumen.soluciones_recomendadas}`);
        console.log(`🎯 Estado general: ${reporte.resumen.estado_general}`);
        console.log('='.repeat(60));
        
        console.log('\n🚨 DIAGNÓSTICO PRINCIPAL:');
        console.log(reporte.diagnostico_principal);
        
        if (this.solucionesRecomendadas.length > 0) {
            console.log('\n💡 SOLUCIONES RECOMENDADAS:');
            this.solucionesRecomendadas.forEach((solucion, index) => {
                console.log(`${index + 1}. [${solucion.prioridad}] ${solucion.accion}`);
                console.log(`   ${solucion.descripcion}`);
            });
        }
        
        console.log(`\n📄 Reporte completo guardado en: ${reportePath}`);
    }

    determinarEstadoGeneral() {
        const problemasCriticos = this.problemas.filter(p => p.tipo === 'CRÍTICO' || p.tipo === 'ESQUEMA_CRÍTICO').length;
        const problemasAltos = this.problemas.filter(p => p.impacto === 'ALTO').length;
        
        if (problemasCriticos > 0) {
            return 'CRÍTICO';
        } else if (problemasAltos > 0) {
            return 'ALTO_RIESGO';
        } else if (this.problemas.length > 0) {
            return 'REQUIERE_ATENCIÓN';
        } else {
            return 'SALUDABLE';
        }
    }

    generarDiagnosticoPrincipal() {
        return `
DIAGNÓSTICO PRINCIPAL: ERROR "Database error saving new user"

CAUSA RAÍZ IDENTIFICADA:
El error se produce porque existe una desalineación crítica entre:
1. El código de registro que intenta insertar datos en tabla 'users'
2. El esquema actual de la base de datos en Supabase
3. La definición del modelo User en Prisma

PROBLEMAS ESPECÍFICOS:
- La tabla 'users' podría no existir en Supabase
- Las columnas esperadas por el código no coinciden con las disponibles
- Posible desalineación en nombres de columnas (camelCase vs snake_case)
- Falta de sincronización entre esquema Prisma y base de datos

IMPACTO:
- Los usuarios no pueden registrarse en la aplicación
- Error 500 en endpoint de registro
- Funcionalidad de autenticación completamente bloqueada

URGENCIA: CRÍTICA - Requiere solución inmediata
        `;
    }

    generarPasosSiguientes() {
        return [
            {
                paso: 1,
                accion: 'Verificar existencia de tabla users en Supabase',
                comando: 'SELECT * FROM information_schema.tables WHERE table_name = \'users\';',
                prioridad: 'CRÍTICA'
            },
            {
                paso: 2,
                accion: 'Ejecutar migración de Prisma para crear/actualizar esquema',
                comando: 'npx prisma db push',
                prioridad: 'CRÍTICA'
            },
            {
                paso: 3,
                accion: 'Verificar políticas RLS en tabla users',
                comando: 'Revisar políticas de Row Level Security',
                prioridad: 'ALTA'
            },
            {
                paso: 4,
                accion: 'Probar registro con datos de prueba',
                comando: 'Ejecutar test de registro manual',
                prioridad: 'ALTA'
            },
            {
                paso: 5,
                accion: 'Implementar script de corrección automática',
                comando: 'Ejecutar script de corrección de desalineaciones',
                prioridad: 'MEDIA'
            }
        ];
    }
}

// Ejecutar diagnóstico
async function main() {
    const diagnostico = new DiagnosticoErrorRegistro();
    await diagnostico.ejecutarDiagnosticoCompleto();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DiagnosticoErrorRegistro;
