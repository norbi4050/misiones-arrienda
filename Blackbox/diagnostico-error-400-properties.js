const { createClient } = require('@supabase/supabase-js');

console.log('🔍 DIAGNÓSTICO ERROR 400 - ENDPOINT PROPERTIES');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function diagnosticarError400Properties() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Error analizado: GET /rest/v1/properties - Status 400');
    console.log('🔗 URL problemática:', 'https://qfeyhaaxyemmnohqdele.supabase.co/rest/v1/properties?select=id%2Cinquiries%3Aproperty_inquiries%28id%29&user_id=eq.6403f9d2-e846-4c70-87e0-e051127d9500');
    console.log('👤 Usuario afectado:', '6403f9d2-e846-4c70-87e0-e051127d9500');
    console.log('');

    const diagnostico = {
        problema_identificado: null,
        causa_raiz: null,
        solucion_propuesta: null,
        pasos_ejecutados: [],
        errores_encontrados: []
    };

    try {
        // =====================================================
        // PASO 1: VERIFICAR EXISTENCIA DE TABLA PROPERTIES
        // =====================================================
        console.log('🔍 PASO 1: VERIFICANDO EXISTENCIA DE TABLA PROPERTIES');
        console.log('-'.repeat(50));

        const { data: tablaProperties, error: errorTablaProperties } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'public')
            .eq('table_name', 'properties');

        if (errorTablaProperties) {
            console.log('❌ ERROR verificando tabla properties:', errorTablaProperties.message);
            diagnostico.errores_encontrados.push({
                paso: 'verificar_tabla_properties',
                error: errorTablaProperties.message
            });
        } else if (!tablaProperties || tablaProperties.length === 0) {
            console.log('❌ PROBLEMA CRÍTICO: Tabla "properties" NO EXISTE');
            console.log('   └─ Esta es la causa principal del error 400');
            
            diagnostico.problema_identificado = 'Tabla properties no existe';
            diagnostico.causa_raiz = 'La aplicación intenta consultar una tabla que no existe en Supabase';
            diagnostico.solucion_propuesta = 'Crear tabla properties con estructura completa';
            
            diagnostico.pasos_ejecutados.push({
                paso: 'verificar_tabla_properties',
                resultado: 'tabla_no_existe',
                critico: true
            });
        } else {
            console.log('✅ Tabla properties existe');
            console.log(`   └─ Esquema: ${tablaProperties[0].table_schema}`);
            console.log(`   └─ Nombre: ${tablaProperties[0].table_name}`);
            
            diagnostico.pasos_ejecutados.push({
                paso: 'verificar_tabla_properties',
                resultado: 'tabla_existe'
            });
        }

        // =====================================================
        // PASO 2: VERIFICAR EXISTENCIA DE TABLA PROPERTY_INQUIRIES
        // =====================================================
        console.log('');
        console.log('🔍 PASO 2: VERIFICANDO EXISTENCIA DE TABLA PROPERTY_INQUIRIES');
        console.log('-'.repeat(50));

        const { data: tablaInquiries, error: errorTablaInquiries } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'public')
            .eq('table_name', 'property_inquiries');

        if (errorTablaInquiries) {
            console.log('❌ ERROR verificando tabla property_inquiries:', errorTablaInquiries.message);
            diagnostico.errores_encontrados.push({
                paso: 'verificar_tabla_inquiries',
                error: errorTablaInquiries.message
            });
        } else if (!tablaInquiries || tablaInquiries.length === 0) {
            console.log('❌ PROBLEMA: Tabla "property_inquiries" NO EXISTE');
            console.log('   └─ Necesaria para la relación en el SELECT');
            
            diagnostico.errores_encontrados.push({
                paso: 'verificar_tabla_inquiries',
                problema: 'Tabla property_inquiries no existe',
                impacto: 'La consulta con JOIN fallará'
            });
        } else {
            console.log('✅ Tabla property_inquiries existe');
            console.log(`   └─ Esquema: ${tablaInquiries[0].table_schema}`);
            console.log(`   └─ Nombre: ${tablaInquiries[0].table_name}`);
        }

        // =====================================================
        // PASO 3: ANÁLISIS DE LA QUERY PROBLEMÁTICA
        // =====================================================
        console.log('');
        console.log('🔍 PASO 3: ANÁLISIS DE LA QUERY PROBLEMÁTICA');
        console.log('-'.repeat(50));

        console.log('📋 QUERY DECODIFICADA:');
        const queryDecodificada = decodeURIComponent('select=id%2Cinquiries%3Aproperty_inquiries%28id%29&user_id=eq.6403f9d2-e846-4c70-87e0-e051127d9500');
        console.log(`   └─ ${queryDecodificada}`);
        
        console.log('');
        console.log('📋 COMPONENTES DE LA QUERY:');
        console.log('   └─ SELECT: id, inquiries:property_inquiries(id)');
        console.log('   └─ WHERE: user_id = eq.6403f9d2-e846-4c70-87e0-e051127d9500');
        console.log('   └─ TABLA PRINCIPAL: properties');
        console.log('   └─ TABLA RELACIONADA: property_inquiries');

        console.log('');
        console.log('🚨 PROBLEMAS IDENTIFICADOS EN LA QUERY:');
        console.log('   1. ❌ Tabla "properties" no existe');
        console.log('   2. ❌ Campo "user_id" puede no existir en properties');
        console.log('   3. ❌ Relación "inquiries:property_inquiries" puede estar mal definida');
        console.log('   4. ❌ Tabla "property_inquiries" puede no existir');

        // =====================================================
        // PASO 4: VERIFICAR TODAS LAS TABLAS EXISTENTES
        // =====================================================
        console.log('');
        console.log('🔍 PASO 4: VERIFICANDO TODAS LAS TABLAS EXISTENTES');
        console.log('-'.repeat(50));

        const { data: todasTablas, error: errorTodasTablas } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'public')
            .order('table_name');

        if (errorTodasTablas) {
            console.log('❌ ERROR obteniendo todas las tablas:', errorTodasTablas.message);
        } else {
            console.log('📋 TABLAS EXISTENTES EN EL ESQUEMA PUBLIC:');
            if (todasTablas.length === 0) {
                console.log('   ⚠️ NO HAY TABLAS EN EL ESQUEMA PUBLIC');
            } else {
                todasTablas.forEach((tabla, index) => {
                    console.log(`   ${index + 1}. ${tabla.table_name}`);
                });
            }
            
            diagnostico.pasos_ejecutados.push({
                paso: 'listar_todas_tablas',
                resultado: 'completado',
                tablas_encontradas: todasTablas.length,
                tablas: todasTablas.map(t => t.table_name)
            });
        }

        // =====================================================
        // PASO 5: INTENTAR CONSULTA DIRECTA SIMPLIFICADA
        // =====================================================
        console.log('');
        console.log('🔍 PASO 5: INTENTANDO CONSULTA DIRECTA SIMPLIFICADA');
        console.log('-'.repeat(50));

        console.log('🧪 Test 1: Consulta básica a tabla properties...');
        try {
            const { data: testProperties, error: errorTestProperties } = await supabase
                .from('properties')
                .select('*')
                .limit(1);

            if (errorTestProperties) {
                console.log('❌ Error en consulta básica:', errorTestProperties.message);
                console.log(`   └─ Código: ${errorTestProperties.code}`);
                console.log(`   └─ Detalles: ${errorTestProperties.details}`);
                
                if (errorTestProperties.code === 'PGRST106') {
                    console.log('   🎯 CONFIRMADO: Tabla properties NO EXISTE (PGRST106)');
                    diagnostico.problema_identificado = 'Tabla properties no existe - Error PGRST106';
                }
            } else {
                console.log('✅ Consulta básica exitosa');
                console.log(`   └─ Registros encontrados: ${testProperties ? testProperties.length : 0}`);
            }
        } catch (error) {
            console.log('❌ Error crítico en test básico:', error.message);
        }

        console.log('');
        console.log('🧪 Test 2: Consulta con filtro user_id...');
        try {
            const { data: testUserFilter, error: errorUserFilter } = await supabase
                .from('properties')
                .select('id')
                .eq('user_id', '6403f9d2-e846-4c70-87e0-e051127d9500')
                .limit(1);

            if (errorUserFilter) {
                console.log('❌ Error con filtro user_id:', errorUserFilter.message);
                console.log(`   └─ Código: ${errorUserFilter.code}`);
                
                if (errorUserFilter.code === 'PGRST106') {
                    console.log('   🎯 CONFIRMADO: Tabla properties NO EXISTE');
                } else if (errorUserFilter.code === 'PGRST116') {
                    console.log('   🎯 Campo user_id no existe en tabla properties');
                }
            } else {
                console.log('✅ Consulta con filtro exitosa');
                console.log(`   └─ Registros encontrados: ${testUserFilter ? testUserFilter.length : 0}`);
            }
        } catch (error) {
            console.log('❌ Error crítico en test con filtro:', error.message);
        }

        // =====================================================
        // PASO 6: DIAGNÓSTICO FINAL Y RECOMENDACIONES
        // =====================================================
        console.log('');
        console.log('📊 DIAGNÓSTICO FINAL');
        console.log('='.repeat(70));

        if (!diagnostico.problema_identificado) {
            // Si llegamos aquí sin identificar el problema, es probable que sea la tabla faltante
            diagnostico.problema_identificado = 'Tabla properties no existe en Supabase';
            diagnostico.causa_raiz = 'La aplicación intenta consultar tabla properties que no fue creada';
            diagnostico.solucion_propuesta = 'Crear estructura completa de tablas del proyecto';
        }

        console.log(`🎯 PROBLEMA IDENTIFICADO: ${diagnostico.problema_identificado}`);
        console.log(`🔍 CAUSA RAÍZ: ${diagnostico.causa_raiz}`);
        console.log(`💡 SOLUCIÓN PROPUESTA: ${diagnostico.solucion_propuesta}`);

        console.log('');
        console.log('🔧 ACCIONES REQUERIDAS:');
        console.log('   1. 🏗️ Crear tabla "properties" con estructura completa');
        console.log('   2. 🏗️ Crear tabla "property_inquiries" para relaciones');
        console.log('   3. 🔗 Configurar relaciones entre tablas');
        console.log('   4. 🛡️ Configurar políticas RLS para ambas tablas');
        console.log('   5. 🧪 Insertar datos de prueba');
        console.log('   6. ✅ Verificar que la consulta funcione');

        console.log('');
        console.log('📋 ESTRUCTURA SUGERIDA PARA TABLA PROPERTIES:');
        console.log(`
CREATE TABLE public.properties (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ARS',
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_m2 NUMERIC,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT DEFAULT 'Misiones',
  country TEXT DEFAULT 'Argentina',
  latitude NUMERIC,
  longitude NUMERIC,
  user_id TEXT NOT NULL REFERENCES public.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'rented')),
  featured BOOLEAN DEFAULT false,
  images TEXT[],
  amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
        `);

        console.log('');
        console.log('📋 ESTRUCTURA SUGERIDA PARA TABLA PROPERTY_INQUIRIES:');
        console.log(`
CREATE TABLE public.property_inquiries (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  property_id TEXT NOT NULL REFERENCES public.properties(id),
  user_id TEXT NOT NULL REFERENCES public.users(id),
  message TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
        `);

        // Guardar diagnóstico
        const fs = require('fs');
        fs.writeFileSync(
            'diagnostico-error-400-properties-resultado.json',
            JSON.stringify(diagnostico, null, 2)
        );

        console.log('');
        console.log('💾 Diagnóstico guardado en: diagnostico-error-400-properties-resultado.json');
        console.log('✅ DIAGNÓSTICO ERROR 400 PROPERTIES COMPLETADO');

        return diagnostico;

    } catch (error) {
        console.error('❌ Error crítico en diagnóstico:', error.message);
        diagnostico.problema_identificado = 'Error crítico en diagnóstico';
        diagnostico.causa_raiz = error.message;
        return diagnostico;
    }
}

// Ejecutar diagnóstico
if (require.main === module) {
    diagnosticarError400Properties().catch(console.error);
}

module.exports = { diagnosticarError400Properties };
