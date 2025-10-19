const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMigration() {
  console.log('='.repeat(80))
  console.log('VERIFICACIÓN: Migración message_id nullable')
  console.log('='.repeat(80))

  try {
    // Verificar estructura de la columna message_id
    const { data: columns, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT
            column_name,
            is_nullable,
            data_type,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'message_attachments'
            AND column_name = 'message_id';
        `
      })

    if (error) {
      console.log('\n⚠️  No se pudo ejecutar query via RPC')
      console.log('   Por favor ejecuta este SQL manualmente en Supabase SQL Editor:\n')
      console.log(`   SELECT column_name, is_nullable, data_type
   FROM information_schema.columns
   WHERE table_name = 'message_attachments'
     AND column_name = 'message_id';`)
      console.log('\n   Debería mostrar: is_nullable = "YES"\n')
      return
    }

    if (columns && columns.length > 0) {
      const col = columns[0]
      console.log('\n✅ Estructura de message_id:')
      console.log(`   Nombre: ${col.column_name}`)
      console.log(`   Tipo: ${col.data_type}`)
      console.log(`   Nullable: ${col.is_nullable}`)
      console.log(`   Default: ${col.column_default || 'NULL'}`)

      if (col.is_nullable === 'YES') {
        console.log('\n✅✅✅ MIGRACIÓN EXITOSA - message_id es nullable ✅✅✅')
      } else {
        console.log('\n❌ MIGRACIÓN PENDIENTE - message_id todavía es NOT NULL')
        console.log('   Por favor ejecuta el archivo: migrate-message-attachments-nullable.sql')
      }
    }

  } catch (err) {
    console.error('\n❌ Error al verificar migración:', err.message)
    console.log('\n📝 Verifica manualmente en Supabase SQL Editor con:')
    console.log(`
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'message_attachments'
  AND column_name = 'message_id';
`)
  }

  console.log('\n' + '='.repeat(80))
}

verifyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
