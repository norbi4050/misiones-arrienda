const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAllProfiles() {
  console.log('=== AUDITORIA COMPLETA DE AVATARES ===\n')

  // Buscar TODOS los UserProfiles
  const profiles = await prisma.userProfile.findMany({
    select: {
      id: true,
      userId: true,
      avatar_url: true,
      user: {
        select: {
          name: true,
          email: true,
          avatar: true
        }
      }
    },
    take: 20
  })

  console.log(`Total perfiles encontrados: ${profiles.length}\n`)

  for (const profile of profiles) {
    const hasAvatar = !!(profile.avatar_url || profile.user.avatar)

    console.log(`UserProfile ID: ${profile.id}`)
    console.log(`  Usuario: ${profile.user.name || profile.user.email}`)
    console.log(`  UserProfile.avatar_url: ${profile.avatar_url || 'NULL'}`)
    console.log(`  User.avatar: ${profile.user.avatar || 'NULL'}`)
    console.log(`  Tiene avatar: ${hasAvatar ? 'SI' : 'NO'}`)
    console.log('')
  }

  // Verificar específicamente la conversación
  console.log('\n=== VERIFICAR CONVERSACION ESPECIFICA ===\n')

  const conv = await prisma.conversation.findUnique({
    where: { id: 'cmgvj3n8u0001370dl4qtcnlc' },
    include: {
      a: {
        select: {
          id: true,
          avatar_url: true,
          user: {
            select: { name: true, avatar: true }
          }
        }
      },
      b: {
        select: {
          id: true,
          avatar_url: true,
          user: {
            select: { name: true, avatar: true }
          }
        }
      }
    }
  })

  if (conv) {
    console.log('Conversación encontrada:')
    console.log(`\nUsuario A (${conv.a.user.name}):`)
    console.log(`  avatar_url: ${conv.a.avatar_url || 'NULL'}`)
    console.log(`  User.avatar: ${conv.a.user.avatar || 'NULL'}`)

    console.log(`\nUsuario B (${conv.b.user.name}):`)
    console.log(`  avatar_url: ${conv.b.avatar_url || 'NULL'}`)
    console.log(`  User.avatar: ${conv.b.user.avatar || 'NULL'}`)
  }

  await prisma.$disconnect()
}

checkAllProfiles()
