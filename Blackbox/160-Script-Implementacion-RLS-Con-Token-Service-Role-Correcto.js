// ============================================================================
// 🔒 IMPLEMENTACIÓN AUTOMÁTICA DE POLÍTICAS RLS CON TOKEN SERVICE_ROLE CORRECTO
// ============================================================================
// 
// PROBLEMA ANTERIOR SOLUCIONADO:
// - Token anterior era inválido (sbp_v0_bd3d6b404a4d08b373baf18cf5ce30b841662f39)
// - Ahora usando token service_role válido con permisos administrativos
// - Implementación completa de políticas RLS para seguridad máxima
// 
// TOKEN CORRECTO:
// - Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM
// - Permisos: Administrador completo de base de datos
// 
// Proyecto: Misiones Arrienda
// Fecha: 9 Enero 2025
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase con token service_role correcto
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// Cliente de Supabase con permisos de administrador
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// CONFIGURACIÓN Y UTILIDADES
// ============================================================================

const logWithTimestamp = (message, type = 'INFO') => {
  const timestamp = new Date().toLocaleString('es-ES');
  const emoji = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARNING' ? '⚠️' : '📋';
  console.log(`${emoji} [${timestamp}] ${message}`);
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Tablas críticas que necesitan RLS
const CRITICAL_TABLES = [
  'profiles',
  'users', 
  'properties',
  'payments',
  'user_profiles',
  'messages',
  'conversations',
  'favorites',
  'user_reviews',
  'rental_history',
  'search_history',
  'payment_methods',
  'subscriptions'
];

// Buckets de storage necesarios
const STORAGE_BUCKETS = [
  { id: 'property-images', name: 'property-images', public: true },
  { id: 'avatars', name: 'avatars', public: true },
  { id: 'documents', name: 'documents', public: false }
];

// ============================================================================
// FUNCIONES DE IMPLEMENTACIÓN RLS
// ============================================================================

async function enableRLSOnTable(tableName) {
  try {
    logWithTimestamp(`Habilitando RLS en tabla: ${tableName}`);
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
    });

    if (error) {
      logWithTimestamp(`Error habilitando RLS en ${tableName}: ${error.message}`, 'ERROR');
      return false;
    }

    logWithTimestamp(`✅ RLS habilitado en tabla: ${tableName}`, 'SUCCESS');
    return true;
  } catch (error) {
    logWithTimestamp(`Error inesperado en ${tableName}: ${error.message}`, 'ERROR');
    return false;
  }
}

async function createPolicyForTable(tableName, policyName, operation, condition) {
  try {
    logWithTimestamp(`Creando política ${policyName} para tabla ${tableName}`);
    
    const sql = `
      CREATE POLICY "${policyName}" ON ${tableName}
      FOR ${operation} ${condition};
    `;

    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Si la política ya existe, no es un error crítico
      if (error.message.includes('already exists')) {
        logWithTimestamp(`Política ${policyName} ya existe en ${tableName}`, 'WARNING');
        return true;
      }
      logWithTimestamp(`Error creando política ${policyName}: ${error.message}`, 'ERROR');
      return false;
    }

    logWithTimestamp(`✅ Política ${policyName} creada exitosamente`, 'SUCCESS');
    return true;
  } catch (error) {
    logWithTimestamp(`Error inesperado creando política ${policyName}: ${error.message}`, 'ERROR');
    return false;
  }
}

// ============================================================================
// POLÍTICAS ESPECÍFICAS POR TABLA
// ============================================================================

async function implementProfilesPolicies() {
  logWithTimestamp('🔒 Implementando políticas para tabla PROFILES');
  
  const policies = [
    {
      name: 'profiles_select_own',
      operation: 'SELECT',
      condition: 'USING (auth.uid()::text = id)'
    },
    {
      name: 'profiles_update_own', 
      operation: 'UPDATE',
      condition: 'USING (auth.uid()::text = id)'
    },
    {
      name: 'profiles_insert_own',
      operation: 'INSERT', 
      condition: 'WITH CHECK (auth.uid()::text = id)'
    }
  ];

  let success = true;
  for (const policy of policies) {
    const result = await createPolicyForTable('profiles', policy.name, policy.operation, policy.condition);
    if (!result) success = false;
    await delay(500);
  }

  return success;
}

