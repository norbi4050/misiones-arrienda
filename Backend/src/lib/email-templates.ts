/**
 * Templates HTML profesionales para emails de notificaciones
 */

interface EmailTemplateData {
  name: string
  title: string
  message: string
  metadata?: Record<string, any>
}

/**
 * Template base con el diseño principal
 */
const getBaseTemplate = (content: string, preheader?: string): string => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${preheader ? `<meta name="description" content="${preheader}">` : ''}
  <title>Misiones Arrienda</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px; }
    .content { padding: 40px 30px; }
    .greeting { color: #1f2937; font-size: 16px; margin: 0 0 20px 0; }
    .message { color: #4b5563; line-height: 1.8; margin: 0 0 30px 0; font-size: 16px; }
    .cta-container { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); }
    .cta-button:hover { background-color: #1d4ed8; }
    .divider { border-top: 1px solid #e5e7eb; margin: 30px 0; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 13px; margin: 0 0 10px 0; line-height: 1.6; }
    .footer a { color: #2563eb; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .social-links { margin: 20px 0 10px 0; }
    .social-links a { display: inline-block; margin: 0 8px; }
    .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 3px; color: #92400e; }
    @media only screen and (max-width: 600px) {
      .content { padding: 30px 20px !important; }
      .header { padding: 30px 20px !important; }
      .header h1 { font-size: 24px !important; }
      .cta-button { padding: 12px 24px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0px;overflow:hidden;">${preheader}</div>` : ''}
  <div class="email-container">
    ${content}
  </div>
</body>
</html>
  `.trim()
}

/**
 * Template para email de BIENVENIDA
 */
export const getWelcomeEmailTemplate = (data: EmailTemplateData): string => {
  const userType = data.metadata?.userType || 'inquilino'

  const messages = {
    inmobiliaria: '¡Bienvenido a la plataforma líder de alquileres en Misiones! Ahora podés publicar tus propiedades y gestionar tu cartera de forma profesional.',
    dueno_directo: '¡Estamos encantados de tenerte con nosotros! Publicá tu propiedad de forma rápida y segura, sin intermediarios.',
    inquilino: '¡Te damos la bienvenida! Encontrá el hogar ideal para vos entre miles de propiedades en toda la provincia de Misiones.'
  }

  const content = `
    <div class="header">
      <h1>🏠 ¡Bienvenido a Misiones Arrienda!</h1>
      <p>Tu cuenta ha sido creada exitosamente</p>
    </div>
    <div class="content">
      <p class="greeting">Hola <strong>${data.name}</strong>,</p>
      <p class="message">
        ${messages[userType as keyof typeof messages] || messages.inquilino}
      </p>
      <p class="message">
        Desde ahora tenés acceso a todas las funcionalidades de nuestra plataforma:
      </p>
      <ul style="color: #4b5563; line-height: 2; margin: 0 0 30px 0;">
        ${userType === 'inquilino' ? `
          <li>🔍 Buscador avanzado de propiedades</li>
          <li>❤️ Guardar tus favoritos</li>
          <li>💬 Contactar directamente con propietarios</li>
          <li>🔔 Recibir notificaciones de nuevas propiedades</li>
        ` : userType === 'dueno_directo' ? `
          <li>📝 Publicar tus propiedades sin costo</li>
          <li>📊 Estadísticas de visualizaciones</li>
          <li>💬 Gestión de consultas</li>
          <li>⭐ Destacar tus publicaciones</li>
        ` : `
          <li>🏢 Panel de gestión profesional</li>
          <li>📊 Analytics y reportes detallados</li>
          <li>👥 Gestión de equipo</li>
          <li>⚡ Publicación masiva de propiedades</li>
        `}
      </ul>
      ${data.metadata?.ctaUrl ? `
      <div class="cta-container">
        <a href="${data.metadata.ctaUrl}" class="cta-button">
          ${data.metadata.ctaText || 'Comenzar ahora'}
        </a>
      </div>
      ` : ''}
      <div class="divider"></div>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Si tenés alguna pregunta o necesitás ayuda, no dudes en contactarnos. Nuestro equipo está para ayudarte.
      </p>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="https://www.facebook.com/misionesarrienda" style="text-decoration: none;">📘 Facebook</a>
        <a href="https://www.instagram.com/misionesarrienda" style="text-decoration: none;">📸 Instagram</a>
        <a href="https://wa.me/5493764000000" style="text-decoration: none;">💬 WhatsApp</a>
      </div>
      <p>
        Este email fue enviado desde <strong>Misiones Arrienda</strong><br>
        Tu plataforma de confianza para alquileres en Misiones
      </p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/notificaciones/preferencias">Gestionar preferencias</a> |
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/ayuda">Centro de ayuda</a>
      </p>
    </div>
  `

  return getBaseTemplate(content, 'Bienvenido a Misiones Arrienda - Tu cuenta ha sido creada exitosamente')
}

/**
 * Template para NUEVO MENSAJE
 */
export const getNewMessageEmailTemplate = (data: EmailTemplateData): string => {
  const senderName = data.metadata?.senderName || 'Un usuario'
  const propertyTitle = data.metadata?.propertyTitle || 'una propiedad'
  const messagePreview = data.metadata?.messagePreview || data.message

  const content = `
    <div class="header">
      <h1>💬 Nuevo Mensaje</h1>
      <p>Tenés un mensaje sin leer</p>
    </div>
    <div class="content">
      <p class="greeting">Hola <strong>${data.name}</strong>,</p>
      <p class="message">
        <strong>${senderName}</strong> te ha enviado un mensaje sobre <strong>${propertyTitle}</strong>:
      </p>
      <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #374151; margin: 0; font-style: italic; line-height: 1.6;">
          "${messagePreview}"
        </p>
      </div>
      ${data.metadata?.ctaUrl ? `
      <div class="cta-container">
        <a href="${data.metadata.ctaUrl}" class="cta-button">
          Responder mensaje
        </a>
      </div>
      ` : ''}
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        💡 Tip: Responder rápido aumenta tus posibilidades de concretar el alquiler.
      </p>
    </div>
    <div class="footer">
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/notificaciones/preferencias">Gestionar notificaciones</a> |
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/messages">Ver todos mis mensajes</a>
      </p>
    </div>
  `

  return getBaseTemplate(content, `${senderName} te envió un mensaje sobre ${propertyTitle}`)
}

/**
 * Template para CONSULTA RECIBIDA
 */
export const getInquiryReceivedEmailTemplate = (data: EmailTemplateData): string => {
  const customerName = data.metadata?.customerName || 'Un interesado'
  const propertyTitle = data.metadata?.propertyTitle || 'tu propiedad'
  const inquiryType = data.metadata?.inquiryType || 'GENERAL'
  const customerMessage = data.metadata?.customerMessage || ''

  const inquiryLabels: Record<string, string> = {
    GENERAL: 'Consulta general',
    VISIT: 'Solicitud de visita',
    FINANCING: 'Consulta sobre financiación',
    OFFER: 'Oferta de alquiler/compra'
  }

  const content = `
    <div class="header">
      <h1>📧 Nueva Consulta</h1>
      <p>${inquiryLabels[inquiryType]}</p>
    </div>
    <div class="content">
      <p class="greeting">Hola <strong>${data.name}</strong>,</p>
      <p class="message">
        <strong>${customerName}</strong> está interesado en <strong>${propertyTitle}</strong> y te ha enviado una ${inquiryLabels[inquiryType].toLowerCase()}:
      </p>
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 25px; margin: 25px 0; border-radius: 8px;">
        <div style="margin-bottom: 15px;">
          <strong style="color: #1e40af; display: block; margin-bottom: 5px;">👤 Contacto:</strong>
          <span style="color: #1f2937;">${customerName}</span>
        </div>
        ${data.metadata?.customerPhone ? `
        <div style="margin-bottom: 15px;">
          <strong style="color: #1e40af; display: block; margin-bottom: 5px;">📞 Teléfono:</strong>
          <a href="tel:${data.metadata.customerPhone}" style="color: #2563eb; text-decoration: none;">${data.metadata.customerPhone}</a>
        </div>
        ` : ''}
        ${data.metadata?.customerEmail ? `
        <div style="margin-bottom: 15px;">
          <strong style="color: #1e40af; display: block; margin-bottom: 5px;">✉️ Email:</strong>
          <a href="mailto:${data.metadata.customerEmail}" style="color: #2563eb; text-decoration: none;">${data.metadata.customerEmail}</a>
        </div>
        ` : ''}
        ${customerMessage ? `
        <div>
          <strong style="color: #1e40af; display: block; margin-bottom: 5px;">💬 Mensaje:</strong>
          <p style="color: #374151; margin: 5px 0 0 0; line-height: 1.6;">${customerMessage}</p>
        </div>
        ` : ''}
      </div>
      ${data.metadata?.ctaUrl ? `
      <div class="cta-container">
        <a href="${data.metadata.ctaUrl}" class="cta-button">
          ${data.metadata.ctaText || 'Ver detalles'}
        </a>
      </div>
      ` : ''}
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        ⚡ Respondé rápido para no perder esta oportunidad. Los inquilinos valoran la rapidez de respuesta.
      </p>
    </div>
    <div class="footer">
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/notificaciones/preferencias">Gestionar notificaciones</a>
      </p>
    </div>
  `

  return getBaseTemplate(content, `${customerName} consultó sobre ${propertyTitle}`)
}

/**
 * Template para CAMBIO DE ESTADO DE PROPIEDAD
 */
export const getPropertyStatusChangedEmailTemplate = (data: EmailTemplateData): string => {
  const propertyTitle = data.metadata?.propertyTitle || 'tu propiedad'
  const newStatus = data.metadata?.newStatus || ''

  const statusEmojis: Record<string, string> = {
    PUBLISHED: '✅',
    DRAFT: '📝',
    ARCHIVED: '📦',
    SOLD: '🎉',
    RENTED: '🏠',
    PENDING: '⏳'
  }

  const content = `
    <div class="header">
      <h1>${statusEmojis[newStatus] || '🏠'} Estado Actualizado</h1>
      <p>Cambio de estado de propiedad</p>
    </div>
    <div class="content">
      <p class="greeting">Hola <strong>${data.name}</strong>,</p>
      <p class="message">${data.message}</p>
      ${data.metadata?.ctaUrl ? `
      <div class="cta-container">
        <a href="${data.metadata.ctaUrl}" class="cta-button">
          Ver propiedad
        </a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/mi-cuenta/publicaciones">Mis publicaciones</a>
      </p>
    </div>
  `

  return getBaseTemplate(content, `${propertyTitle} - Estado actualizado`)
}

/**
 * Template para LIKE RECIBIDO
 */
export const getLikeReceivedEmailTemplate = (data: EmailTemplateData): string => {
  const likerName = data.metadata?.likerName || 'Alguien'
  const postContent = data.metadata?.postContent || 'tu publicación'

  const content = `
    <div class="header">
      <h1>❤️ Nuevo Like</h1>
      <p>A ${likerName} le gustó tu post</p>
    </div>
    <div class="content">
      <p class="greeting">Hola <strong>${data.name}</strong>,</p>
      <p class="message">${data.message}</p>
      ${data.metadata?.ctaUrl ? `
      <div class="cta-container">
        <a href="${data.metadata.ctaUrl}" class="cta-button">
          Ver post
        </a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/comunidad">Ir a la comunidad</a>
      </p>
    </div>
  `

  return getBaseTemplate(content, `A ${likerName} le gustó tu publicación`)
}

/**
 * Template genérico para otros tipos de notificaciones
 */
export const getGenericEmailTemplate = (data: EmailTemplateData): string => {
  const content = `
    <div class="header">
      <h1>🔔 ${data.title}</h1>
      <p>Misiones Arrienda</p>
    </div>
    <div class="content">
      <p class="greeting">Hola <strong>${data.name}</strong>,</p>
      <p class="message">${data.message}</p>
      ${data.metadata?.ctaUrl ? `
      <div class="cta-container">
        <a href="${data.metadata.ctaUrl}" class="cta-button">
          ${data.metadata.ctaText || 'Ver más'}
        </a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/notificaciones/preferencias">Gestionar preferencias</a> |
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/notificaciones">Ver notificaciones</a>
      </p>
    </div>
  `

  return getBaseTemplate(content, data.title)
}
