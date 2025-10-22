const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Leer .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyRLSPolicies() {
  console.log('🔒 Habilitando RLS en tablas...\n')
  console.log('⚠️  NOTA: Las políticas deben aplicarse manualmente en Supabase SQL Editor')
  console.log('El script SQL está en: scripts/enable-rls-security.sql\n')

  const tables = [
    'notifications',
    'notification_preferences',
    'email_logs',
    'UserProfile_backup_20250118'
  ]

  console.log('Tablas a proteger:')
  tables.forEach((table, i) => {
    console.log(`  ${i + 1}. ${table}`)
  })

  console.log('\n📝 INSTRUCCIONES:')
  console.log('1. Abre Supabase Dashboard → SQL Editor')
  console.log('2. Copia el contenido de scripts/enable-rls-security.sql')
  console.log('3. Pega y ejecuta el script')
  console.log('4. Verifica que no haya errores')

  console.log('\n' + '='.repeat(60))
  console.log('El script SQL completo está listo para usar')
  console.log('Archivo: scripts/enable-rls-security.sql')
  console.log('='.repeat(60))
}

applyRLSPolicies().catch(console.error)