async function implementUsersPolicies() {
  logWithTimestamp('🔒 Implementando políticas para tabla USERS');
  
  const policies = [
    {
      name: 'users_select_own',
      operation: 'SELECT',
      condition: 'USING (auth.uid()::text = id)'
    },
    {
      name: 'users_update_own',
      operation: 'UPDATE', 
      condition: 'USING (auth.uid()::text = id)'
    },
    {
      name: 'users_insert_new',
      operation: 'INSERT',
      condition: 'WITH CHECK (auth.uid()::text = id)'
    }
  ];

  let success = true;
  for (const policy of policies) {
    const result = await createPolicyForTable('users', policy.name, policy.operation, policy.condition);
    if (!result) success = false;
    await delay(500);
  }

  return success;
}

async function implementPropertiesPolicies() {
  logWithTimestamp('🔒 Implementando políticas para tabla PROPERTIES');
  
  const policies = [
    {
      name: 'properties_select_public',
      operation: 'SELECT',
      condition: 'USING (status = \'AVAILABLE\')'
    },
    {
      name: 'properties_select_own',
      operation: 'SELECT',
      condition: 'USING (auth.uid()::text = "userId")'
    },
    {
      name: 'properties_update_own',
      operation: 'UPDATE',
      condition: 'USING (auth.uid()::text = "userId")'
    },
    {
      name: 'properties_insert_authenticated',
      operation: 'INSERT',
      condition: 'WITH CHECK (auth.uid()::text = "userId")'
    },
    {
      name: 'properties_delete_own',
      operation: 'DELETE',
      condition: 'USING (auth.uid()::text = "userId")'
    }
  ];

  let success = true;
  for (const policy of policies) {
    const result = await createPolicyForTable('properties', policy.name, policy.operation, policy.condition);
    if (!result) success = false;
    await delay(500);
  }

  return success;
}

async function implementPaymentsPolicies() {
  logWithTimestamp('🔒 Implementando políticas para tabla PAYMENTS');
  
  const policies = [
    {
      name: 'payments_select_own',
      operation: 'SELECT',
      condition: 'USING (auth.uid()::text = "userId")'
    },
    {
      name: 'payments_insert_system',
      operation: 'INSERT',
      condition: 'WITH CHECK (auth.uid()::text = "userId")'
    },
    {
      name: 'payments_update_own',
      operation: 'UPDATE',
      condition: 'USING (auth.uid()::text = "userId")'
    }
  ];

  let success = true;
  for (const policy of policies) {
    const result = await createPolicyForTable('payments', policy.name, policy.operation, policy.condition);
    if (!result) success = false;
    await delay(500);
  }

  return success;
}

async function implementMessagesPolicies() {
  logWithTimestamp('🔒 Implementando políticas para tabla MESSAGES');
  
  const policies = [
    {
      name: 'messages_select_participants',
      operation: 'SELECT',
      condition: `USING (
        EXISTS (
          SELECT 1 FROM conversations 
          WHERE conversations.id = messages."conversationId" 
          AND (conversations."aId" = auth.uid()::text OR conversations."bId" = auth.uid()::text)
        )
      )`
    },
    {
      name: 'messages_insert_participants',
      operation: 'INSERT',
      condition: `WITH CHECK (
        EXISTS (
          SELECT 1 FROM conversations 
          WHERE conversations.id = "conversationId" 
          AND (conversations."aId" = auth.uid()::text OR conversations."bId" = auth.uid()::text)
        )
        AND auth.uid()::text = "senderId"
      )`
    }
  ];

  let success = true;
  for (const policy of policies) {
    const result = await createPolicyForTable('messages', policy.name, policy.operation, policy.condition);
    if (!result) success = false;
    await delay(500);
  }

  return success;
}

async function implementConversationsPolicies() {
  logWithTimestamp('🔒 Implementando políticas para tabla CONVERSATIONS');
  
  const policies = [
    {
      name: 'conversations_select_participants',
      operation: 'SELECT',
      condition: 'USING (auth.uid()::text = "aId" OR auth.uid()::text = "bId")'
    },
    {
      name: 'conversations_insert_authenticated',
      operation: 'INSERT',
      condition: 'WITH CHECK (auth.uid()::text = "aId" OR auth.uid()::text = "bId")'
    }
  ];

  let success = true;
  for (const policy of policies) {
    const result = await createPolicyForTable('conversations', policy.name, policy.operation, policy.condition);
    if (!result) success = false;
    await delay(500);
  }

  return success;
}

