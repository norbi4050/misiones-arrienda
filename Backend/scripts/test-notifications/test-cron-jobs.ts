/**
 * Script: Probar Cron Jobs Manualmente
 *
 * Uso:
 *   npx tsx scripts/test-notifications/test-cron-jobs.ts
 *
 * Este script llama a los endpoints de cron jobs manualmente
 * para probar su funcionamiento sin esperar a la ejecución programada
 */

import './load-env' // Cargar variables de entorno

const BACKEND_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET || 'test-secret-123'

interface CronJobTest {
  name: string
  path: string
  schedule: string
  description: string
}

const CRON_JOBS: CronJobTest[] = [
  {
    name: 'Presence Cleanup',
    path: '/api/presence/cleanup?auth_token=1a2b3c4d5e6f7890a1b2c3d4e5f67890',
    schedule: '*/5 * * * * (cada 5 minutos)',
    description: 'Limpia estados de presencia antiguos'
  },
  {
    name: 'Check Expired Plans',
    path: '/api/cron/check-expired-plans',
    schedule: '0 1 * * * (diario a las 1:00 AM)',
    description: 'Detecta y desactiva planes expirados, envía notificaciones'
  },
  {
    name: 'Properties Expire Cleanup',
    path: '/api/properties/expire-cleanup',
    schedule: '0 2 * * * (diario a las 2:00 AM)',
    description: 'Desactiva propiedades cuya fecha de expiración ya pasó'
  },
  {
    name: 'Notify Expiring Properties',
    path: '/api/cron/notify-expiring-properties',
    schedule: '0 8 * * * (diario a las 8:00 AM)',
    description: 'Notifica propiedades que expiran en 7 días'
  },
  {
    name: 'Check Expiring Plans',
    path: '/api/cron/check-expiring-plans',
    schedule: '0 9 * * * (diario a las 9:00 AM)',
    description: 'Notifica planes que expiran en 7, 3, o 1 días'
  }
]

async function testCronJob(job: CronJobTest): Promise<void> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔄 Probando: ${job.name}`)
  console.log(`📅 Schedule: ${job.schedule}`)
  console.log(`📝 Descripción: ${job.description}`)
  console.log(`🔗 Path: ${job.path}`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    const url = `${BACKEND_URL}${job.path}`
    const headers: HeadersInit = {}

    // Agregar autorización solo si el endpoint la requiere
    if (!job.path.includes('auth_token=')) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`
    }

    console.log(`📡 Llamando a: ${url}`)
    console.log(`🔐 Headers: ${JSON.stringify(headers, null, 2)}`)

    const startTime = Date.now()
    const response = await fetch(url, {
      method: 'GET',
      headers
    })
    const duration = Date.now() - startTime

    console.log(`\n⏱️  Tiempo de respuesta: ${duration}ms`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log(`📦 Respuesta:`)
      console.log(JSON.stringify(data, null, 2))

      if (response.ok) {
        console.log(`\n✅ ${job.name} ejecutado exitosamente`)
        if (data.checked !== undefined) {
          console.log(`   📋 Revisados: ${data.checked}`)
        }
        if (data.expired !== undefined) {
          console.log(`   ⏰ Expirados: ${data.expired}`)
        }
        if (data.notified !== undefined) {
          console.log(`   📧 Notificados: ${data.notified}`)
        }
        if (data.errors && data.errors.length > 0) {
          console.log(`   ⚠️  Errores: ${data.errors.length}`)
          data.errors.forEach((err: string) => console.log(`      - ${err}`))
        }
      } else {
        console.log(`\n❌ ${job.name} falló`)
        if (data.error) {
          console.log(`   Error: ${data.error}`)
        }
      }
    } else {
      const text = await response.text()
      console.log(`📄 Respuesta (text):`)
      console.log(text.substring(0, 200))

      if (response.ok) {
        console.log(`\n✅ ${job.name} ejecutado exitosamente`)
      } else {
        console.log(`\n❌ ${job.name} falló`)
      }
    }
  } catch (error) {
    console.error(`\n❌ Error ejecutando ${job.name}:`)
    if (error instanceof Error) {
      console.error(`   ${error.message}`)
      if (error.stack) {
        console.error(`\n   Stack trace:`)
        console.error(`   ${error.stack.split('\n').slice(0, 3).join('\n   ')}`)
      }
    } else {
      console.error(`   ${String(error)}`)
    }
  }
}

async function testAllCronJobs() {
  console.log('\n🚀 INICIANDO PRUEBAS DE CRON JOBS')
  console.log('='.repeat(60))
  console.log(`🌐 Backend URL: ${BACKEND_URL}`)
  console.log(`🔐 CRON_SECRET: ${CRON_SECRET ? '***' + CRON_SECRET.slice(-4) : 'NO CONFIGURADO'}`)
  console.log('='.repeat(60))

  if (!CRON_SECRET || CRON_SECRET === 'test-secret-123') {
    console.log('\n⚠️  ADVERTENCIA: CRON_SECRET no está configurado o usa valor por defecto')
    console.log('   Las pruebas podrían fallar si el backend requiere autenticación')
    console.log('   Configura CRON_SECRET en tu archivo .env\n')
  }

  const results = {
    total: CRON_JOBS.length,
    success: 0,
    failed: 0
  }

  for (const job of CRON_JOBS) {
    try {
      await testCronJob(job)
      results.success++
      // Esperar 2 segundos entre cada prueba
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      results.failed++
      console.error(`\n❌ Error inesperado en ${job.name}:`, error)
    }
  }

  // Resumen final
  console.log('\n\n')
  console.log('='.repeat(60))
  console.log('📊 RESUMEN DE PRUEBAS')
  console.log('='.repeat(60))
  console.log(`✅ Exitosos: ${results.success}/${results.total}`)
  console.log(`❌ Fallidos: ${results.failed}/${results.total}`)

  if (results.failed === 0) {
    console.log('\n🎉 ¡Todos los cron jobs funcionan correctamente!')
  } else {
    console.log('\n⚠️  Algunos cron jobs fallaron. Revisa los detalles arriba.')
  }

  console.log('\n📝 Notas:')
  console.log('   - Los cron jobs están configurados en vercel.json')
  console.log('   - En producción, Vercel los ejecuta automáticamente')
  console.log('   - Este script es solo para pruebas manuales en desarrollo')
  console.log('   - Verifica que CRON_SECRET coincida con el configurado en Vercel')
  console.log('='.repeat(60))
}

// Función para probar un cron job específico
async function testSingleCronJob(jobName: string) {
  const job = CRON_JOBS.find(j => j.name.toLowerCase().includes(jobName.toLowerCase()))

  if (!job) {
    console.error(`❌ Cron job "${jobName}" no encontrado`)
    console.log('\n📋 Cron jobs disponibles:')
    CRON_JOBS.forEach(j => console.log(`   - ${j.name}`))
    return
  }

  await testCronJob(job)
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length > 0) {
    // Probar un cron job específico
    const jobName = args[0]
    console.log(`\n🎯 Probando cron job específico: ${jobName}\n`)
    testSingleCronJob(jobName)
  } else {
    // Probar todos los cron jobs
    testAllCronJobs()
  }
}

export { testAllCronJobs, testSingleCronJob, CRON_JOBS }
