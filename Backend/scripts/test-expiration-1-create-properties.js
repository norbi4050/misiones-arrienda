// Script 1: Crear 10 propiedades de prueba
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

async function createTestProperties() {
  console.log('📝 Creando 10 propiedades de prueba...\n')

  for (let i = 1; i <= 10; i++) {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        user_id: USER_ID,
        title: `Propiedad Test ${i}`,
        description: 'Propiedad de prueba para testing del sistema de expiración',
        price: 100000 + (i * 10000),
        property_type: 'departamento',
        operation_type: 'venta',
        is_active: true,
        location: 'Posadas, Misiones',
        bedrooms: 2,
        bathrooms: 1,
        area: 50
      })
      .select()

    if (error) {
      console.error(`❌ Error ${i}:`, error.message)
    } else {
      console.log(`✅ Propiedad ${i} creada`)
    }
  }

  // Verificar total
  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .eq('is_active', true)

  console.log(`\n📊 Total propiedades activas: ${count}`)
}

createTestProperties()