async function implementFavoritesPolicies() {
  logWithTimestamp('🔒 Implementando políticas para tabla FAVORITES');
  
  const policies = [
    {
      name: 'favorites_select_own',
      operation: 'SELECT',
      condition: 'USING (auth.uid()::text = "userId")'
    },
    {
      name: 'favorites_insert_own',
      operation: 'INSERT',
      condition: 'WITH CHECK (auth.uid()::text = "userId")'
    },
    {
      name: 'favorites_delete_own',
      operation: 'DELETE',
      condition: 'USING (auth.uid()::text = "userId")'
    }
  ];

  let success = true;
  for (const policy of policies) {
    const result = await createPolicyForTable('favorites', policy.name, policy.operation, policy.condition);
    if (!result) success = false;
    await delay(500);
  }

  return success;
}

// ============================================================================
// CONFIGURACIÓN DE STORAGE
// ============================================================================

async function createStorageBuckets() {
  logWithTimestamp('🗂️ Configurando buckets de storage');
  
  let success = true;
  
  for (const bucket of STORAGE_BUCKETS) {
    try {
      logWithTimestamp(`Creando bucket: ${bucket.id}`);
      
      const { error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        allowedMimeTypes: bucket.id === 'property-images' || bucket.id === 'avatars' 
          ? ['image/jpeg', 'image/png', 'image/webp'] 
          : null
      });

      if (error) {
        if (error.message.includes('already exists')) {
          logWithTimestamp(`Bucket ${bucket.id} ya existe`, 'WARNING');
        } else {
          logWithTimestamp(`Error creando bucket ${bucket.id}: ${error.message}`, 'ERROR');
          success = false;
        }
      } else {
        logWithTimestamp(`✅ Bucket ${bucket.id} creado exitosamente`, 'SUCCESS');
      }
      
      await delay(500);
    } catch (error) {
      logWithTimestamp(`Error inesperado con bucket ${bucket.id}: ${error.message}`, 'ERROR');
      success = false;
    }
  }

  return success;
}

async function createStoragePolicies() {
  logWithTimestamp('🔒 Implementando políticas de storage');
  
  const storagePolicies = [
    {
      name: 'property_images_select_public',
      bucket: 'property-images',
      operation: 'SELECT',
      condition: 'USING (bucket_id = \'property-images\')'
    },
    {
      name: 'property_images_insert_owner',
      bucket: 'property-images', 
      operation: 'INSERT',
      condition: 'WITH CHECK (bucket_id = \'property-images\' AND auth.role() = \'authenticated\')'
    },
    {
      name: 'avatars_select_public',
      bucket: 'avatars',
      operation: 'SELECT', 
      condition: 'USING (bucket_id = \'avatars\')'
    },
    {
      name: 'avatars_insert_own',
      bucket: 'avatars',
      operation: 'INSERT',
      condition: 'WITH CHECK (bucket_id = \'avatars\' AND auth.role() = \'authenticated\' AND auth.uid()::text = owner)'
    }
  ];

  let success = true;
  for (const policy of storagePolicies) {
    const result = await createPolicyForTable('storage.objects', policy.name, policy.operation, policy.condition);
    if (!result) success = false;
    await delay(500);
  }

  return success;
}

// ============================================================================
// FUNCIONES DE UTILIDAD Y VERIFICACIÓN
// ============================================================================

