const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAvatarStorage() {
  const userId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Cesar/Baldes

  console.log('=== Checking Avatar Storage ===\n')
  console.log(`User ID: ${userId}\n`)

  try {
    // 1. Check User.avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        avatar: true
      }
    })

    console.log('✅ User.avatar:', user?.avatar || '(sin avatar)')

    // 2. Check UserProfile.avatar_url (si existe)
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        avatar_url: true
      }
    })

    if (userProfile) {
      console.log('✅ UserProfile.avatar_url:', userProfile.avatar_url || '(sin avatar)')
    } else {
      console.log('ℹ️  UserProfile: no existe')
    }

    // 3. Recomendación
    console.log('\n=== Recomendación ===')
    if (user?.userType?.toLowerCase() === 'inmobiliaria' || user?.userType?.toLowerCase() === 'agency') {
      console.log('El usuario es inmobiliaria, el avatar debería guardarse en User.avatar')
      if (userProfile && userProfile.avatar_url) {
        console.log('⚠️  WARNING: Tiene avatar en UserProfile.avatar_url también')
        console.log('   Esto puede causar confusión sobre cuál usar')
      }
    } else {
      console.log('El usuario es inquilino/busco, el avatar debería guardarse en UserProfile.avatar_url')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAvatarStorage()
