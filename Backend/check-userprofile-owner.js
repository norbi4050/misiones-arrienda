const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUserProfileOwner() {
  const userProfileId = 'up_59263b34-8563-4e53-b249-42e6eeba4772'

  const profile = await prisma.userProfile.findUnique({
    where: { id: userProfileId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          userType: true
        }
      }
    }
  })

  console.log('UserProfile:', JSON.stringify(profile, null, 2))

  await prisma.$disconnect()
}

checkUserProfileOwner()
