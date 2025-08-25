import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Base de datos limpia - Sin propiedades de ejemplo
  // La plataforma está lista para usuarios reales
  
  console.log('Database cleaned - Ready for real users!')
  console.log('No sample properties or agents created.')
  console.log('Users can now register and create their own properties.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
