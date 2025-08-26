import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash para password por defecto
  const defaultPassword = await bcrypt.hash('password123', 10)

  // Crear usuarios con perfiles públicos
  const user1 = await prisma.user.create({
    data: {
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@email.com',
      password: defaultPassword,
      phone: '+54 376 456-7890',
      avatar: '/users/carlos-mendoza.jpg',
      bio: 'Profesional de sistemas, trabajador responsable y cuidadoso con las propiedades. Vivo solo y mantengo todo en orden.',
      occupation: 'Desarrollador de Software',
      age: 28,
      verified: true,
      rating: 4.8,
      reviewCount: 12,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Ana García',
      email: 'ana.garcia@email.com',
      password: defaultPassword,
      phone: '+54 376 789-0123',
      avatar: '/users/ana-garcia.jpg',
      bio: 'Docente universitaria, muy ordenada y respetuosa. Busco un lugar tranquilo para vivir y estudiar.',
      occupation: 'Profesora Universitaria',
      age: 32,
      verified: true,
      rating: 4.9,
      reviewCount: 8,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      name: 'Miguel Torres',
      email: 'miguel.torres@email.com',
      password: defaultPassword,
      phone: '+54 376 234-5678',
      avatar: '/users/miguel-torres.jpg',
      bio: 'Estudiante de medicina, responsable y tranquilo. Busco un lugar cerca de la universidad.',
      occupation: 'Estudiante de Medicina',
      age: 24,
      verified: false,
      rating: 4.5,
      reviewCount: 3,
    },
  })

  const user4 = await prisma.user.create({
    data: {
      name: 'Laura Fernández',
      email: 'laura.fernandez@email.com',
      password: defaultPassword,
      phone: '+54 376 345-6789',
      avatar: '/users/laura-fernandez.jpg',
      bio: 'Contadora pública, muy organizada y puntual con los pagos. Tengo referencias laborales.',
      occupation: 'Contadora Pública',
      age: 29,
      verified: true,
      rating: 4.7,
      reviewCount: 15,
    },
  })

  // Crear historial de alquileres
  const rental1 = await prisma.rentalHistory.create({
    data: {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      monthlyRent: 45000,
      deposit: 45000,
      status: 'COMPLETED',
      tenantId: user1.id,
      propertyId: 'clpqr1234567890', // ID de ejemplo, se reemplazará con IDs reales
    },
  })

  const rental2 = await prisma.rentalHistory.create({
    data: {
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-05-31'),
      monthlyRent: 38000,
      deposit: 38000,
      status: 'COMPLETED',
      tenantId: user2.id,
      propertyId: 'clpqr1234567891', // ID de ejemplo
    },
  })

  // Crear reviews de inquilinos
  await prisma.userReview.create({
    data: {
      rating: 5,
      comment: 'Excelente inquilino. Carlos siempre pagó puntualmente, mantuvo la propiedad en perfectas condiciones y fue muy comunicativo. Lo recomiendo sin dudas.',
      category: 'TENANT',
      verified: true,
      reviewerId: user4.id, // Laura (propietaria) califica a Carlos
      reviewedId: user1.id, // Carlos (inquilino)
      rentalId: rental1.id,
    },
  })

  await prisma.userReview.create({
    data: {
      rating: 5,
      comment: 'Ana es una inquilina ejemplar. Muy cuidadosa con la propiedad, siempre mantuvo todo limpio y ordenado. Pagos siempre a tiempo.',
      category: 'TENANT',
      verified: true,
      reviewerId: user1.id, // Carlos (propietario) califica a Ana
      reviewedId: user2.id, // Ana (inquilina)
      rentalId: rental2.id,
    },
  })

  await prisma.userReview.create({
    data: {
      rating: 4,
      comment: 'Buen inquilino en general. Responsable con los pagos y cuidadoso. Solo tuvo un pequeño retraso en un pago pero se comunicó previamente.',
      category: 'TENANT',
      verified: true,
      reviewerId: user2.id, // Ana califica a Carlos
      reviewedId: user1.id, // Carlos
    },
  })

  await prisma.userReview.create({
    data: {
      rating: 5,
      comment: 'Laura es una inquilina perfecta. Profesional, ordenada y muy respetuosa. La propiedad quedó en mejores condiciones que cuando la entregué.',
      category: 'TENANT',
      verified: true,
      reviewerId: user3.id, // Miguel califica a Laura
      reviewedId: user4.id, // Laura
    },
  })

  await prisma.userReview.create({
    data: {
      rating: 4,
      comment: 'Miguel es un buen inquilino. Estudiante responsable, aunque a veces había un poco de ruido por las noches estudiando. En general, recomendable.',
      category: 'TENANT',
      verified: false,
      reviewerId: user4.id, // Laura califica a Miguel
      reviewedId: user3.id, // Miguel
    },
  })

  await prisma.userReview.create({
    data: {
      rating: 5,
      comment: 'Inquilina excepcional. Ana siempre fue muy comunicativa, pagó puntualmente y cuidó cada detalle de la propiedad. 100% recomendable.',
      category: 'TENANT',
      verified: true,
      reviewerId: user3.id, // Miguel califica a Ana
      reviewedId: user2.id, // Ana
    },
  })

  // Actualizar ratings promedio
  await prisma.user.update({
    where: { id: user1.id },
    data: { rating: 4.8, reviewCount: 3 }
  })

  await prisma.user.update({
    where: { id: user2.id },
    data: { rating: 4.9, reviewCount: 2 }
  })

  await prisma.user.update({
    where: { id: user3.id },
    data: { rating: 4.5, reviewCount: 1 }
  })

  await prisma.user.update({
    where: { id: user4.id },
    data: { rating: 4.7, reviewCount: 2 }
  })

  console.log('Users and reviews seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
