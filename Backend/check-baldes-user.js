const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBaldesUser() {
  console.log('=== Checking Baldes (inmobiliaria) User ===\n')

  try {
    // Buscar usuario con companyName = "Baldes"
    const user = await prisma.user.findFirst({
      where: {
        companyName: {
          contains: 'Baldes',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        avatar: true,
        userType: true,
      }
    })

    if (!user) {
      console.log('❌ No se encontró usuario con companyName "Baldes"')

      // Buscar por email norbi4050
      const userByEmail = await prisma.user.findFirst({
        where: {
          email: {
            contains: 'norbi4050',
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          avatar: true,
          userType: true,
        }
      })

      if (userByEmail) {
        console.log('✅ Usuario encontrado por email:')
        console.log(JSON.stringify(userByEmail, null, 2))
      }
      return
    }

    console.log('✅ Usuario encontrado:')
    console.log(JSON.stringify(user, null, 2))

    console.log('\n=== Verificando displayName logic ===')
    console.log('¿Tiene user.name?', user.name ? `SÍ: "${user.name}"` : 'NO')
    console.log('¿Tiene user.companyName?', user.companyName ? `SÍ: "${user.companyName}"` : 'NO')

    console.log('\n=== Resultado de displayName ===')
    const displayName = user.name || user.companyName || user.email?.split('@')[0] || 'Usuario'
    console.log(`displayName = "${displayName}"`)

    if (displayName === 'Comunidad') {
      console.log('\n❌ ERROR: displayName es "Comunidad" - esto es incorrecto!')
    } else {
      console.log('\n✅ displayName es correcto')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBaldesUser()
