require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('🚀 Ejecutando migración de auto-expiración de planes...\n')

  const sql = fs.readFileSync('./migrations/auto_expire_plans_system.sql', 'utf8')

  // Ejecutar todo el SQL de una vez
  try {
    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('❌ Error:', error)
      // Intentar ejecutar por partes si falla
      console.log('\n⚠️  Ejecutando manualmente...')
      console.log('Por favor, copia el contenido de migrations/auto_expire_plans_system.sql')
      console.log('y ejecútalo en el SQL Editor de Supabase Dashboard')
      console.log(`\n📍 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/_/sql')}`)
    } else {
      console.log('✅ Migración aplicada exitosamente!')
    }
  } catch (err) {
    console.log('\n⚠️  La función exec_sql no está disponible.')
    console.log('📋 Pasos para aplicar la migración manualmente:')
    console.log('\n1. Abre el Supabase Dashboard')
    console.log('2. Ve a SQL Editor')
    console.log('3. Copia y pega el contenido de: migrations/auto_expire_plans_system.sql')
    console.log('4. Ejecuta el SQL')
    console.log('\n📍 Dashboard:', process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/'))
  }
}

runMigration()
