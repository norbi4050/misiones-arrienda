const https = require('https')

// Hardcoded values for testing (replace with your actual values)
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE'

console.log('=== PRUEBAS DE PERMISOS SUPABASE STORAGE ===\n')
console.log('SUPABASE_URL:', SUPABASE_URL)
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Presente' : 'No encontrado')
console.log()

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          }
          resolve(response)
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          })
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

async function testPermissions() {
  try {
    // 1. Test upload to avatars/test-uid/avatar.jpg
    console.log('1. Intentando subir a avatars/test-uid/avatar.jpg')
    const uploadData = {
      name: 'avatar.jpg',
      type: 'image/jpeg',
      size: 1024
    }

    const uploadOptions = {
      hostname: SUPABASE_URL.replace('https://', ''),
      path: '/storage/v1/object/avatars/test-uid/avatar.jpg',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const uploadResponse = await makeRequest(uploadOptions, uploadData)
    console.log('Status:', uploadResponse.statusCode)
    if (uploadResponse.body) {
      console.log('Response:', JSON.stringify(uploadResponse.body, null, 2))
    }
    console.log()

    // 2. Test upload to property-images/test.jpg
    console.log('2. Intentando subir a property-images/test.jpg')
    const uploadOptions2 = {
      hostname: SUPABASE_URL.replace('https://', ''),
      path: '/storage/v1/object/property-images/test.jpg',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const uploadResponse2 = await makeRequest(uploadOptions2, uploadData)
    console.log('Status:', uploadResponse2.statusCode)
    if (uploadResponse2.body) {
      console.log('Response:', JSON.stringify(uploadResponse2.body, null, 2))
    }
    console.log()

    // 3. Test delete from other user's folder
    console.log('3. Intentando borrar imagen fuera de mi carpeta')
    const deleteOptions = {
      hostname: SUPABASE_URL.replace('https://', ''),
      path: '/storage/v1/object/avatars/other-user/avatar.jpg',
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }

    const deleteResponse = await makeRequest(deleteOptions)
    console.log('Status:', deleteResponse.statusCode)
    if (deleteResponse.body) {
      console.log('Response:', JSON.stringify(deleteResponse.body, null, 2))
    }
    console.log()

    // 4. Test access to documents/
    console.log('4. Verificando acceso anónimo a documents/')
    const listOptions = {
      hostname: SUPABASE_URL.replace('https://', ''),
      path: '/storage/v1/object/list/documents',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const listResponse = await makeRequest(listOptions, {})
    console.log('Status:', listResponse.statusCode)
    if (listResponse.body) {
      console.log('Response:', JSON.stringify(listResponse.body, null, 2))
    }
    console.log()

    // 5. Test public URL access to documents
    console.log('5. Intentando acceder a URL pública de documents')
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/documents/test-document.pdf`
    console.log('URL pública:', publicUrl)

    const publicOptions = {
      hostname: SUPABASE_URL.replace('https://', ''),
      path: '/storage/v1/object/public/documents/test-document.pdf',
      method: 'GET'
    }

    const publicResponse = await makeRequest(publicOptions)
    console.log('Status:', publicResponse.statusCode)
    console.log('Response headers:', publicResponse.headers)

  } catch (error) {
    console.error('Error en las pruebas:', error.message)
  }
}

testPermissions()
