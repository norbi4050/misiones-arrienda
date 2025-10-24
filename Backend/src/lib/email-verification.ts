import nodemailer from 'nodemailer'
import { getSiteUrl } from './config'

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${getSiteUrl()}/api/auth/verify?token=${token}`

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: '¡Verifica tu cuenta en Misiones Arrienda!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Misiones Arrienda</h1>
          <p style="color: #6b7280; margin: 5px 0;">Tu plataforma de alquileres en Misiones</p>
        </div>

        <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; text-align: center;">
          <h2 style="color: #1e40af; margin-top: 0;">¡Bienvenido/a ${name}!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Gracias por registrarte en Misiones Arrienda. Para completar tu registro y activar tu cuenta, 
            necesitamos verificar tu dirección de email.
          </p>

          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              ✅ Verificar mi cuenta
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
          </p>
          <p style="color: #2563eb; font-size: 14px; word-break: break-all;">
            ${verificationUrl}
          </p>
        </div>

        <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>⚠️ Importante:</strong> Este enlace expirará en 24 horas por seguridad. 
            Si no verificas tu cuenta en este tiempo, deberás registrarte nuevamente.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Si no te registraste en Misiones Arrienda, puedes ignorar este email.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
            © 2024 Misiones Arrienda - Todos los derechos reservados
          </p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Error enviando email de verificación:', error)
    throw new Error('Error al enviar el email de verificación')
  }
}
