/**
 * Script para crear publicaciones de prueba en la plataforma
 * Usuario: 6403f9d2-e846-4c70-87e0-e051127d9500
 */

const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno desde .env.local manualmente
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const USER_ID = '6403f9d2-e846-4c70-87e0-e051127d9500'

// Publicaciones de COMUNIDAD (7-10)
const communityPosts = [
  {
    role: 'OFREZCO',
    title: 'Busco compañera para compartir departamento cerca de la facultad',
    description: 'Soy estudiante de Psicología, ofrezco habitación individual en departamento compartido. Baño compartido, cocina completa. Ambiente tranquilo.\n\nIncluye: Wi-Fi, agua, luz, gas.',
    city: 'Oberá',
    neighborhood: 'A 6 cuadras de la UNaM',
    price: 100000,
    room_type: 'PRIVADA',
    occupants: 2,
    pet_pref: 'NO_PET',
    smoke_pref: 'NO_FUMADOR',
    diet: 'NINGUNA',
    amenities: ['Wi-Fi', 'Cocina completa', 'Servicios incluidos'],
    tags: ['Estudiante-friendly', 'Cerca de UNaM', 'Solo mujeres', 'Ambiente tranquilo'],
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
    available_from: '2025-02-01',
    lease_term: '6 meses mínimo'
  },
  {
    role: 'OFREZCO',
    title: 'Habitación disponible en casa familiar',
    description: 'Casa con patio, se alquila habitación amoblada a estudiante responsable. Acceso a cocina, comedor y lavarropas.\n\nIncluye: Todos los servicios.',
    city: 'Posadas',
    neighborhood: 'Barrio Santa Rita',
    price: 120000,
    room_type: 'PRIVADA',
    occupants: 1,
    pet_pref: 'INDIFERENTE',
    smoke_pref: 'NO_FUMADOR',
    diet: 'NINGUNA',
    amenities: ['Patio', 'Lavarropas', 'Cocina compartida', 'Servicios incluidos'],
    tags: ['Casa familiar', 'Con patio', 'Estudiante responsable'],
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'],
    available_from: '2025-01-15',
    lease_term: 'Flexible'
  },
  {
    role: 'OFREZCO',
    title: 'Alquilo habitación en depto compartido (solo mujeres)',
    description: 'Departamento 3 ambientes. Habitación privada para estudiante mujer. Zona segura y con transporte.\n\nIncluye: Wi-Fi, expensas y agua.',
    city: 'Posadas',
    neighborhood: 'Zona Av. Uruguay',
    price: 135000,
    room_type: 'PRIVADA',
    occupants: 2,
    pet_pref: 'NO_PET',
    smoke_pref: 'NO_FUMADOR',
    diet: 'NINGUNA',
    amenities: ['Wi-Fi', 'Expensas incluidas', 'Agua incluida', 'Transporte cercano'],
    tags: ['Solo mujeres', 'Zona segura', 'Cerca de transporte'],
    images: ['https://images.unsplash.com/photo-1502672260066-6bc35f0a1f80?w=800'],
    available_from: '2025-02-01',
    lease_term: '6 meses'
  },
  {
    role: 'OFREZCO',
    title: 'Ofrezco habitación céntrica, ideal para estudiante',
    description: 'Ambiente tranquilo, habitación simple en casa compartida. Ideal para estudiante de profesorado. Baño compartido.\n\nIncluye: Agua, luz, Wi-Fi.',
    city: 'Leandro N. Alem',
    neighborhood: 'Centro',
    price: 110000,
    room_type: 'PRIVADA',
    occupants: 2,
    pet_pref: 'NO_PET',
    smoke_pref: 'NO_FUMADOR',
    diet: 'NINGUNA',
    amenities: ['Wi-Fi', 'Servicios incluidos', 'Céntrico'],
    tags: ['Céntrico', 'Estudiantes', 'Ambiente tranquilo'],
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'],
    available_from: '2025-01-20',
    lease_term: 'Mínimo 4 meses'
  }
]

async function createCommunityPosts() {
  console.log('\n📝 Creando publicaciones de COMUNIDAD...\n')

  for (const post of communityPosts) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: USER_ID,
          role: post.role,
          title: post.title,
          description: post.description,
          city: post.city,
          neighborhood: post.neighborhood,
          price: post.price,
          room_type: post.room_type,
          occupants: post.occupants,
          pet_pref: post.pet_pref,
          smoke_pref: post.smoke_pref,
          diet: post.diet,
          amenities: post.amenities,
          tags: post.tags,
          images: post.images,
          is_active: true,
          status: 'active',
          available_from: post.available_from,
          lease_term: post.lease_term,
          views_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error(`❌ Error creando "${post.title}":`, error.message)
      } else {
        console.log(`✅ Creado: "${post.title}" - $${post.price.toLocaleString('es-AR')}`)
      }
    } catch (err) {
      console.error(`❌ Exception creando "${post.title}":`, err.message)
    }
  }
}

async function main() {
  console.log('🚀 Iniciando creación de publicaciones de prueba...')
  console.log(`👤 Usuario: ${USER_ID}\n`)

  await createCommunityPosts()

  console.log('\n✨ Proceso completado!')
  console.log('\n💡 Nota: Las publicaciones 2-6 (propiedades tradicionales) deben crearse')
  console.log('   manualmente desde el panel de propiedades, ya que usan una estructura diferente.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error fatal:', err)
    process.exit(1)
  })
