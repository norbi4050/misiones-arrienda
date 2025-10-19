const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfeyhaaxyemmnohqdele.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está definida')
  console.log('\nPor favor, verifica que el archivo .env.local contiene:')
  console.log('SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAvatarInStorage() {
  const userId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Cesar/Baldes

  console.log('=== Checking Avatar in Storage ===\n')
  console.log(`User ID: ${userId}\n`)

  try {
    // Listar archivos en la carpeta del usuario
    const { data: files, error } = await supabase
      .storage
      .from('avatars')
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('❌ Error listing files:', error)
      return
    }

    if (!files || files.length === 0) {
      console.log('⚠️  No hay archivos en Storage para este usuario')
      return
    }

    console.log(`✅ Encontrados ${files.length} archivos en Storage:\n`)
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`)
      console.log(`   Tamaño: ${(file.metadata?.size / 1024).toFixed(2)} KB`)
      console.log(`   Creado: ${file.created_at}`)
      console.log(`   Actualizado: ${file.updated_at}`)

      // Construir URL pública
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/${file.name}`)

      console.log(`   URL: ${publicUrl.publicUrl}\n`)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

checkAvatarInStorage()
