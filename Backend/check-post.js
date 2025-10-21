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

async function checkPost() {
  const postId = '693d92c2-3ab3-4f78-b573-15ebaf8b6ada'

  console.log('Buscando post en community_posts...')
  const { data, error } = await supabase
    .from('community_posts')
    .select('id, title, is_active, user_id, status, created_at')
    .eq('id', postId)
    .single()

  if (error) {
    console.log('❌ Error:', error.message)
  } else if (data) {
    console.log('✅ Post encontrado en community_posts:')
    console.log(JSON.stringify(data, null, 2))
  } else {
    console.log('❌ Post no encontrado en community_posts')
  }

  console.log('\n---\nBuscando en community_posts_public view...')
  const { data: viewData, error: viewError } = await supabase
    .from('community_posts_public')
    .select('id, title, is_active, user_id')
    .eq('id', postId)
    .single()

  if (viewError) {
    console.log('❌ Error en view:', viewError.message)
  } else if (viewData) {
    console.log('✅ Post encontrado en view:')
    console.log(JSON.stringify(viewData, null, 2))
  } else {
    console.log('❌ Post no encontrado en view')
  }
}

checkPost().catch(console.error)
