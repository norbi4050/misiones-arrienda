// Script para verificar datos de avatar en Supabase
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAvatarData() {
  console.log('=== AUDITORIA DE AVATARES CON PRISMA ===\n')

  try {
    // 1. Verificar conversación
    console.log('1. Buscando conversación cmgvj3n8u0001370dl4qtcnlc...')
    const conv = await prisma.conversation.findUnique({
      where: { id: 'cmgvj3n8u0001370dl4qtcnlc' },
      include: {
        a: true,
        b: true
      }
    })

    if (!conv) {
      console.log('❌ Conversación NO encontrada')
      return
    }

    console.log('✅ Conversación encontrada:')
    console.log('   aId:', conv.aId)
    console.log('   bId:', conv.bId)
    console.log('')

    // 2. Buscar Users correspondientes
    console.log('2. Buscando Users de los UserProfiles...')

    for (const profile of [conv.a, conv.b]) {
      console.log(`\n   UserProfile ${profile.id}:`)
      console.log(`      userId: ${profile.userId}`)

      const user = await prisma.user.findUnique({
        where: { id: profile.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          companyName: true
        }
      })

      if (!user) {
        console.log(`      ❌ User ${profile.userId} NO encontrado`)
      } else {
        console.log(`      ✅ User encontrado:`)
        console.log(`         name: ${user.name || 'NULL'}`)
        console.log(`         email: ${user.email}`)
        console.log(`         avatar: ${user.avatar || 'NULL'}`)
        console.log(`         companyName: ${user.companyName || 'NULL'}`)
      }
    }

    console.log('\n=== FIN AUDITORIA ===')

  } catch (error) {
    console.error('ERROR:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAvatarData()
