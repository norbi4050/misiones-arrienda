// =====================================================
// AUDITORÍA ESPECÍFICA: PERSISTENCIA PERFIL INQUILINO
// =====================================================
// Fecha: 2025-01-27
// Problema: Los cambios del perfil se borran al cambiar de pestaña
// Objetivo: Identificar la causa raíz del problema de persistencia
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase con credenciales actualizadas
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Usuario de prueba específico
const USUARIO_PRUEBA = '6403f9d2-e846-4c70-87e0-e051127d9500';

class AuditoriaPersistenciaPerfil {
    constructor() {
        this.resultados = {
            timestamp: new Date().toISOString(),
            problema: 'Persistencia de cambios en perfil de usuario inquilino',
            causasIdentificadas: [],
            solucionesRecomendadas: [],
            testRealizados: [],
            estadoActual: {},
            areasProblematicas: []
        };
    }

    async ejecutarAuditoriaCompleta() {
        console.log('🔍 INICIANDO AUDITORÍA ESPECÍFICA - PERSISTENCIA PERFIL INQUILINO');
        console.log('='.repeat(70));
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
        console.log(`🎯 Usuario de prueba: ${USUARIO_PRUEBA}`);
        console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
        console.log('='.repeat(70));
        console.log('');

        try {
            // 1. Verificar conexión y estado inicial
            await this.verificarConexionInicial();
            
            // 2. Analizar estado actual del usuario
            await this.analizarEstadoUsuario();
            
            // 3. Probar operaciones de escritura
            await this.probarOperacionesEscritura();
            
            // 4. Simular el problema reportado
            await this.simularProblemaReportado();
            
            // 5. Analizar políticas RLS específicas
            await this.analizarPoliticasRLS();
            
            // 6. Verificar endpoint API
            await this.verificarEndpointAPI();
            
            // 7. Analizar posibles causas frontend
            await this.analizarCausasFrontend();
            
            // 8. Generar diagnóstico final
            await this.generarDiagnosticoFinal();
            
        } catch (error) {
            console.error('❌ Error durante la auditoría:', error.message);
            this.resultados.error = error.message;
        }
    }

    async verificarConexionInicial() {
        console.log('🔍 PASO 1: VERIFICACIÓN DE CONEXIÓN INICIAL');
        console.log('='.repeat(50));

        try {
            const { data, error } = await supabase
                .from('users')
                .select('count')
                .limit(1);

            if (error) {
                console.log('❌ Error de conexión:', error.message);
                this.resultados.causasIdentificadas.push({
                    tipo: 'CONEXIÓN',
                    descripcion: 'Error de conexión a Supabase',
                    severidad: 'CRÍTICA',
                    detalle: error.message
                });
                return false;
            }

            console.log('✅ Conexión exitosa a Supabase');
            this.resultados.estadoActual.conexion = true;
            return true;

        } catch (error) {
            console.log('❌ Error de conexión:', error.message);
            return false;
        }
    }

