/**
 * Script: Generar Previsualizaciones de Templates de Email
 *
 * Uso:
 *   npx tsx scripts/test-notifications/generate-email-previews.ts
 *
 * Este script genera archivos HTML estáticos con los templates de email
 * para poder visualizarlos en el navegador sin enviar emails reales
 */

import fs from 'fs'
import path from 'path'
import {
  getWelcomeEmailTemplate,
  getNewMessageEmailTemplate,
  getInquiryReceivedEmailTemplate,
  getPropertyStatusChangedEmailTemplate,
  getLikeReceivedEmailTemplate,
  getPaymentCompletedEmailTemplate,
  getNewPropertyInAreaEmailTemplate
} from '../../src/lib/email-templates'

const OUTPUT_DIR = path.join(__dirname, 'email-previews')

// Crear directorio de salida si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function saveTemplate(filename: string, html: string) {
  const filePath = path.join(OUTPUT_DIR, filename)
  fs.writeFileSync(filePath, html, 'utf-8')
  console.log(`✅ Generado: ${filename}`)
}

async function generateAllPreviews() {
  console.log('🎨 GENERANDO PREVISUALIZACIONES DE EMAIL TEMPLATES')
  console.log('==================================================\n')

  // 1. WELCOME - Inmobiliaria
  const welcomeInmo = getWelcomeEmailTemplate({
    userName: 'Inmobiliaria Del Centro',
    userType: 'inmobiliaria',
    ctaUrl: 'https://misionesarrienda.com/mi-empresa',
    ctaText: 'Ir a mi empresa'
  })
  saveTemplate('01-welcome-inmobiliaria.html', welcomeInmo)

  // 2. WELCOME - Dueño directo
  const welcomeOwner = getWelcomeEmailTemplate({
    userName: 'Juan Pérez',
    userType: 'dueno_directo',
    ctaUrl: 'https://misionesarrienda.com/properties',
    ctaText: 'Explorar propiedades'
  })
  saveTemplate('02-welcome-dueno-directo.html', welcomeOwner)

  // 3. WELCOME - Inquilino
  const welcomeTenant = getWelcomeEmailTemplate({
    userName: 'María García',
    userType: 'inquilino',
    ctaUrl: 'https://misionesarrienda.com/properties',
    ctaText: 'Explorar propiedades'
  })
  saveTemplate('03-welcome-inquilino.html', welcomeTenant)

  // 4. NEW_MESSAGE
  const newMessage = getNewMessageEmailTemplate({
    recipientName: 'Juan Pérez',
    senderName: 'Laura Martínez',
    senderAvatar: 'https://avatar.vercel.sh/laura',
    messagePreview: 'Hola Juan, vi tu propiedad en Posadas Centro y me gustaría coordinar una visita. ¿Tienes disponibilidad esta semana?',
    propertyTitle: 'Casa 3 dormitorios en Posadas Centro',
    ctaUrl: 'https://misionesarrienda.com/messages/conv123',
    ctaText: 'Responder mensaje'
  })
  saveTemplate('04-new-message.html', newMessage)

  // 5. MESSAGE_REPLY
  const messageReply = getNewMessageEmailTemplate({
    recipientName: 'Laura Martínez',
    senderName: 'Juan Pérez',
    senderAvatar: 'https://avatar.vercel.sh/juan',
    messagePreview: 'Hola Laura, claro que sí. ¿Te viene bien el sábado a las 10 AM? La propiedad está en excelente estado.',
    propertyTitle: 'Casa 3 dormitorios en Posadas Centro',
    ctaUrl: 'https://misionesarrienda.com/messages/conv123',
    ctaText: 'Ver conversación',
    isReply: true
  })
  saveTemplate('05-message-reply.html', messageReply)

  // 6. INQUIRY_RECEIVED
  const inquiryReceived = getInquiryReceivedEmailTemplate({
    recipientName: 'Pedro López',
    inquirerName: 'Carolina Rodríguez',
    inquirerEmail: 'carolina@example.com',
    inquirerPhone: '+54 3764 456789',
    propertyTitle: 'Departamento 2 ambientes en Centro',
    inquiryMessage: '¿La propiedad cuenta con cochera? ¿Cuál es el costo de las expensas mensuales? ¿Acepta mascotas?',
    ctaUrl: 'https://misionesarrienda.com/mi-cuenta/consultas/prop456',
    ctaText: 'Ver consulta completa'
  })
  saveTemplate('06-inquiry-received.html', inquiryReceived)

  // 7. PROPERTY_STATUS_CHANGED - Publicada
  const propertyPublished = getPropertyStatusChangedEmailTemplate({
    recipientName: 'Ana González',
    propertyTitle: 'Casa 4 dormitorios con piscina',
    oldStatus: 'DRAFT',
    newStatus: 'PUBLISHED',
    ctaUrl: 'https://misionesarrienda.com/mi-cuenta/publicaciones/prop789',
    ctaText: 'Ver propiedad'
  })
  saveTemplate('07-property-published.html', propertyPublished)

  // 8. PROPERTY_STATUS_CHANGED - Vendida
  const propertySold = getPropertyStatusChangedEmailTemplate({
    recipientName: 'Roberto Martínez',
    propertyTitle: 'Terreno 500m² en Avenida Principal',
    oldStatus: 'PUBLISHED',
    newStatus: 'SOLD',
    ctaUrl: 'https://misionesarrienda.com/mi-cuenta/publicaciones/prop101',
    ctaText: 'Ver detalles'
  })
  saveTemplate('08-property-sold.html', propertySold)

  // 9. LIKE_RECEIVED
  const likeReceived = getLikeReceivedEmailTemplate({
    recipientName: 'Mónica Ruiz',
    likerName: 'Diego Fernández',
    likerAvatar: 'https://avatar.vercel.sh/diego',
    postTitle: 'Busco departamento 2 ambientes en zona céntrica',
    ctaUrl: 'https://misionesarrienda.com/comunidad/publicaciones/post555',
    ctaText: 'Ver publicación'
  })
  saveTemplate('09-like-received.html', likeReceived)

  // 10. PAYMENT_COMPLETED - Destacar propiedad
  const paymentFeature = getPaymentCompletedEmailTemplate({
    recipientName: 'Inmobiliaria Premium',
    amount: 5000,
    currency: 'ARS',
    paymentMethod: 'Tarjeta de crédito',
    paymentId: 'MP-12345678',
    paymentType: 'feature',
    propertyTitle: 'Oficina comercial 80m² en Centro',
    featureExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ctaUrl: 'https://misionesarrienda.com/mi-cuenta/publicaciones',
    ctaText: 'Ver mis publicaciones'
  })
  saveTemplate('10-payment-feature.html', paymentFeature)

  // 11. PAYMENT_COMPLETED - Suscripción Premium
  const paymentSubscription = getPaymentCompletedEmailTemplate({
    recipientName: 'Inmobiliaria Del Norte',
    amount: 15000,
    currency: 'ARS',
    paymentMethod: 'Tarjeta de débito',
    paymentId: 'MP-87654321',
    paymentType: 'subscription',
    plan: 'premium',
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ctaUrl: 'https://misionesarrienda.com/mi-empresa/planes',
    ctaText: 'Ver mi plan'
  })
  saveTemplate('11-payment-subscription.html', paymentSubscription)

  // 12. PROPERTY_EXPIRING
  const propertyExpiring = getNewPropertyInAreaEmailTemplate({
    recipientName: 'Silvana Torres',
    title: 'Tu propiedad expira pronto',
    message: 'Tu publicación "Local comercial en Avenida Uruguay" expirará en 7 días.',
    propertyTitle: 'Local comercial en Avenida Uruguay',
    city: 'Posadas',
    operationType: 'ALQUILER',
    price: 120000,
    propertyType: 'local',
    ctaUrl: 'https://misionesarrienda.com/mi-cuenta/publicaciones/prop202',
    ctaText: 'Renovar publicación',
    isExpiring: true
  })
  saveTemplate('12-property-expiring.html', propertyExpiring)

  // 13. NEW_PROPERTY_IN_AREA
  const newPropertyInArea = getNewPropertyInAreaEmailTemplate({
    recipientName: 'Carlos Benítez',
    title: 'Nueva propiedad en Posadas',
    message: 'Se publicó un departamento en ALQUILER en Posadas que puede interesarte.',
    propertyTitle: 'Departamento 3 ambientes con balcón',
    city: 'Posadas',
    operationType: 'ALQUILER',
    price: 95000,
    propertyType: 'departamento',
    ctaUrl: 'https://misionesarrienda.com/propiedades/prop303',
    ctaText: 'Ver propiedad'
  })
  saveTemplate('13-new-property-in-area.html', newPropertyInArea)

  // 14. PLAN_EXPIRING
  const planExpiring = getPaymentCompletedEmailTemplate({
    recipientName: 'Inmobiliaria Central',
    title: 'Tu plan expira pronto',
    message: 'Tu plan Premium expirará en 3 días. Renueva ahora para mantener tus beneficios.',
    plan: 'premium',
    expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 3,
    ctaUrl: 'https://misionesarrienda.com/planes',
    ctaText: 'Renovar Plan',
    isExpiring: true
  })
  saveTemplate('14-plan-expiring.html', planExpiring)

  // 15. PLAN_EXPIRED
  const planExpired = getPaymentCompletedEmailTemplate({
    recipientName: 'Inmobiliaria Sur',
    title: 'Tu plan ha expirado',
    message: 'Tu plan Premium expiró el 22/10/2025. Has sido cambiado al plan gratuito.',
    plan: 'premium',
    newPlan: 'free',
    expirationDate: new Date().toISOString(),
    ctaUrl: 'https://misionesarrienda.com/mi-empresa/planes',
    ctaText: 'Ver Planes',
    isExpired: true
  })
  saveTemplate('15-plan-expired.html', planExpired)

  // Generar índice HTML
  const indexHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Templates - Misiones Arrienda</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #1e293b;
      font-size: 2.5rem;
      margin-bottom: 10px;
      text-align: center;
    }
    .subtitle {
      color: #64748b;
      text-align: center;
      margin-bottom: 40px;
      font-size: 1.1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .card {
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      transition: all 0.3s ease;
      background: #f8fafc;
    }
    .card:hover {
      border-color: #2563eb;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
      transform: translateY(-4px);
    }
    .card h3 {
      color: #1e293b;
      font-size: 1.2rem;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card p {
      color: #64748b;
      margin-bottom: 16px;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .card a {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    .card a:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
    .icon {
      font-size: 1.5rem;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 40px;
      padding: 20px;
      background: #f1f5f9;
      border-radius: 12px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      color: #64748b;
      font-size: 0.9rem;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email Templates</h1>
    <p class="subtitle">Misiones Arrienda - Sistema de Notificaciones</p>

    <div class="stats">
      <div class="stat">
        <div class="stat-value">15</div>
        <div class="stat-label">Templates</div>
      </div>
      <div class="stat">
        <div class="stat-value">14</div>
        <div class="stat-label">Tipos de notificación</div>
      </div>
      <div class="stat">
        <div class="stat-value">7</div>
        <div class="stat-label">Templates base</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3><span class="icon">👋</span> Welcome - Inmobiliaria</h3>
        <p>Email de bienvenida para usuarios tipo inmobiliaria con CTA personalizado.</p>
        <a href="01-welcome-inmobiliaria.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">👋</span> Welcome - Dueño Directo</h3>
        <p>Email de bienvenida para propietarios que publican directamente.</p>
        <a href="02-welcome-dueno-directo.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">👋</span> Welcome - Inquilino</h3>
        <p>Email de bienvenida para usuarios buscando propiedades.</p>
        <a href="03-welcome-inquilino.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">💬</span> Nuevo Mensaje</h3>
        <p>Notificación de mensaje nuevo con preview del contenido.</p>
        <a href="04-new-message.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">↩️</span> Respuesta de Mensaje</h3>
        <p>Notificación cuando alguien responde a tu mensaje.</p>
        <a href="05-message-reply.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">📋</span> Consulta Recibida</h3>
        <p>Email cuando alguien hace una consulta sobre tu propiedad.</p>
        <a href="06-inquiry-received.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">🏠</span> Propiedad Publicada</h3>
        <p>Confirmación cuando una propiedad cambia a estado publicado.</p>
        <a href="07-property-published.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">✅</span> Propiedad Vendida</h3>
        <p>Notificación cuando una propiedad se marca como vendida.</p>
        <a href="08-property-sold.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">❤️</span> Like Recibido</h3>
        <p>Email cuando alguien le da me gusta a tu publicación.</p>
        <a href="09-like-received.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">💳</span> Pago - Destacar</h3>
        <p>Confirmación de pago para destacar una propiedad.</p>
        <a href="10-payment-feature.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">💳</span> Pago - Suscripción</h3>
        <p>Confirmación de pago de suscripción mensual.</p>
        <a href="11-payment-subscription.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">⏰</span> Propiedad Expira</h3>
        <p>Alerta cuando una publicación está por expirar en 7 días.</p>
        <a href="12-property-expiring.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">🆕</span> Nueva Propiedad</h3>
        <p>Notificación de nueva propiedad en área de interés.</p>
        <a href="13-new-property-in-area.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">⏰</span> Plan Expira</h3>
        <p>Alerta cuando el plan de suscripción está por expirar.</p>
        <a href="14-plan-expiring.html" target="_blank">Ver template →</a>
      </div>

      <div class="card">
        <h3><span class="icon">❌</span> Plan Expirado</h3>
        <p>Notificación cuando el plan ya expiró y se cambió a gratuito.</p>
        <a href="15-plan-expired.html" target="_blank">Ver template →</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml, 'utf-8')
  console.log('\n✅ Generado: index.html (índice principal)')

  console.log('\n==================================================')
  console.log(`✨ Todos los templates generados en: ${OUTPUT_DIR}`)
  console.log(`\n🌐 Abre index.html en tu navegador para ver todos los templates`)
  console.log(`   file:///${OUTPUT_DIR.replace(/\\/g, '/')}/index.html`)
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  generateAllPreviews()
}

export { generateAllPreviews }
