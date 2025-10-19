const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugConversationState() {
  const conversationId = 'cmgvj3n8u0001370dl4qtcnlc'
  const userId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Cesar/Baldes

  console.log('=== DEBUG: Conversation State ===\n')
  console.log(`Conversation ID: ${conversationId}`)
  console.log(`User ID: ${userId}\n`)

  try {
    // 1. Verificar conversación
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
                avatar: true,
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
                avatar: true,
                userType: true
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      console.log('❌ Conversación NO encontrada')
      return
    }

    console.log('✅ Conversación encontrada')
    console.log(`  isActive: ${conversation.isActive}`)
    console.log(`  aId: ${conversation.aId}`)
    console.log(`  bId: ${conversation.bId}`)
    console.log(`  lastMessageAt: ${conversation.lastMessageAt}`)
    console.log(`  updatedAt: ${conversation.updatedAt}\n`)

    // 2. Verificar usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        userType: true
      }
    })

    if (!user) {
      console.log('❌ Usuario NO encontrado')
      return
    }

    console.log('✅ Usuario encontrado')
    console.log(`  name: ${user.name}`)
    console.log(`  email: ${user.email}`)
    console.log(`  userType: ${user.userType}`)
    console.log(`  avatar: ${user.avatar || '(sin avatar)'}\n`)

    const isInmobiliaria = user.userType?.toLowerCase() === 'inmobiliaria' ||
                           user.userType?.toLowerCase() === 'agency'

    console.log(`✅ Es inmobiliaria: ${isInmobiliaria}`)

    // 3. Si NO es inmobiliaria, verificar UserProfile
    if (!isInmobiliaria) {
      console.log('\n=== Verificando UserProfile ===')
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId }
      })

      if (!userProfile) {
        console.log('❌ UserProfile NO encontrado - ERROR: Usuario inquilino sin perfil!')
        return
      }

      console.log('✅ UserProfile encontrado')
      console.log(`  id: ${userProfile.id}`)
      console.log(`  userId: ${userProfile.userId}`)
      console.log(`  role: ${userProfile.role}`)
      console.log(`  avatar_url: ${userProfile.avatar_url || '(sin avatar)'}`)

      // Verificar si es participante
      const isParticipant = conversation.aId === userProfile.id || conversation.bId === userProfile.id
      console.log(`\n✅ Es participante de la conversación: ${isParticipant}`)
    } else {
      console.log('\n✅ Usuario inmobiliaria - usa user.id directamente como senderId')

      // Para inmobiliaria, verificar si tiene UserProfile (no debería)
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId }
      })

      if (userProfile) {
        console.log('⚠️  WARNING: Inmobiliaria tiene UserProfile - esto es inesperado')
        console.log(`  UserProfile.id: ${userProfile.id}`)
      } else {
        console.log('✅ Inmobiliaria NO tiene UserProfile (correcto)')
      }
    }

    // 4. Verificar tabla users en Supabase
    console.log('\n=== Verificando tabla users (Supabase) ===')
    const supabaseUser = await prisma.$queryRaw`
      SELECT id, name, email, user_type, avatar
      FROM users
      WHERE id = ${userId}::uuid
    `

    console.log('Supabase users result:', supabaseUser)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugConversationState()