    async analizarEstadoUsuario() {
        console.log('\n🔍 PASO 2: ANÁLISIS DEL ESTADO ACTUAL DEL USUARIO');
        console.log('='.repeat(50));

        try {
            // Obtener datos actuales del usuario
            const { data: usuario, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', USUARIO_PRUEBA)
                .single();

            if (error) {
                console.log('❌ Error obteniendo usuario:', error.message);
                this.resultados.causasIdentificadas.push({
                    tipo: 'ACCESO_DATOS',
                    descripcion: 'No se puede acceder a los datos del usuario',
                    severidad: 'CRÍTICA',
                    detalle: error.message
                });
                return;
            }

            console.log('✅ Usuario encontrado:', usuario.name || usuario.email);
            console.log(`📋 Tipo de usuario: ${usuario.user_type}`);
            console.log(`📅 Última actualización: ${usuario.updated_at}`);
            console.log(`📧 Email: ${usuario.email}`);
            console.log(`📱 Teléfono: ${usuario.phone || 'No especificado'}`);

            // Verificar campos específicos de inquilino
            const camposInquilino = [
                'location', 'search_type', 'budget_range', 'preferred_areas',
                'family_size', 'pet_friendly', 'move_in_date', 'employment_status',
                'monthly_income'
            ];

            console.log('\n📊 CAMPOS ESPECÍFICOS DE INQUILINO:');
            camposInquilino.forEach(campo => {
                const valor = usuario[campo];
                const estado = valor !== null && valor !== undefined ? '✅' : '⚠️';
                console.log(`   ${estado} ${campo}: ${valor || 'No especificado'}`);
            });

            this.resultados.estadoActual.usuario = usuario;
            this.resultados.testRealizados.push({
                test: 'Obtener datos usuario',
                resultado: 'EXITOSO',
                detalles: `Usuario ${usuario.user_type} encontrado con ${Object.keys(usuario).length} campos`
            });

        } catch (error) {
            console.log('❌ Error analizando usuario:', error.message);
            this.resultados.causasIdentificadas.push({
                tipo: 'ANÁLISIS_USUARIO',
                descripcion: 'Error analizando estado del usuario',
                severidad: 'ALTA',
                detalle: error.message
            });
        }
    }

    async probarOperacionesEscritura() {
        console.log('\n🔍 PASO 3: PRUEBA DE OPERACIONES DE ESCRITURA');
        console.log('='.repeat(50));

        try {
            // Test 1: Actualización simple
            console.log('🧪 Test 1: Actualización simple de campo...');
            const timestampTest = new Date().toISOString();
            
            const { data: updateResult, error: updateError } = await supabase
                .from('users')
                .update({ 
                    bio: `Test de persistencia - ${timestampTest}`,
                    updated_at: timestampTest
                })
                .eq('id', USUARIO_PRUEBA)
                .select('bio, updated_at')
                .single();

            if (updateError) {
                console.log('❌ Error en actualización:', updateError.message);
                this.resultados.causasIdentificadas.push({
                    tipo: 'ESCRITURA_BD',
                    descripcion: 'Error al actualizar datos en base de datos',
                    severidad: 'CRÍTICA',
                    detalle: updateError.message
                });
                return;
            }

            console.log('✅ Actualización exitosa');
            console.log(`   Bio actualizada: ${updateResult.bio}`);
            console.log(`   Timestamp: ${updateResult.updated_at}`);

            // Test 2: Verificar persistencia inmediata
            console.log('\n🧪 Test 2: Verificar persistencia inmediata...');
            
            const { data: verificacion, error: verifyError } = await supabase
                .from('users')
                .select('bio, updated_at')
                .eq('id', USUARIO_PRUEBA)
                .single();

            if (verifyError) {
                console.log('❌ Error verificando persistencia:', verifyError.message);
                return;
            }

            if (verificacion.bio === updateResult.bio) {
                console.log('✅ Persistencia inmediata: CORRECTA');
                this.resultados.testRealizados.push({
                    test: 'Persistencia inmediata',
                    resultado: 'EXITOSO',
                    detalles: 'Los datos se guardan correctamente en la base de datos'
                });
            } else {
                console.log('❌ Persistencia inmediata: FALLIDA');
                this.resultados.causasIdentificadas.push({
                    tipo: 'PERSISTENCIA_BD',
                    descripcion: 'Los datos no se persisten correctamente en la base de datos',
                    severidad: 'CRÍTICA',
                    detalle: `Esperado: ${updateResult.bio}, Obtenido: ${verificacion.bio}`
                });
            }

            // Test 3: Actualización de múltiples campos de inquilino
            console.log('\n🧪 Test 3: Actualización múltiples campos inquilino...');
            
            const datosInquilino = {
                location: 'Posadas, Misiones - Test',
                search_type: 'departamento',
                budget_range: '50000-80000',
                family_size: 3,
                pet_friendly: true,
                employment_status: 'empleado',
                updated_at: new Date().toISOString()
            };

            const { data: multiUpdate, error: multiError } = await supabase
                .from('users')
                .update(datosInquilino)
                .eq('id', USUARIO_PRUEBA)
                .select('location, search_type, budget_range, family_size, pet_friendly, employment_status')
                .single();

            if (multiError) {
                console.log('❌ Error en actualización múltiple:', multiError.message);
                this.resultados.causasIdentificadas.push({
                    tipo: 'ACTUALIZACIÓN_MÚLTIPLE',
                    descripcion: 'Error al actualizar múltiples campos de inquilino',
                    severidad: 'ALTA',
                    detalle: multiError.message
                });
            } else {
                console.log('✅ Actualización múltiple exitosa');
                console.log(`   Campos actualizados: ${Object.keys(datosInquilino).length - 1}`);
                this.resultados.testRealizados.push({
                    test: 'Actualización múltiple campos inquilino',
                    resultado: 'EXITOSO',
                    detalles: 'Todos los campos específicos de inquilino se actualizan correctamente'
                });
            }

        } catch (error) {
            console.log('❌ Error en pruebas de escritura:', error.message);
            this.resultados.causasIdentificadas.push({
                tipo: 'PRUEBAS_ESCRITURA',
                descripcion: 'Error durante las pruebas de escritura',
                severidad: 'ALTA',
                detalle: error.message
            });
        }
    }

    async simularProblemaReportado() {
        console.log('\n🔍 PASO 4: SIMULACIÓN DEL PROBLEMA REPORTADO');
        console.log('='.repeat(50));

        try {
            // Simular el flujo completo del problema
            console.log('🎭 Simulando: Usuario edita perfil...');
            
            // 1. Obtener estado inicial
            const { data: estadoInicial } = await supabase
                .from('users')
                .select('name, phone, location, budget_range')
                .eq('id', USUARIO_PRUEBA)
                .single();

            console.log('📋 Estado inicial:', estadoInicial);

            // 2. Simular edición de perfil
            const cambiosSimulados = {
                name: 'Usuario Test Editado',
                phone: '+54 376 999-8888',
                location: 'Eldorado, Misiones',
                budget_range: '60000-90000',
                updated_at: new Date().toISOString()
            };

            console.log('✏️ Aplicando cambios simulados...');
            const { data: despuesEdicion, error: errorEdicion } = await supabase
                .from('users')
                .update(cambiosSimulados)
                .eq('id', USUARIO_PRUEBA)
                .select('name, phone, location, budget_range, updated_at')
                .single();

            if (errorEdicion) {
                console.log('❌ Error simulando edición:', errorEdicion.message);
                return;
            }

            console.log('✅ Cambios aplicados:', despuesEdicion);

            // 3. Simular "cambio de pestaña" (esperar y volver a consultar)
            console.log('🔄 Simulando cambio de pestaña (espera 2 segundos)...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 4. Verificar si los cambios persisten
            const { data: despuesCambioTab, error: errorTab } = await supabase
                .from('users')
                .select('name, phone, location, budget_range, updated_at')
                .eq('id', USUARIO_PRUEBA)
                .single();

            if (errorTab) {
                console.log('❌ Error verificando después del cambio de pestaña:', errorTab.message);
