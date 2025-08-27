import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCommunity() {
  console.log('🌱 Seeding Community data...')

  // Crear perfiles de comunidad de ejemplo
  const communityProfiles = [
    // Perfiles BUSCO
    {
      role: 'BUSCO',
      city: 'Posadas',
      neighborhood: 'Centro',
      budgetMin: 120000,
      budgetMax: 180000,
      bio: 'Estudiante de medicina, busco habitación tranquila cerca de la universidad. Soy ordenado y responsable.',
      age: 22,
      petPref: 'SI_PET',
      smokePref: 'NO_FUMADOR',
      diet: 'VEGETARIANO',
      scheduleNotes: 'Estudio de mañana, trabajo de tarde',
      tags: ['estudiante', 'ordenado', 'responsable', 'tranquilo'],
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'
      ]
    },
    {
      role: 'BUSCO',
      city: 'Oberá',
      neighborhood: 'Villa Bonita',
      budgetMin: 80000,
      budgetMax: 120000,
      bio: 'Profesional joven, trabajo en sistemas. Busco compañeros de casa para compartir gastos.',
      age: 28,
      petPref: 'INDIFERENTE',
      smokePref: 'NO_FUMADOR',
      diet: 'NINGUNA',
      scheduleNotes: 'Trabajo remoto, horarios flexibles',
      tags: ['profesional', 'sistemas', 'sociable', 'limpio'],
      photos: [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
      ]
    },
    {
      role: 'BUSCO',
      city: 'Posadas',
      neighborhood: 'Itaembé Guazú',
      budgetMin: 100000,
      budgetMax: 150000,
      bio: 'Artista y diseñadora gráfica. Me gusta el ambiente creativo y relajado.',
      age: 25,
      petPref: 'SI_PET',
      smokePref: 'INDIFERENTE',
      diet: 'VEGANO',
      scheduleNotes: 'Trabajo desde casa, horarios variables',
      tags: ['artista', 'creativa', 'relajada', 'vegana'],
      photos: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'
      ]
    },
    {
      role: 'BUSCO',
      city: 'Oberá',
      neighborhood: 'Centro',
      budgetMin: 90000,
      budgetMax: 140000,
      bio: 'Estudiante de ingeniería, muy dedicado a los estudios. Busco ambiente tranquilo.',
      age: 20,
      petPref: 'NO_PET',
      smokePref: 'NO_FUMADOR',
      diet: 'NINGUNA',
      scheduleNotes: 'Clases de mañana, estudio de tarde/noche',
      tags: ['estudiante', 'ingeniería', 'estudioso', 'tranquilo'],
      photos: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'
      ]
    },
    {
      role: 'BUSCO',
      city: 'Posadas',
      neighborhood: 'Villa Cabello',
      budgetMin: 110000,
      budgetMax: 160000,
      bio: 'Profesora de educación física, me gusta mantenerme activa. Busco compañeros con estilo de vida saludable.',
      age: 26,
      petPref: 'SI_PET',
      smokePref: 'NO_FUMADOR',
      diet: 'NINGUNA',
      scheduleNotes: 'Trabajo de mañana, entreno de tarde',
      tags: ['profesora', 'deportista', 'saludable', 'activa'],
      photos: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face'
      ]
    },

    // Perfiles OFREZCO
    {
      role: 'OFREZCO',
      city: 'Posadas',
      neighborhood: 'Centro',
      budgetMin: 150000,
      budgetMax: 200000,
      bio: 'Tengo una casa grande en el centro, busco compañeros responsables para compartir. Ambiente familiar.',
      age: 32,
      petPref: 'SI_PET',
      smokePref: 'NO_FUMADOR',
      diet: 'NINGUNA',
      scheduleNotes: 'Trabajo de oficina, horarios normales',
      tags: ['propietario', 'responsable', 'familiar', 'acogedor'],
      photos: [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face'
      ]
    },
    {
      role: 'OFREZCO',
      city: 'Oberá',
      neighborhood: 'Villa Bonita',
      budgetMin: 120000,
      budgetMax: 160000,
      bio: 'Departamento amplio con 3 habitaciones. Busco estudiantes o profesionales jóvenes.',
      age: 29,
      petPref: 'INDIFERENTE',
      smokePref: 'NO_FUMADOR',
      diet: 'NINGUNA',
      scheduleNotes: 'Trabajo en comercio, horarios rotativos',
      tags: ['joven', 'flexible', 'comerciante', 'sociable'],
      photos: [
        'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face'
      ]
    },
    {
      role: 'OFREZCO',
      city: 'Posadas',
      neighborhood: 'Itaembé Guazú',
      budgetMin: 130000,
      budgetMax: 180000,
      bio: 'Casa con patio grande, ideal para quienes tienen mascotas. Ambiente relajado y natural.',
      age: 35,
      petPref: 'SI_PET',
      smokePref: 'INDIFERENTE',
      diet: 'VEGETARIANO',
      scheduleNotes: 'Trabajo desde casa, muy flexible',
      tags: ['naturaleza', 'mascotas', 'patio', 'relajado'],
      photos: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face'
      ]
    },
    {
      role: 'OFREZCO',
      city: 'Oberá',
      neighborhood: 'Centro',
      budgetMin: 100000,
      budgetMax: 140000,
      bio: 'Habitaciones disponibles en casa familiar. Perfecto para estudiantes que buscan ambiente hogareño.',
      age: 45,
      petPref: 'NO_PET',
      smokePref: 'NO_FUMADOR',
      diet: 'NINGUNA',
      scheduleNotes: 'Ama de casa, siempre disponible',
      tags: ['familiar', 'maternal', 'hogareño', 'cuidadosa'],
      photos: [
        'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face'
      ]
    },
    {
      role: 'OFREZCO',
      city: 'Posadas',
      neighborhood: 'Villa Cabello',
      budgetMin: 140000,
      budgetMax: 190000,
      bio: 'Loft moderno con espacios compartidos amplios. Ideal para profesionales creativos.',
      age: 31,
      petPref: 'INDIFERENTE',
      smokePref: 'INDIFERENTE',
      diet: 'NINGUNA',
      scheduleNotes: 'Arquitecto, horarios variables',
      tags: ['moderno', 'creativo', 'arquitecto', 'espacioso'],
      photos: [
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face'
      ]
    }
  ]

  // Crear usuarios base para los perfiles de comunidad
  const users = []
  for (let i = 0; i < communityProfiles.length; i++) {
    const profile = communityProfiles[i]
    const user = await prisma.user.create({
      data: {
        name: `Usuario Comunidad ${i + 1}`,
        email: `comunidad${i + 1}@misionesarrienda.com`,
        phone: `+54 376 ${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        verified: true,
        emailVerified: true,
        userType: 'inquilino'
      }
    })
    users.push(user)
  }

  // Crear perfiles de comunidad
  const createdProfiles = []
  for (let i = 0; i < communityProfiles.length; i++) {
    const profileData = communityProfiles[i]
    const user = users[i]
    
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        role: profileData.role as any,
        city: profileData.city,
        neighborhood: profileData.neighborhood,
        budgetMin: profileData.budgetMin,
        budgetMax: profileData.budgetMax,
        bio: profileData.bio,
        photos: profileData.photos,
        age: profileData.age,
        petPref: profileData.petPref as any,
        smokePref: profileData.smokePref as any,
        diet: profileData.diet as any,
        scheduleNotes: profileData.scheduleNotes,
        tags: profileData.tags,
        acceptsMessages: true
      }
    })
    createdProfiles.push(profile)
  }

  // Crear habitaciones para los perfiles que OFREZCO
  const offerProfiles = createdProfiles.filter(p => p.role === 'OFREZCO')
  
  for (const profile of offerProfiles) {
    // Crear 1-2 habitaciones por perfil que ofrece
    const roomCount = Math.floor(Math.random() * 2) + 1
    
    for (let i = 0; i < roomCount; i++) {
      await prisma.room.create({
        data: {
          ownerId: profile.id,
          title: `Habitación ${i + 1} - ${profile.city}`,
          description: `Habitación cómoda en ${profile.neighborhood}, ${profile.city}. Incluye todos los servicios básicos.`,
          price: Math.floor(Math.random() * (profile.budgetMax - profile.budgetMin)) + profile.budgetMin,
          city: profile.city,
          neighborhood: profile.neighborhood,
          type: i === 0 ? 'PRIVADA' : 'COMPARTIDA',
          amenities: ['wifi', 'aire_acondicionado', 'cocina_compartida', 'baño_compartido', 'lavanderia'],
          photos: [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
          ],
          rules: 'No fiestas después de las 22hs. Mantener espacios comunes limpios.',
          isActive: true
        }
      })
    }
  }

  // Crear algunos likes entre perfiles
  const allProfiles = createdProfiles
  for (let i = 0; i < 8; i++) {
    const fromProfile = allProfiles[Math.floor(Math.random() * allProfiles.length)]
    const toProfile = allProfiles[Math.floor(Math.random() * allProfiles.length)]
    
    if (fromProfile.id !== toProfile.id) {
      try {
        await prisma.like.create({
          data: {
            fromId: fromProfile.id,
            toId: toProfile.id
          }
        })
      } catch (error) {
        // Ignorar errores de duplicados
      }
    }
  }

  // Crear algunas conversaciones y mensajes
  const buscoProfiles = createdProfiles.filter(p => p.role === 'BUSCO')
  const ofrezcoProfiles = createdProfiles.filter(p => p.role === 'OFREZCO')
  
  for (let i = 0; i < 3; i++) {
    const buscoProfile = buscoProfiles[i % buscoProfiles.length]
    const ofrezcoProfile = ofrezcoProfiles[i % ofrezcoProfiles.length]
    
    const conversation = await prisma.conversation.create({
      data: {
        aId: buscoProfile.id,
        bId: ofrezcoProfile.id,
        isActive: true,
        lastMessageAt: new Date()
      }
    })
    
    // Crear algunos mensajes
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: buscoProfile.id,
        body: '¡Hola! Me interesa mucho tu propuesta. ¿Podríamos coordinar para conocernos?',
        isRead: true
      }
    })
    
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: ofrezcoProfile.id,
        body: '¡Por supuesto! ¿Qué tal si nos encontramos este fin de semana? Te puedo mostrar la casa.',
        isRead: false
      }

export default seedCommunity

// Ejecutar si se llama directamente
if (require.main === module) {
  seedCommunity()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
