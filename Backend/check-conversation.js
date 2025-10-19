const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkConversation() {
  const conversationId = 'cmgvj3n8u0001370dl4qtcnlc' // Del screenshot
  const userId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Cesar/Baldes

  console.log('=== Checking Conversation ===')
  console.log(`Conversation ID: ${conversationId}`)
  console.log(`User ID: ${userId}\n`)

  try {
    // Buscar conversación con Prisma
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        a: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                companyName: true,
                userType: true
              }
            }
          }
        },
        b: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                companyName: true,
                userType: true
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      console.log('❌ Conversación no encontrada')
      return
    }

    console.log('✅ Conversación encontrada:')
    console.log(`aId: ${conversation.aId}`)
    console.log(`bId: ${conversation.bId}\n`)

    // Buscar UserProfile del usuario actual
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    if (!userProfile) {
      console.log(`⚠️  Usuario ${userId} NO tiene UserProfile (normal para inmobiliarias)`)
      console.log('Usando user.id como userProfileId\n')
    } else {
      console.log(`✅ UserProfile encontrado: ${userProfile.id}\n`)
    }

    const userProfileId = userProfile?.id || userId

    console.log('=== Determinando el otro usuario ===')
    const otherProfileId = conversation.aId === userProfileId ? conversation.bId : conversation.aId
    console.log(`otherProfileId: ${otherProfileId}`)

    const otherProfile = conversation.aId === userProfileId ? conversation.b : conversation.a
    console.log('\nOther UserProfile:')
    console.log(JSON.stringify(otherProfile, null, 2))

    if (otherProfile?.user) {
      console.log('\n=== User data del otro usuario ===')
      console.log(JSON.stringify(otherProfile.user, null, 2))

      console.log('\n=== DisplayName Resolution ===')
      const displayName = otherProfile.user.name ||
                         otherProfile.user.companyName ||
                         otherProfile.user.email?.split('@')[0] ||
                         'Usuario'
      console.log(`displayName = "${displayName}"`)

      if (displayName === 'Comunidad') {
        console.log('\n❌ ERROR: displayName es "Comunidad"!')
      } else {
        console.log('\n✅ displayName es correcto')
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkConversation()
