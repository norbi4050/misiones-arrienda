import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample users first
  const user1 = await prisma.user.create({
    data: {
      name: 'María González',
      email: 'maria.gonzalez@example.com',
      phone: '+54 376 111111',
      password: 'hashed_password_1', // In real app, this should be properly hashed
      verified: true,
      emailVerified: true,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@example.com',
      phone: '+54 376 222222',
      password: 'hashed_password_2', // In real app, this should be properly hashed
      verified: true,
      emailVerified: true,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      name: 'Ana Martínez',
      email: 'ana.martinez@example.com',
      phone: '+54 376 333333',
      password: 'hashed_password_3', // In real app, this should be properly hashed
      verified: true,
      emailVerified: true,
    },
  })

  // Create agents
  const agent1 = await prisma.agent.create({
    data: {
      name: 'María González',
      email: 'maria.gonzalez@misionesarrienda.com',
      phone: '+54 376 123-4567',
      avatar: '/agents/maria-gonzalez.jpg',
      bio: 'Especialista en propiedades residenciales con más de 10 años de experiencia en el mercado inmobiliario de Misiones.',
      license: 'CUCICBA-12345',
      rating: 4.8,
      reviewCount: 127,
    },
  })

  const agent2 = await prisma.agent.create({
    data: {
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@misionesarrienda.com',
      phone: '+54 376 987-6543',
      avatar: '/agents/carlos-rodriguez.jpg',
      bio: 'Experto en propiedades comerciales y de inversión. Conocimiento profundo del mercado de Posadas y alrededores.',
      license: 'CUCICBA-67890',
      rating: 4.9,
      reviewCount: 89,
    },
  })

  // Create properties individually with userId
  const properties = [
    {
      title: 'Casa familiar en Eldorado',
      description: 'Hermosa casa de 3 dormitorios con amplio jardín, perfecta para familias. Ubicada en zona residencial tranquila de Eldorado.',
      price: 320000,
      oldPrice: 350000,
      bedrooms: 3,
      bathrooms: 2,
      garages: 2,
      area: 180,
      lotArea: 600,
      address: 'Av. San Martín 1234',
      city: 'Eldorado',
      province: 'Misiones',
      postalCode: '3380',
      latitude: -26.4009,
      longitude: -54.6156,
      propertyType: 'HOUSE',
      status: 'AVAILABLE',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop'
      ]),
      amenities: JSON.stringify([
        'Jardín',
        'Parrilla',
        'Cochera doble',
        'Lavadero'
      ]),
      features: JSON.stringify([
        'Cocina integrada',
        'Living comedor',
        'Dormitorio principal en suite',
        'Patio trasero'
      ]),
      yearBuilt: 2018,
      featured: true,
      userId: user1.id,
      agentId: agent1.id,
    },
    {
      title: 'Departamento moderno en Posadas',
      description: 'Departamento de 2 dormitorios en el centro de Posadas, con todas las comodidades modernas y excelente ubicación.',
      price: 180000,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      area: 85,
      address: 'Calle Córdoba 567',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      latitude: -27.3621,
      longitude: -55.8981,
      propertyType: 'APARTMENT',
      status: 'AVAILABLE',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'
      ]),
      amenities: JSON.stringify([
        'Balcón',
        'Cochera',
        'Portero eléctrico',
        'Ascensor'
      ]),
      features: JSON.stringify([
        'Cocina equipada',
        'Living comedor',
        'Dormitorio principal con placard',
        'Baño completo'
      ]),
      yearBuilt: 2020,
      floor: 3,
      totalFloors: 8,
      featured: true,
      userId: user2.id,
      agentId: agent2.id,
    },
    {
      title: 'Casa con piscina en Posadas',
      description: 'Amplia casa de 4 dormitorios con piscina y quincho, ideal para entretenimiento familiar.',
      price: 450000,
      bedrooms: 4,
      bathrooms: 3,
      garages: 2,
      area: 250,
      lotArea: 800,
      address: 'Barrio Villa Cabello, Calle 123',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      latitude: -27.3676,
      longitude: -55.8947,
      propertyType: 'HOUSE',
      status: 'AVAILABLE',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
      ]),
      amenities: JSON.stringify([
        'Piscina',
        'Quincho',
        'Jardín amplio',
        'Cochera doble'
      ]),
      features: JSON.stringify([
        'Cocina grande',
        'Living comedor',
        'Suite principal',
        'Dormitorios con placard'
      ]),
      yearBuilt: 2015,
      featured: false,
      userId: user1.id,
      agentId: agent1.id,
    },
    {
      title: 'Departamento céntrico',
      description: 'Departamento de 1 dormitorio en pleno centro de Posadas, perfecto para profesionales jóvenes.',
      price: 120000,
      bedrooms: 1,
      bathrooms: 1,
      garages: 0,
      area: 45,
      address: 'Av. Mitre 890',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      latitude: -27.3663,
      longitude: -55.8960,
      propertyType: 'APARTMENT',
      status: 'AVAILABLE',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'
      ]),
      amenities: JSON.stringify([
        'Balcón',
        'Portero eléctrico'
      ]),
      features: JSON.stringify([
        'Cocina americana',
        'Living integrado',
        'Dormitorio con placard'
      ]),
      yearBuilt: 2019,
      floor: 2,
      totalFloors: 5,
      featured: false,
      userId: user2.id,
      agentId: agent2.id,
    },
    {
      title: 'Casa quinta en Eldorado',
      description: 'Hermosa casa quinta con amplio terreno, ideal para descanso y recreación familiar.',
      price: 280000,
      bedrooms: 3,
      bathrooms: 2,
      garages: 1,
      area: 160,
      lotArea: 1200,
      address: 'Ruta Provincial 17, Km 5',
      city: 'Eldorado',
      province: 'Misiones',
      postalCode: '3380',
      latitude: -26.3987,
      longitude: -54.6234,
      propertyType: 'HOUSE',
      status: 'AVAILABLE',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'
      ]),
      amenities: JSON.stringify([
        'Terreno amplio',
        'Árboles frutales',
        'Pozo de agua',
        'Galpón'
      ]),
      features: JSON.stringify([
        'Cocina rústica',
        'Living con hogar',
        'Dormitorios amplios',
        'Galería'
      ]),
      yearBuilt: 2010,
      featured: false,
      userId: user3.id,
      agentId: agent1.id,
    },
    {
      title: 'Departamento con vista al río',
      description: 'Exclusivo departamento con vista panorámica al río Paraná, en el mejor barrio de Posadas.',
      price: 350000,
      bedrooms: 3,
      bathrooms: 2,
      garages: 2,
      area: 120,
      address: 'Costanera Sur 456',
      city: 'Posadas',
      province: 'Misiones',
      postalCode: '3300',
      latitude: -27.3598,
      longitude: -55.8934,
      propertyType: 'APARTMENT',
      status: 'AVAILABLE',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop'
      ]),
      amenities: JSON.stringify([
        'Vista al río',
        'Balcón amplio',
        'Cochera doble',
        'Portero 24hs',
        'Piscina del edificio'
      ]),
      features: JSON.stringify([
        'Cocina de diseño',
        'Living comedor amplio',
        'Suite principal',
        'Toilette'
      ]),
      yearBuilt: 2021,
      floor: 8,
      totalFloors: 12,
      featured: true,
      userId: user3.id,
      agentId: agent2.id,
    },
  ]

  // Create each property individually
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
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
