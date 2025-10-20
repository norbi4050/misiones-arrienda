// =====================================================
// HELPER: Obtener datos para test E2E
// =====================================================
// Este script busca datos válidos en tu DB para usar
// en el test E2E de attachments
// =====================================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de .env manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) {
    return {}
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env = {}

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      env[key] = value
    }
  })

  return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getTestData() {
  console.log('='.repeat(80))
  console.log('🔍 Buscando datos para test E2E...')
  console.log('='.repeat(80))

  try {
    // 1. Buscar un usuario con UserProfile
    console.log('\n1️⃣ Buscando usuario con UserProfile...')

    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        users!inner (
          id,
          email,
          user_type
        )
      `)
      .limit(5)

    if (profileError || !profiles || profiles.length === 0) {
      console.log('❌ No se encontraron UserProfiles')
      return null
    }

    console.log(`✅ Encontrados ${profiles.length} UserProfiles:`)
    profiles.forEach((p, i) => {
      console.log(`   ${i + 1}. UserProfile ID: ${p.id}`)
      console.log(`      User ID: ${p.user_id}`)
      console.log(`      Email: ${p.users.email}`)
      console.log(`      Type: ${p.users.user_type}`)
    })

    // Usar el primero
    const selectedProfile = profiles[0]

    // 2. Buscar conversación donde participa este usuario
    console.log('\n2️⃣ Buscando conversación donde participa el usuario...')

    const { data: conversations, error: convError } = await supabase
      .from('Conversation')
      .select('id, aId, bId, isActive, createdAt')
      .or(`aId.eq.${selectedProfile.id},bId.eq.${selectedProfile.id}`)
      .eq('isActive', true)
      .order('createdAt', { ascending: false })
      .limit(3)

    if (convError || !conversations || conversations.length === 0) {
      console.log('❌ No se encontraron conversaciones activas para este usuario')
      console.log('   Puedes crear una conversación manualmente o usar otro usuario')
      return null
    }

    console.log(`✅ Encontradas ${conversations.length} conversaciones activas:`)
    conversations.forEach((c, i) => {
      console.log(`   ${i + 1}. Conversation ID: ${c.id}`)
      console.log(`      Participants: ${c.aId} ↔ ${c.bId}`)
      console.log(`      Created: ${c.createdAt}`)
    })

    const selectedConv = conversations[0]

    // 3. Mostrar configuración para copiar
    console.log('\n' + '='.repeat(80))
    console.log('✅ DATOS ENCONTRADOS - Copia esto en test-attachment-flow-e2e.js:')
    console.log('='.repeat(80))
    console.log('')
    console.log('const TEST_CONFIG = {')
    console.log(`  userId: '${selectedProfile.user_id}',`)
    console.log(`  conversationId: '${selectedConv.id}',`)
    console.log(`  messageContent: 'Test E2E - Mensaje con adjunto',`)
    console.log(`  testFilePath: path.join(__dirname, 'test-file.txt')`)
    console.log('}')
    console.log('')
    console.log('='.repeat(80))
    console.log('')
    console.log('📋 Resumen:')
    console.log(`   Usuario: ${selectedProfile.users.email} (${selectedProfile.users.user_type})`)
    console.log(`   UserProfile ID: ${selectedProfile.id}`)
    console.log(`   Conversación ID: ${selectedConv.id}`)
    console.log('')
    console.log('🚀 Ahora puedes ejecutar:')
    console.log('   node test-attachment-flow-e2e.js')
    console.log('')

    return {
      userId: selectedProfile.user_id,
      userProfileId: selectedProfile.id,
      userEmail: selectedProfile.users.email,
      conversationId: selectedConv.id
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    return null
  }
}

getTestData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
