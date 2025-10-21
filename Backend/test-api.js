const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Leer .env.local manualmente
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

async function checkView() {
  const postId = '693d92c2-3ab3-4f78-b573-15ebaf8b6ada'

  console.log('1. Buscando TODOS los posts del usuario en la view...')
  const { data: allPosts, error: allError } = await supabase
    .from('community_posts_public')
    .select('id, title, user_id')
    .eq('user_id', '6403f9d2-e846-4c70-87e0-e051127d9500')

  if (allError) {
    console.log('Error:', allError.message)
    return
  }

  console.log('Posts encontrados en view:', allPosts.length)
  allPosts.forEach(p => {
    console.log('-', p.id.substring(0, 8), '|', p.title)
  })

  const exists = allPosts.find(p => p.id === postId)
  if (!exists) {
    console.log('\n❌ El post NO aparece en la view community_posts_public')
    console.log('Esto indica que la VIEW tiene filtros que lo excluyen\n')

    // Verificar en la tabla directa
    console.log('2. Verificando en tabla community_posts directa...')
    const { data: directData } = await supabase
      .from('community_posts')
      .select('id, title, is_active, status')
      .eq('id', postId)
      .single()

    if (directData) {
      console.log('✅ Post SÍ existe en tabla:')
      console.log(JSON.stringify(directData, null, 2))
      console.log('\n⚠️  CONCLUSIÓN: La view tiene filtros adicionales')
    }
  } else {
    console.log('\n✅ El post SÍ aparece en la view')
  }
}

checkView().catch(console.error)
