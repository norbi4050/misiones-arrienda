const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findIsCompanyField() {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE column_name = 'is_company'
    `
    console.log('Tablas con columna is_company:')
    console.log(result)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findIsCompanyField()
