/**
 * Script para crear propiedades tradicionales de prueba
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

// Propiedades tradicionales (2-6)
const properties = [
  {
    title: 'Departamento 2 dormitorios con balcón y cochera',
    description: 'Departamento amplio con living muy luminoso. Cuenta con balcón al frente, cochera techada, cocina separada, baño completo. Ideal familia o pareja.\n\nExtras: Mascotas pequeñas aceptadas.',
    price: 530000,
    bedrooms: 2,
    bathrooms: 1,
    garages: 1,
    area: 65,
    address: 'Barrio Villa Sarita',
    city: 'Posadas',
    province: 'Misiones',
    country: 'Argentina',
    postalCode: '3300',
    propertyType: 'APARTMENT',
    operationType: 'RENT',
    status: 'published',
    images: JSON.stringify(['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']),
    amenities: JSON.stringify(['balcón', 'cochera techada', 'cocina separada']),
    features: JSON.stringify(['luminoso', 'mascotas pequeñas permitidas']),
    currency: 'ARS',
    type: 'apartment',
    is_active: true,
    featured: false
  },
  {
    title: 'Casa 3 habitaciones con patio y parrilla',
    description: 'Casa cómoda, lista para habitar. Amplio patio verde, parrilla techada, cocina funcional y lavadero. Espacios amplios. Ideal familia con hijos.\n\nExtras: Mascotas permitidas, cochera abierta.',
    price: 790000,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    area: 120,
    lotArea: 250,
    address: 'Barrio Itaembé Miní',
    city: 'Posadas',
    province: 'Misiones',
    country: 'Argentina',
    postalCode: '3300',
    propertyType: 'HOUSE',
    operationType: 'RENT',
    status: 'published',
    images: JSON.stringify(['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800']),
    amenities: JSON.stringify(['patio verde', 'parrilla techada', 'lavadero', 'cochera abierta']),
    features: JSON.stringify(['espacios amplios', 'mascotas permitidas', 'ideal familia']),
    currency: 'ARS',
    type: 'house',
    is_active: true,
    featured: false
  },
  {
    title: 'Departamento 1 dormitorio amoblado',
    description: 'A metros de Av. Libertad. Amoblado básico con cama, placard y mesa. Edificio chico, ambiente tranquilo. Ideal estudiante o trabajador.\n\nExtras: Agua y luz se pagan aparte.',
    price: 250000,
    bedrooms: 1,
    bathrooms: 1,
    garages: 0,
    area: 35,
    address: 'Barrio Norte - Av. Libertad',
    city: 'Oberá',
    province: 'Misiones',
    country: 'Argentina',
    postalCode: '3360',
    propertyType: 'APARTMENT',
    operationType: 'RENT',
    status: 'published',
    images: JSON.stringify(['https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800']),
    amenities: JSON.stringify(['amoblado', 'cama', 'placard', 'mesa']),
    features: JSON.stringify(['céntrico', 'ambiente tranquilo', 'ideal estudiante']),
    currency: 'ARS',
    type: 'apartment',
    is_active: true,
    featured: false
  },
  {
    title: 'Casa 2 dormitorios con jardín',
    description: 'Casa sencilla con jardín al frente, espacios ventilados, cocina-comedor amplia. Ideal pareja joven o familia chica.\n\nExtras: Cochera abierta, rejas, recién pintada.',
    price: 410000,
    bedrooms: 2,
    bathrooms: 1,
    garages: 1,
    area: 80,
    lotArea: 200,
    address: 'Zona Terminal',
    city: 'Oberá',
    province: 'Misiones',
    country: 'Argentina',
    postalCode: '3360',
    propertyType: 'HOUSE',
    operationType: 'RENT',
    status: 'published',
    images: JSON.stringify(['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800']),
    amenities: JSON.stringify(['jardín', 'cochera abierta', 'cocina-comedor amplia']),
    features: JSON.stringify(['recién pintada', 'espacios ventilados', 'con rejas']),
    currency: 'ARS',
    type: 'house',
    is_active: true,
    featured: false
  },
  {
    title: 'Departamento 2 ambientes, céntrico y luminoso',
    description: 'Muy luminoso. Living comedor con ventilación cruzada, dormitorio con placard, baño completo. Ideal para persona sola o pareja.\n\nExtras: Expensas mínimas, sin mascotas.',
    price: 265000,
    bedrooms: 1,
    bathrooms: 1,
    garages: 0,
    area: 45,
    address: 'Centro - A 2 cuadras de la plaza',
    city: 'Leandro N. Alem',
    province: 'Misiones',
    country: 'Argentina',
    postalCode: '3315',
    propertyType: 'APARTMENT',
    operationType: 'RENT',
    status: 'published',
    images: JSON.stringify(['https://images.unsplash.com/photo-1502672260066-6bc35f0a1f80?w=800']),
    amenities: JSON.stringify(['ventilación cruzada', 'placard', 'expensas mínimas']),
    features: JSON.stringify(['muy luminoso', 'céntrico', 'sin mascotas']),
    currency: 'ARS',
    type: 'apartment',
    is_active: true,
    featured: false
  }
]

async function createProperties() {
  console.log('\n🏠 Creando propiedades tradicionales...\n')

  for (const property of properties) {
    try {
      // Calcular fecha de expiración (60 días desde ahora)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)

      const { data, error } = await supabase
        .from('Property')
        .insert({
          userId: USER_ID,
          agentId: USER_ID, // Usar mismo ID del usuario como agentId
          title: property.title,
          description: property.description,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          garages: property.garages,
          area: property.area,
          lotArea: property.lotArea,
          address: property.address,
          city: property.city,
          province: property.province,
          country: property.country,
          postalCode: property.postalCode,
          propertyType: property.propertyType,
          operationType: property.operationType,
          status: property.status,
          images: property.images,
          amenities: property.amenities,
          features: property.features,
          currency: property.currency,
          type: property.type,
          is_active: property.is_active,
          featured: property.featured,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select()

      if (error) {
        console.error(`❌ Error creando "${property.title}":`, error.message)
      } else {
        console.log(`✅ Creado: "${property.title}" - ${property.city} - $${property.price.toLocaleString('es-AR')}`)
      }
    } catch (err) {
      console.error(`❌ Exception creando "${property.title}":`, err.message)
    }
  }
}

async function main() {
  console.log('🚀 Iniciando creación de propiedades tradicionales...')
  console.log(`👤 Usuario: ${USER_ID}\n`)

  await createProperties()

  console.log('\n✨ Proceso completado!')
  console.log('\n📍 Propiedades creadas:')
  console.log('   • 2 en Posadas (Depto Villa Sarita, Casa Itaembé Miní)')
  console.log('   • 2 en Oberá (Depto amoblado, Casa con jardín)')
  console.log('   • 1 en Leandro N. Alem (Depto céntrico)')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error fatal:', err)
    process.exit(1)
  })
