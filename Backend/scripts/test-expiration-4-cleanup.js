// Script 4: Limpiar propiedades de prueba
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const USER_ID = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('Asegurate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function cleanup() {
  console.log('🧹 Limpiando propiedades de prueba...\n')

  // 1. Ver cuántas hay
  const { count: beforeCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .like('title', 'Propiedad Test%')

  console.log(`📊 Propiedades de prueba encontradas: ${beforeCount}`)

  if (beforeCount === 0) {
    console.log('✅ No hay propiedades de prueba para limpiar')
    return
  }

  // 2. Eliminar
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('user_id', USER_ID)
    .like('title', 'Propiedad Test%')

  if (error) {
    console.error('❌ Error eliminando:', error)
    return
  }

  console.log(`✅ ${beforeCount} propiedades de prueba eliminadas\n`)

  // 3. Verificar total restante
  const { count: afterCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', true)

  console.log(`📊 Propiedades activas restantes: ${afterCount}`)

  console.log('\n✅ Limpieza completada!')
}

cleanup()