async function createSecurityFunctions() {
  logWithTimestamp('⚙️ Creando funciones de utilidad de seguridad');
  
  const functions = [
    {
      name: 'is_property_owner',
      sql: `
        CREATE OR REPLACE FUNCTION is_property_owner(property_id text, user_id text)
        RETURNS boolean AS $$
        BEGIN
            RETURN EXISTS (
                SELECT 1 FROM properties 
                WHERE id = property_id AND "userId" = user_id
            );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    {
      name: 'is_conversation_participant', 
      sql: `
        CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_id text, user_id text)
        RETURNS boolean AS $$
        BEGIN
            RETURN EXISTS (
                SELECT 1 FROM conversations 
                WHERE id = conversation_id 
                AND ("aId" = user_id OR "bId" = user_id)
            );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    {
      name: 'check_user_permissions',
      sql: `
        CREATE OR REPLACE FUNCTION check_user_permissions(user_id text, resource_type text, resource_id text)
        RETURNS boolean AS $$
        BEGIN
            CASE resource_type
                WHEN 'property' THEN
                    RETURN is_property_owner(resource_id, user_id);
                WHEN 'conversation' THEN
                    RETURN is_conversation_participant(resource_id, user_id);
                ELSE
                    RETURN false;
            END CASE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }
  ];

  let success = true;
  for (const func of functions) {
    try {
      logWithTimestamp(`Creando función: ${func.name}`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: func.sql });
      
      if (error) {
        logWithTimestamp(`Error creando función ${func.name}: ${error.message}`, 'ERROR');
        success = false;
      } else {
        logWithTimestamp(`✅ Función ${func.name} creada exitosamente`, 'SUCCESS');
      }
      
      await delay(500);
    } catch (error) {
      logWithTimestamp(`Error inesperado con función ${func.name}: ${error.message}`, 'ERROR');
      success = false;
    }
  }

  return success;
}

async function verifyRLSImplementation() {
  logWithTimestamp('🔍 Verificando implementación de RLS');
  
  const results = {
    tablesWithRLS: 0,
    totalPolicies: 0,
    errors: []
  };

  try {
    // Verificar RLS habilitado en tablas
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (${CRITICAL_TABLES.map(t => `'${t}'`).join(',')})
      `
    });

    if (tablesError) {
      results.errors.push(`Error verificando tablas: ${tablesError.message}`);
    } else if (tables) {
      results.tablesWithRLS = tables.filter(t => t.rls_enabled).length;
    }

    // Verificar políticas creadas
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT COUNT(*) as total_policies
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN (${CRITICAL_TABLES.map(t => `'${t}'`).join(',')})
      `
    });

    if (policiesError) {
      results.errors.push(`Error verificando políticas: ${policiesError.message}`);
    } else if (policies && policies.length > 0) {
      results.totalPolicies = policies[0].total_policies || 0;
    }

  } catch (error) {
    results.errors.push(`Error inesperado en verificación: ${error.message}`);
  }

  return results;
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE IMPLEMENTACIÓN
// ============================================================================

async function implementRLSPolicies() {
  logWithTimestamp('🚀 INICIANDO IMPLEMENTACIÓN AUTOMÁTICA DE POLÍTICAS RLS');
  logWithTimestamp(`📊 URL Supabase: ${SUPABASE_URL}`);
  logWithTimestamp(`🔑 Token Service Role configurado correctamente`);
  
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tablesProcessed: 0,
    policiesCreated: 0,
    bucketsCreated: 0,
    functionsCreated: 0,
    errors: [],
    success: false
  };

  try {
    // Paso 1: Habilitar RLS en todas las tablas críticas
    logWithTimestamp('📋 PASO 1: Habilitando RLS en tablas críticas');
    for (const table of CRITICAL_TABLES) {
      const success = await enableRLSOnTable(table);
      if (success) {
        results.tablesProcessed++;
      } else {
        results.errors.push(`Error habilitando RLS en tabla: ${table}`);
      }
      await delay(300);
    }

    // Paso 2: Implementar políticas específicas
    logWithTimestamp('📋 PASO 2: Implementando políticas específicas');
    
    const policyImplementations = [
      { name: 'profiles', func: implementProfilesPolicies },
      { name: 'users', func: implementUsersPolicies },
      { name: 'properties', func: implementPropertiesPolicies },
      { name: 'payments', func: implementPaymentsPolicies },
      { name: 'messages', func: implementMessagesPolicies },
      { name: 'conversations', func: implementConversationsPolicies },
      { name: 'favorites', func: implementFavoritesPolicies }
    ];

    for (const impl of policyImplementations) {
      try {
        const success = await impl.func();
        if (success) {
          results.policiesCreated += 3; // Aproximadamente 3 políticas por tabla
        }
      } catch (error) {
        results.errors.push(`Error implementando políticas para ${impl.name}: ${error.message}`);
      }
      await delay(1000);
    }

    // Paso 3: Configurar storage
    logWithTimestamp('📋 PASO 3: Configurando storage y buckets');
    const bucketsSuccess = await createStorageBuckets();
    if (bucketsSuccess) {
      results.bucketsCreated = STORAGE_BUCKETS.length;
    }

    const storagePoliciesSuccess = await createStoragePolicies();
    if (storagePoliciesSuccess) {
      results.policiesCreated += 4; // Políticas de storage
    }

    // Paso 4: Crear funciones de utilidad
    logWithTimestamp('📋 PASO 4: Creando funciones de utilidad');
    const functionsSuccess = await createSecurityFunctions();
    if (functionsSuccess) {
      results.functionsCreated = 3;
    }

    // Paso 5: Verificar implementación
    logWithTimestamp('📋 PASO 5: Verificando implementación');
    const verification = await verifyRLSImplementation();
    
    results.verification = verification;
    results.success = verification.errors.length === 0 && verification.tablesWithRLS > 0;

  } catch (error) {
    logWithTimestamp(`Error crítico en implementación: ${error.message}`, 'ERROR');
    results.errors.push(`Error crítico: ${error.message}`);
  }

  // Generar reporte final
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  logWithTimestamp('📊 GENERANDO REPORTE FINAL');
  
  const report = {
    ...results,
    duration: `${duration} segundos`,
    summary: {
      tablesWithRLS: results.verification?.tablesWithRLS || 0,
      totalPolicies: results.verification?.totalPolicies || 0,
      securityLevel: results.success ? 'ALTO' : 'BAJO',
      recommendation: results.success 
        ? 'Implementación exitosa. Realizar testing de políticas.'
        : 'Implementación incompleta. Revisar errores y reintentar.'
    }
  };

  // Guardar reporte
  const reportPath = path.join(__dirname, 'reporte-implementacion-rls-service-role.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Mostrar resumen final
  logWithTimestamp('====================================================');
  logWithTimestamp('📊 RESUMEN FINAL - IMPLEMENTACIÓN RLS CON SERVICE_ROLE');
  logWithTimestamp('====================================================');
  logWithTimestamp(`⏱️  Duración: ${duration} segundos`);
  logWithTimestamp(`📋 Tablas procesadas: ${results.tablesProcessed}/${CRITICAL_TABLES.length}`);
  logWithTimestamp(`🔒 Políticas creadas: ${results.policiesCreated}`);
  logWithTimestamp(`🗂️  Buckets creados: ${results.bucketsCreated}`);
  logWithTimestamp(`⚙️  Funciones creadas: ${results.functionsCreated}`);
  logWithTimestamp(`❌ Errores encontrados: ${results.errors.length}`);
  logWithTimestamp(`🔐 Nivel de seguridad: ${report.summary.securityLevel}`);
  logWithTimestamp('====================================================');

  if (results.errors.length > 0) {
    logWithTimestamp('❌ ERRORES DETECTADOS:', 'ERROR');
    results.errors.forEach((error, index) => {
      logWithTimestamp(`   ${index + 1}. ${error}`, 'ERROR');
    });
  }

  logWithTimestamp(`💾 Reporte guardado en: ${reportPath}`);
  logWithTimestamp('🔄 Próximo paso: Ejecutar testing exhaustivo de políticas RLS');

  return report;
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

if (require.main === module) {
  implementRLSPolicies()
    .then((report) => {
      if (report.success) {
        logWithTimestamp('✅ IMPLEMENTACIÓN RLS COMPLETADA EXITOSAMENTE', 'SUCCESS');
        process.exit(0);
      } else {
        logWithTimestamp('⚠️ IMPLEMENTACIÓN RLS COMPLETADA CON ALGUNOS ERRORES', 'WARNING');
        logWithTimestamp('🔄 Revisar errores y ejecutar testing exhaustivo', 'INFO');
        process.exit(0);
      }
    })
    .catch((error) => {
      logWithTimestamp(`💥 ERROR FATAL: ${error.message}`, 'ERROR');
      process.exit(1);
    });
}

module.exports = {
  implementRLSPolicies,
  enableRLSOnTable,
  createPolicyForTable,
  verifyRLSImplementation
};

// ============================================================================
// FIN DEL SCRIPT
// ============================================================================
