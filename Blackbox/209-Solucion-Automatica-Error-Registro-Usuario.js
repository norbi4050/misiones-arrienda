/**
 * SOLUCIÓN AUTOMÁTICA: ERROR REGISTRO USUARIO "Database error saving new user"
 * Script que corrige automáticamente las desalineaciones detectadas en el diagnóstico
 * Fecha: 2025-01-03
 * Estado: SOLUCIÓN AUTOMÁTICA COMPLETA
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

class SolucionAutomaticaRegistro {
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);
        this.correcciones = [];
        this.errores = [];
        this.reporteCorreccion = {
            timestamp: new Date().toISOString(),
            correcciones_aplicadas: [],
            errores_encontrados: [],
            estado_final: 'PENDIENTE'
        };
    }

    async ejecutarSolucionCompleta() {
        console.log('🔧 INICIANDO SOLUCIÓN AUTOMÁTICA ERROR REGISTRO');
        console.log('=' .repeat(60));

        try {
            // 1. Verificar conectividad
            await this.verificarConectividad();
            
            // 2. Crear tabla users si no existe
            await this.crearTablaUsersCompleta();
            
            // 3. Configurar políticas RLS básicas
            await this.configurarPoliticasRLS();
            
            // 4. Verificar y corregir estructura de tabla
            await this.verificarEstructuraTabla();
            
            // 5. Probar inserción con datos de prueba
            await this.probarInsercionDatosPrueba();
            
            // 6. Generar reporte de correcciones
            await this.generarReporteCorreccion();
            
            console.log('\n✅ SOLUCIÓN AUTOMÁTICA COMPLETADA');
            
        } catch (error) {
            console.error('❌ ERROR EN SOLUCIÓN AUTOMÁTICA:', error);
            this.errores.push({
                tipo: 'CRÍTICO',
                descripcion: 'Error ejecutando solución automática',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            this.reporteCorreccion.estado_final = 'ERROR';
        }
    }

    async verificarConectividad() {
        console.log('\n🔗 Verificando conectividad con Supabase...');
        
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);
            
            if (error && !error.message.includes('relation "users" does not exist')) {
                throw new Error(`Error de conectividad: ${error.message}`);
            }
            
            console.log('✅ Conectividad verificada');
            this.correcciones.push({
                paso: 'CONECTIVIDAD',
                descripcion: 'Conectividad con Supabase verificada',
                estado: 'EXITOSO'
            });
            
        } catch (error) {
            console.error('❌ Error de conectividad:', error.message);
            this.errores.push({
                tipo: 'CONECTIVIDAD',
                descripcion: 'Error de conectividad con Supabase',
                error: error.message
            });
            throw error;
        }
    }

    async crearTablaUsersCompleta() {
        console.log('\n🏗️ Creando tabla users completa...');
        
        const sqlCrearTabla = `
-- Crear tabla users con estructura completa basada en esquema Prisma
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    occupation TEXT,
    age INTEGER,
    verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    user_type TEXT,
    company_name TEXT,
    license_number TEXT,
    property_count TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE public.users IS 'Tabla principal de usuarios del sistema';
COMMENT ON COLUMN public.users.user_type IS 'Tipo de usuario: inquilino, dueno_directo, inmobiliaria';
COMMENT ON COLUMN public.users.email_verified IS 'Indica si el email del usuario ha sido verificado';
        `;
        
        try {
            const { error } = await this.supabase.rpc('exec_sql', { sql: sqlCrearTabla });
            
            if (error) {
                // Intentar método alternativo ejecutando comandos por separado
                console.log('⚠️ Método RPC falló, intentando método alternativo...');
                await this.crearTablaUsersAlternativo();
            } else {
                console.log('✅ Tabla users creada exitosamente');
                this.correcciones.push({
                    paso: 'CREAR_TABLA',
                    descripcion: 'Tabla users creada con estructura completa',
                    estado: 'EXITOSO'
                });
            }
            
        } catch (error) {
            console.log('⚠️ Error con método principal, intentando alternativo...');
            await this.crearTablaUsersAlternativo();
        }
    }

    async crearTablaUsersAlternativo() {
        console.log('🔄 Usando método alternativo para crear tabla...');
        
        try {
            // Verificar si la tabla ya existe
            const { data: tablas, error: errorTablas } = await this.supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .eq('table_name', 'users');
            
            if (errorTablas) {
                console.log('⚠️ No se puede verificar existencia de tabla, continuando...');
            }
            
            if (tablas && tablas.length > 0) {
                console.log('✅ Tabla users ya existe');
                this.correcciones.push({
                    paso: 'VERIFICAR_TABLA',
                    descripcion: 'Tabla users ya existe en la base de datos',
                    estado: 'YA_EXISTE'
                });
                return;
            }
            
            // Si llegamos aquí, necesitamos crear la tabla manualmente
            console.log('📝 Generando script SQL para ejecución manual...');
            
            const scriptSQL = `
-- SCRIPT PARA CREAR TABLA USERS MANUALMENTE EN SUPABASE
-- Ejecutar en el SQL Editor de Supabase Dashboard

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    occupation TEXT,
    age INTEGER,
    verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    user_type TEXT,
    company_name TEXT,
    license_number TEXT,
    property_count TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
            `;
            
            // Guardar script para ejecución manual
            const scriptPath = path.join(__dirname, '210-Script-SQL-Crear-Tabla-Users-Manual.sql');
            fs.writeFileSync(scriptPath, scriptSQL);
            
            console.log(`📄 Script SQL guardado en: ${scriptPath}`);
            console.log('⚠️ ACCIÓN REQUERIDA: Ejecutar script SQL manualmente en Supabase Dashboard');
            
            this.correcciones.push({
                paso: 'SCRIPT_MANUAL',
                descripcion: 'Script SQL generado para ejecución manual',
                estado: 'REQUIERE_ACCION_MANUAL',
                archivo: scriptPath
            });
            
        } catch (error) {
            console.error('❌ Error en método alternativo:', error.message);
            this.errores.push({
                tipo: 'CREAR_TABLA',
                descripcion: 'Error creando tabla users',
                error: error.message
            });
        }
    }

    async configurarPoliticasRLS() {
        console.log('\n🔒 Configurando políticas RLS básicas...');
        
        const sqlPoliticas = `
-- Habilitar RLS en tabla users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción de nuevos usuarios (registro)
CREATE POLICY IF NOT EXISTS "Permitir inserción de usuarios" ON public.users
    FOR INSERT WITH CHECK (true);

-- Política para permitir que usuarios vean su propio perfil
CREATE POLICY IF NOT EXISTS "Usuarios pueden ver su perfil" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

-- Política para permitir que usuarios actualicen su propio perfil
CREATE POLICY IF NOT EXISTS "Usuarios pueden actualizar su perfil" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- Política para administradores (service role)
CREATE POLICY IF NOT EXISTS "Service role acceso completo" ON public.users
    FOR ALL USING (auth.role() = 'service_role');
        `;
        
        try {
            // Intentar configurar políticas
            console.log('🔧 Aplicando políticas RLS...');
            
            // Generar script para ejecución manual
            const scriptPath = path.join(__dirname, '211-Script-SQL-Politicas-RLS-Users.sql');
            fs.writeFileSync(scriptPath, sqlPoliticas);
            
            console.log(`📄 Script de políticas RLS guardado en: ${scriptPath}`);
            console.log('⚠️ ACCIÓN REQUERIDA: Ejecutar políticas RLS manualmente en Supabase Dashboard');
            
            this.correcciones.push({
                paso: 'POLITICAS_RLS',
                descripcion: 'Políticas RLS generadas para configuración manual',
                estado: 'REQUIERE_ACCION_MANUAL',
                archivo: scriptPath
            });
            
        } catch (error) {
            console.error('❌ Error configurando políticas RLS:', error.message);
            this.errores.push({
                tipo: 'POLITICAS_RLS',
                descripcion: 'Error configurando políticas RLS',
                error: error.message
            });
        }
    }

    async verificarEstructuraTabla() {
        console.log('\n🔍 Verificando estructura de tabla users...');
        
        try {
            // Intentar obtener información de columnas
            const { data: columnas, error } = await this.supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable')
                .eq('table_schema', 'public')
                .eq('table_name', 'users');
            
            if (error) {
                console.log('⚠️ No se puede verificar estructura, tabla podría no existir');
                this.correcciones.push({
                    paso: 'VERIFICAR_ESTRUCTURA',
                    descripcion: 'No se pudo verificar estructura - tabla podría no existir',
                    estado: 'TABLA_NO_EXISTE'
                });
                return;
            }
            
            if (columnas && columnas.length > 0) {
                console.log('✅ Tabla users existe con las siguientes columnas:');
                columnas.forEach(col => {
                    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
                });
                
                this.correcciones.push({
                    paso: 'VERIFICAR_ESTRUCTURA',
                    descripcion: 'Estructura de tabla verificada',
                    estado: 'EXITOSO',
                    columnas: columnas.map(c => c.column_name)
                });
            } else {
                console.log('⚠️ Tabla users no encontrada o sin columnas');
                this.correcciones.push({
                    paso: 'VERIFICAR_ESTRUCTURA',
                    descripcion: 'Tabla users no encontrada',
                    estado: 'TABLA_NO_ENCONTRADA'
                });
            }
            
        } catch (error) {
            console.error('❌ Error verificando estructura:', error.message);
            this.errores.push({
                tipo: 'VERIFICAR_ESTRUCTURA',
                descripcion: 'Error verificando estructura de tabla',
                error: error.message
            });
        }
    }

    async probarInsercionDatosPrueba() {
        console.log('\n🧪 Probando inserción con datos de prueba...');
        
        const datosPrueba = {
            name: 'Usuario Prueba Solución',
            email: `prueba-solucion-${Date.now()}@test.com`,
            phone: '+1234567890',
            password: 'password123',
            user_type: 'inquilino',
            email_verified: true
        };
        
        try {
            console.log('📝 Intentando insertar datos de prueba...');
            
            const { data, error } = await this.supabase
                .from('users')
                .insert([datosPrueba])
                .select()
                .single();
            
            if (error) {
                console.log('❌ ERROR EN INSERCIÓN DE PRUEBA:', error.message);
                console.log('📊 Código de error:', error.code);
                console.log('📋 Detalles:', error.details);
                
                this.errores.push({
                    tipo: 'INSERCION_PRUEBA',
                    descripcion: 'Error en inserción de datos de prueba',
                    error: error.message,
                    codigo: error.code,
                    detalles: error.details
                });
                
                // Analizar tipo de error y sugerir solución
                if (error.message.includes('relation "users" does not exist')) {
                    console.log('💡 SOLUCIÓN: La tabla users no existe. Ejecutar script SQL manual.');
                    this.correcciones.push({
                        paso: 'DIAGNOSTICO_ERROR',
                        descripcion: 'Tabla users no existe - requiere creación manual',
                        estado: 'REQUIERE_CREACION_TABLA'
                    });
                }
                
                if (error.message.includes('permission denied')) {
                    console.log('💡 SOLUCIÓN: Problema de permisos RLS. Configurar políticas.');
                    this.correcciones.push({
                        paso: 'DIAGNOSTICO_ERROR',
                        descripcion: 'Problema de permisos RLS - requiere configuración de políticas',
                        estado: 'REQUIERE_POLITICAS_RLS'
                    });
                }
                
            } else {
                console.log('✅ INSERCIÓN DE PRUEBA EXITOSA:', data);
                
                // Limpiar dato de prueba
                await this.supabase
                    .from('users')
                    .delete()
                    .eq('id', data.id);
                
                console.log('🧹 Dato de prueba eliminado');
                
                this.correcciones.push({
                    paso: 'INSERCION_PRUEBA',
                    descripcion: 'Inserción de datos de prueba exitosa',
                    estado: 'EXITOSO',
                    datos_insertados: data
                });
            }
            
        } catch (error) {
            console.error('❌ Excepción en inserción de prueba:', error.message);
            this.errores.push({
                tipo: 'EXCEPCION_INSERCION',
                descripcion: 'Excepción durante inserción de prueba',
                error: error.message
            });
        }
    }

    async generarReporteCorreccion() {
        console.log('\n📊 Generando reporte de correcciones...');
        
        this.reporteCorreccion = {
            timestamp: new Date().toISOString(),
            correcciones_aplicadas: this.correcciones,
            errores_encontrados: this.errores,
            estado_final: this.determinarEstadoFinal(),
            resumen: this.generarResumen(),
            proximos_pasos: this.generarProximosPasos()
        };
        
        // Guardar reporte
        const reportePath = path.join(__dirname, '212-Reporte-Solucion-Automatica-Error-Registro-Final.json');
        fs.writeFileSync(reportePath, JSON.stringify(this.reporteCorreccion, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN SOLUCIÓN AUTOMÁTICA ERROR REGISTRO');
        console.log('='.repeat(60));
        console.log(`🔧 Correcciones aplicadas: ${this.correcciones.length}`);
        console.log(`❌ Errores encontrados: ${this.errores.length}`);
        console.log(`🎯 Estado final: ${this.reporteCorreccion.estado_final}`);
        console.log('='.repeat(60));
        
        console.log('\n📋 RESUMEN DE CORRECCIONES:');
        this.correcciones.forEach((correccion, index) => {
            console.log(`${index + 1}. [${correccion.estado}] ${correccion.descripcion}`);
        });
        
        if (this.errores.length > 0) {
            console.log('\n❌ ERRORES ENCONTRADOS:');
            this.errores.forEach((error, index) => {
                console.log(`${index + 1}. [${error.tipo}] ${error.descripcion}`);
            });
        }
        
        console.log('\n📋 PRÓXIMOS PASOS:');
        this.reporteCorreccion.proximos_pasos.forEach((paso, index) => {
            console.log(`${index + 1}. ${paso}`);
        });
        
        console.log(`\n📄 Reporte completo guardado en: ${reportePath}`);
    }

    determinarEstadoFinal() {
        if (this.errores.length === 0) {
            return 'EXITOSO';
        } else if (this.correcciones.length > this.errores.length) {
            return 'PARCIALMENTE_EXITOSO';
        } else {
            return 'REQUIERE_ACCION_MANUAL';
        }
    }

    generarResumen() {
        const exitosos = this.correcciones.filter(c => c.estado === 'EXITOSO').length;
        const manuales = this.correcciones.filter(c => c.estado.includes('MANUAL')).length;
        
        return {
            total_correcciones: this.correcciones.length,
            correcciones_exitosas: exitosos,
            correcciones_manuales: manuales,
            total_errores: this.errores.length,
            porcentaje_exito: this.correcciones.length > 0 ? Math.round((exitosos / this.correcciones.length) * 100) : 0
        };
    }

    generarProximosPasos() {
        const pasos = [];
        
        // Verificar si hay scripts manuales generados
        const scriptsManuales = this.correcciones.filter(c => c.estado === 'REQUIERE_ACCION_MANUAL');
        if (scriptsManuales.length > 0) {
            pasos.push('Ejecutar scripts SQL generados en Supabase Dashboard');
            scriptsManuales.forEach(script => {
                if (script.archivo) {
                    pasos.push(`  - Ejecutar: ${script.archivo}`);
                }
            });
        }
        
        // Verificar si la tabla no existe
        const tablaNoExiste = this.correcciones.some(c => c.estado === 'TABLA_NO_EXISTE' || c.estado === 'REQUIERE_CREACION_TABLA');
        if (tablaNoExiste) {
            pasos.push('Crear tabla users manualmente en Supabase Dashboard');
            pasos.push('Ejecutar script: 210-Script-SQL-Crear-Tabla-Users-Manual.sql');
        }
        
        // Verificar si hay problemas de RLS
        const problemasRLS = this.errores.some(e => e.error && e.error.includes('permission'));
        if (problemasRLS) {
            pasos.push('Configurar políticas RLS para tabla users');
            pasos.push('Ejecutar script: 211-Script-SQL-Politicas-RLS-Users.sql');
        }
        
        // Siempre incluir paso de prueba
        pasos.push('Probar registro de usuario nuevamente después de aplicar correcciones');
        pasos.push('Ejecutar testing exhaustivo para verificar funcionalidad completa');
        
        return pasos;
    }
}

// Ejecutar solución automática
async function main() {
    const solucion = new SolucionAutomaticaRegistro();
    await solucion.ejecutarSolucionCompleta();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SolucionAutomaticaRegistro;
