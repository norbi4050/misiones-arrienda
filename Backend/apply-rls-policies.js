#!/usr/bin/env node

/**
 * Script para aplicar las políticas RLS de Supabase
 * Soluciona el error: "new row violates row-level security policy for table User"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\n💡 Asegúrate de tener estas variables configuradas en tu .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Aplicando Políticas RLS para tabla User');
console.log('='.repeat(50));

async function applyRLSPolicies() {
  try {
    console.log('📋 Leyendo script SQL...');
    
    const sqlPath = path.join(__dirname, 'fix-user-table-rls-policies.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Archivo SQL no encontrado: fix-user-table-rls-policies.sql');
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir el SQL en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Ejecutando ${commands.length} comandos SQL...\n`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.toLowerCase().includes('select')) {
        console.log(`${i + 1}. Consultando información...`);
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: command });
          if (error) {
            console.log(`   ⚠️  ${error.message}`);
          } else {
            console.log(`   ✅ Consulta ejecutada`);
            if (data && data.length > 0) {
              console.log(`   📊 Resultados:`, data.slice(0, 3));
            }
          }
        } catch (err) {
          console.log(`   ⚠️  ${err.message}`);
        }
      } else {
        console.log(`${i + 1}. Ejecutando: ${command.substring(0, 50)}...`);
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: command });
          if (error) {
            if (error.message.includes('already exists') || error.message.includes('does not exist')) {
              console.log(`   ⚠️  ${error.message} (esperado)`);
            } else {
              console.log(`   ❌ Error: ${error.message}`);
            }
          } else {
            console.log(`   ✅ Ejecutado correctamente`);
          }
        } catch (err) {
          console.log(`   ❌ Error: ${err.message}`);
        }
      }
    }
    
    console.log('\n🎯 Verificando políticas aplicadas...');
    
    // Verificar que las políticas se crearon
    try {
      const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('policyname, tablename')
        .eq('tablename', 'User');
      
      if (error) {
        console.log('⚠️  No se pudieron verificar las políticas:', error.message);
      } else {
        console.log('📋 Políticas encontradas:');
        policies.forEach(policy => {
          console.log(`   • ${policy.policyname}`);
        });
      }
    } catch (err) {
      console.log('⚠️  Verificación de políticas no disponible');
    }
    
    console.log('\n✅ Proceso completado');
    console.log('🚀 Ahora prueba acceder a http://localhost:3000/profile/inquilino');
    
  } catch (error) {
    console.error('❌ Error aplicando políticas RLS:', error.message);
    console.error('\n💡 Soluciones alternativas:');
    console.error('   1. Ejecuta manualmente el SQL en Supabase Dashboard > SQL Editor');
    console.error('   2. Verifica que SUPABASE_SERVICE_ROLE_KEY tenga permisos suficientes');
    console.error('   3. Contacta al administrador de la base de datos');
    process.exit(1);
  }
}

// Función alternativa usando SQL directo
async function applyRLSPoliciesDirectSQL() {
  console.log('🔄 Aplicando políticas RLS con SQL directo...\n');
  
  const policies = [
    {
      name: 'Enable RLS',
      sql: 'ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Drop existing policies',
      sql: `
        DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
        DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";
        DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
        DROP POLICY IF EXISTS "Service role can manage all profiles" ON public."User";
      `
    },
    {
      name: 'Create view policy',
      sql: `
        CREATE POLICY "Users can view own profile" ON public."User"
        FOR SELECT USING (auth.uid() = id::uuid);
      `
    },
    {
      name: 'Create insert policy',
      sql: `
        CREATE POLICY "Users can insert own profile" ON public."User"
        FOR INSERT WITH CHECK (auth.uid() = id::uuid);
      `
    },
    {
      name: 'Create update policy',
      sql: `
        CREATE POLICY "Users can update own profile" ON public."User"
        FOR UPDATE USING (auth.uid() = id::uuid);
      `
    },
    {
      name: 'Create service role policy',
      sql: `
        CREATE POLICY "Service role can manage all profiles" ON public."User"
        FOR ALL USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
          OR auth.jwt()->>'role' = 'service_role'
        );
      `
    },
    {
      name: 'Grant permissions',
      sql: `
        GRANT SELECT, INSERT, UPDATE ON public."User" TO authenticated;
        GRANT SELECT, INSERT, UPDATE ON public."User" TO anon;
        GRANT ALL ON public."User" TO service_role;
      `
    }
  ];
  
  for (const policy of policies) {
    console.log(`🔧 ${policy.name}...`);
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${error.message} (esperado)`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Aplicado correctamente`);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n✅ Políticas RLS aplicadas');
  console.log('🚀 Prueba nuevamente la página de perfil');
}

// Ejecutar el script
console.log('🚀 Iniciando aplicación de políticas RLS...\n');

applyRLSPoliciesDirectSQL()
  .then(() => {
    console.log('\n🎉 ¡Proceso completado exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el proceso:', error);
    process.exit(1);
  });
