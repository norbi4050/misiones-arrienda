const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './Backend/.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testPermissions() {
  console.log('=== PRUEBAS DE PERMISOS SUPABASE STORAGE ===\n')

  // 1. Simular subida a avatars/<OTRO_UID>/avatar.jpg
  console.log('1. Intentando subir a avatars/<OTRO_UID>/avatar.jpg')
  try {
    const testFile = new File(['test content'], 'avatar.jpg', { type: 'image/jpeg' })
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload('test-uid/avatar.jpg', testFile)

    if (error) {
      console.log('ERROR al subir:', error.message)
      console.log('Código de error:', error.statusCode)
    } else {
      console.log('Subida exitosa:', data)
    }
  } catch (err) {
    console.log('ERROR de red:', err.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // 2. Simular subida a property-images//test.jpg
  console.log('2. Intentando subir a property-images//test.jpg')
  try {
    const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload('test.jpg', testFile)

    if (error) {
      console.log('ERROR al subir:', error.message)
      console.log('Código de error:', error.statusCode)
    } else {
      console.log('Subida exitosa:', data)
    }
  } catch (err) {
    console.log('ERROR de red:', err.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // 3. Intentar borrar una imagen fuera de mi carpeta
  console.log('3. Intentando borrar imagen fuera de mi carpeta')
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .remove(['other-user/avatar.jpg'])

    if (error) {
      console.log('ERROR al borrar:', error.message)
      console.log('Código de error:', error.statusCode)
    } else {
      console.log('Borrado exitoso:', data)
    }
  } catch (err) {
    console.log('ERROR de red:', err.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // 4. Comprobar que documents/ no sea accesible anónimamente
  console.log('4. Verificando acceso anónimo a documents/')
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .list()

    if (error) {
      console.log('ERROR al acceder a documents:', error.message)
      console.log('Código de error:', error.statusCode)
    } else {
      console.log('Acceso exitoso a documents:', data)
    }
  } catch (err) {
    console.log('ERROR de red:', err.message)
  }

  console.log('\n' + '='.repeat(50) + '\n')

  // 5. Intentar acceder a una URL pública de documents
  console.log('5. Intentando acceder a URL pública de documents')
  try {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl('test-document.pdf')

    console.log('URL pública generada:', data.publicUrl)

    // Intentar hacer una petición HTTP a la URL
    const response = await fetch(data.publicUrl)
    console.log('Respuesta HTTP:', response.status, response.statusText)

  } catch (err) {
    console.log('ERROR al generar URL pública:', err.message)
  }
}

testPermissions().catch(console.error)
