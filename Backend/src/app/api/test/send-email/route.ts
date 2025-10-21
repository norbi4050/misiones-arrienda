/**
 * API Endpoint: Test Email
 *
 * Endpoint de prueba para verificar que SendGrid está configurado correctamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service-simple'

export async function POST(request: NextRequest) {
  try {
    // Obtener email del body (opcional)
    const body = await request.json().catch(() => ({}))
    const testEmail = body.email || 'test@example.com'

    console.log('[Test Email] Enviando email de prueba a:', testEmail)

    // Enviar email de prueba
    const success = await sendEmail({
      to: testEmail,
      subject: '✅ Test de Configuración SendGrid - Misiones Arrienda',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .success { background: #10b981; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; font-weight: bold; }
              .info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 Misiones Arrienda</h1>
                <p>Sistema de Notificaciones</p>
              </div>

              <div class="content">
                <div class="success">
                  ✅ SendGrid está configurado correctamente
                </div>

                <div class="info">
                  <h2>Detalles de la prueba:</h2>
                  <ul>
                    <li><strong>Proveedor:</strong> SendGrid</li>
                    <li><strong>Host:</strong> smtp.sendgrid.net</li>
                    <li><strong>Puerto:</strong> 587</li>
                    <li><strong>Remitente:</strong> ${process.env.EMAIL_FROM || 'noreply@misionesarrienda.com.ar'}</li>
                    <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</li>
                  </ul>
                </div>

                <p>
                  Si estás viendo este email, significa que tu configuración de SendGrid está funcionando perfectamente.
                  Ahora el sistema de notificaciones puede enviar emails a tus usuarios.
                </p>

                <p>
                  <strong>Próximos pasos:</strong>
                </p>
                <ul>
                  <li>Verificar tu dominio en SendGrid para mejor deliverability</li>
                  <li>Configurar cron jobs en Vercel</li>
                  <li>Probar notificaciones end-to-end</li>
                </ul>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Misiones Arrienda - Todos los derechos reservados</p>
                <p>Este es un email de prueba del sistema de notificaciones</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (!success) {
      throw new Error('Error al enviar email')
    }

    return NextResponse.json({
      success: true,
      message: `Email de prueba enviado exitosamente a ${testEmail}`,
      timestamp: new Date().toISOString(),
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        from: process.env.EMAIL_FROM,
        secure: process.env.EMAIL_SECURE
      }
    })

  } catch (error) {
    console.error('[Test Email] Error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString(),
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        from: process.env.EMAIL_FROM,
        hasApiKey: !!process.env.EMAIL_PASSWORD
      }
    }, { status: 500 })
  }
}

// Método GET para prueba rápida
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Usa POST para enviar un email de prueba',
    example: {
      method: 'POST',
      url: '/api/test/send-email',
      body: {
        email: 'tu-email@example.com'
      }
    },
    config: {
      host: process.env.EMAIL_HOST || 'No configurado',
      port: process.env.EMAIL_PORT || 'No configurado',
      from: process.env.EMAIL_FROM || 'No configurado',
      hasApiKey: !!process.env.EMAIL_PASSWORD
    }
  })
}
