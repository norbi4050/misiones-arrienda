import { PrismaClient, PropertyType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample agents
  const agent1 = await prisma.agent.upsert({
    where: { email: 'juan.perez@misiones-arrienda.com' },
    update: {},
    create: {
      name: 'Juan Pérez',
      email: 'juan.perez@misiones-arrienda.com',
      phone: '+54 376 123456',
      license: 'LIC-001',
      bio: 'Agente inmobiliario con más de 10 años de experiencia en Misiones.',
      rating: 4.8,
      reviewCount: 25,
    },
  })

  const agent2 = await prisma.agent.upsert({
    where: { email: 'maria.gonzalez@misiones-arrienda.com' },
    update: {},
    create: {
      name: 'María González',
      email: 'maria.gonzalez@misiones-arrienda.com',
      phone: '+54 376 789012',
      license: 'LIC-002',
      bio: 'Especialista en propiedades comerciales y residenciales.',
      rating: 4.6,
      reviewCount: 18,
    },
  })

  // Create sample properties
  const properties = [
    {
      title: 'Hermoso departamento en el centro',
      description: 'Departamento moderno de 2 dormitorios en el corazón de Posadas. Cuenta con todas las comodidades y excelente ubicación.',
      price: 85000,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      area: 75,
      address: 'Av. Corrientes 1234',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      propertyType: PropertyType.APARTMENT,
      images: ['/placeholder-apartment-1.jpg'],
      amenities: ['Aire acondicionado', 'Balcón', 'Portero'],
      features: ['Luminoso', 'Céntrico', 'Amoblado'],
      featured: true,
      agentId: agent1.id,
    },
    {
      title: 'Casa familiar con jardín',
      description: 'Amplia casa de 3 dormitorios con hermoso jardín. Ideal para familias que buscan tranquilidad.',
      price: 150000,
      bedrooms: 3,
      bathrooms: 2,
      garages: 2,
      area: 120,
      lotArea: 300,
      address: 'Calle San Martín 567',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      propertyType: PropertyType.HOUSE,
      images: ['/placeholder-house-1.jpg'],
      amenities: ['Jardín', 'Parrilla', 'Garage'],
      features: ['Amplia', 'Luminosa', 'Tranquila'],
      featured: false,
      agentId: agent1.id,
    },
    {
      title: 'Monoambiente moderno',
      description: 'Monoambiente completamente equipado en zona céntrica. Perfecto para estudiantes o profesionales.',
      price: 45000,
      bedrooms: 1,
      bathrooms: 1,
      garages: 0,
      area: 35,
      address: 'Av. Mitre 890',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      propertyType: PropertyType.APARTMENT,
      images: ['/placeholder-apartment-2.jpg'],
      amenities: ['Aire acondicionado', 'Cocina equipada'],
      features: ['Moderno', 'Céntrico', 'Equipado'],
      featured: false,
      agentId: agent2.id,
    },
    {
      title: 'Casa amplia con pileta',
      description: 'Hermosa casa de 4 dormitorios con pileta y amplio parque. Ubicada en barrio residencial.',
      price: 220000,
      bedrooms: 4,
      bathrooms: 3,
      garages: 2,
      area: 180,
      lotArea: 500,
      address: 'Barrio Itaembé Guazú',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      propertyType: PropertyType.HOUSE,
      images: ['/placeholder-house-2.jpg'],
      amenities: ['Pileta', 'Parrilla', 'Jardín', 'Garage doble'],
      features: ['Amplia', 'Con pileta', 'Barrio residencial'],
      featured: true,
      agentId: agent2.id,
    },
    {
      title: 'Departamento de lujo',
      description: 'Exclusivo departamento de 3 dormitorios con vista al río. Terminaciones de primera calidad.',
      price: 120000,
      bedrooms: 3,
      bathrooms: 2,
      garages: 1,
      area: 95,
      address: 'Costanera Norte 456',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      propertyType: PropertyType.APARTMENT,
      images: ['/placeholder-apartment-3.jpg'],
      amenities: ['Vista al río', 'Aire acondicionado', 'Balcón'],
      features: ['Lujo', 'Vista al río', 'Céntrico'],
      featured: false,
      agentId: agent1.id,
    },
    {
      title: 'Casa en Eldorado',
      description: 'Casa de 3 dormitorios en Eldorado. Excelente ubicación y precio.',
      price: 95000,
      bedrooms: 3,
      bathrooms: 2,
      garages: 1,
      area: 110,
      lotArea: 250,
      address: 'Calle Principal 123',
      city: 'Eldorado',
      province: 'Misiones',
      postalCode: '3380',
      propertyType: PropertyType.HOUSE,
      images: ['/placeholder-house-1.jpg'],
      amenities: ['Jardín', 'Garage'],
      features: ['Tranquila', 'Bien ubicada'],
      featured: false,
      agentId: agent2.id,
    },
  ]

  for (const property of properties) {
    try {
      await prisma.property.create({
        data: property,
      })
    } catch (error) {
      console.log(`Property ${property.title} already exists or error occurred:`, error)
    }
  }

  console.log('Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
