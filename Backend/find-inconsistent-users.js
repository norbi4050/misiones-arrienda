const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findInconsistentUsers() {
  console.log('=== Buscando usuarios con inconsistencias ===\n')

  try {
    // Buscar todos los usuarios con userType inmobiliaria o agency
    const inmobiliarias = await prisma.user.findMany({
      where: {
        OR: [
          { userType: { contains: 'inmobiliaria', mode: 'insensitive' } },
          { userType: { contains: 'agency', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        communityProfile: {
          select: {
            id: true,
            role: true,
            city: true,
            createdAt: true
          }
        }
      }
    })

    console.log(`✅ Encontradas ${inmobiliarias.length} inmobiliarias\n`)

    // Filtrar las que tienen UserProfile
    const inconsistent = inmobiliarias.filter(u => u.communityProfile !== null)

    if (inconsistent.length === 0) {
      console.log('✅ No hay inconsistencias - todas las inmobiliarias están correctas')
      return
    }

    console.log(`❌ INCONSISTENCIA DETECTADA: ${inconsistent.length} inmobiliarias tienen UserProfile\n`)

    inconsistent.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   userType: ${user.userType}`)
      console.log(`   UserProfile ID: ${user.communityProfile.id}`)
      console.log(`   UserProfile role: ${user.communityProfile.role}`)
      console.log(`   UserProfile creado: ${user.communityProfile.createdAt}`)
    })

    console.log('\n\n=== RECOMENDACIÓN ===')
    console.log('Estas inmobiliarias tienen UserProfile (probablemente cambiaron de inquilino a inmobiliaria)')
    console.log('Opciones:')
    console.log('  1. Eliminar los UserProfile (puede romper conversaciones existentes)')
    console.log('  2. Mantener los UserProfile pero actualizar el código (solución actual)')
    console.log('  3. Migrar las conversaciones a usar user.id en lugar de UserProfile.id')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findInconsistentUsers()
