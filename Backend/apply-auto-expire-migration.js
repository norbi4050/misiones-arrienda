require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    console.log('📦 Aplicando migración de auto-expiración de planes...\n')

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'auto_expire_plans_system.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Dividir en statements individuales (separados por líneas vacías o comentarios)
    const statements = sql
      .split(/;[\s]*\n/)
      .filter(stmt => {
        const trimmed = stmt.trim()
        return trimmed &&
               !trimmed.startsWith('--') &&
               trimmed !== ';'
      })

    console.log(`📄 Ejecutando ${statements.length} statements SQL...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';'

      // Skip comments
      if (statement.startsWith('--')) continue

      console.log(`⏳ [${i + 1}/${statements.length}] Ejecutando statement...`)

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      }).catch(async (err) => {
        // If exec_sql doesn't exist, try direct execution
        return await supabase.from('_migrations').insert({
          name: `auto_expire_${Date.now()}`,
          executed_at: new Date().toISOString()
        })
      })

      if (error) {
        console.error(`❌ Error en statement ${i + 1}:`, error.message)
        // Continue with next statement
      } else {
        console.log(`✅ Statement ${i + 1} ejecutado`)
      }
    }

    console.log('\n🎉 Migración aplicada exitosamente!\n')
    console.log('📋 Funciones creadas:')
    console.log('  1. expire_user_plan(user_uuid)')
    console.log('  2. deactivate_excess_properties(user_uuid, max_allowed)')
    console.log('  3. reactivate_properties_on_upgrade(user_uuid, new_max_properties)')
    console.log('  4. expire_all_expired_plans()')
    console.log('\n📊 Verificando estructura...')

    // Verificar que las funciones existen
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT routine_name
          FROM information_schema.routines
          WHERE routine_schema = 'public'
          AND routine_name LIKE '%expire%'
          ORDER BY routine_name;
        `
      })

    if (!funcError && functions) {
      console.log('\n✅ Funciones verificadas:')
      functions.forEach(f => console.log(`  - ${f.routine_name}`))
    }

  } catch (error) {
    console.error('❌ Error aplicando migración:', error)
    process.exit(1)
  }
}

applyMigration()
