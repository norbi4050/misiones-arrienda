import nodemailer from 'nodemailer'

// Configuración de email simplificada
const createTransporter = () => {
  // Verificar si tenemos las variables de entorno necesarias
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com'
  const emailPort = parseInt(process.env.EMAIL_PORT || '587')
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS
  const emailFrom = process.env.EMAIL_FROM || 'noreply@misionesarrienda.com'

  console.log('📧 Configuración de email:', {
    host: emailHost,
    port: emailPort,
    user: emailUser ? '***configurado***' : 'NO CONFIGURADO',
    pass: emailPass ? '***configurado***' : 'NO CONFIGURADO',
    from: emailFrom
  })

  // Si no hay configuración de email, usar un transportador de prueba
  if (!emailUser || !emailPass) {
    console.warn('⚠️ Variables de email no configuradas, usando modo de prueba')
    return null
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true para 465, false para otros puertos
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false // Para desarrollo
      }
    })

    console.log('✅ Transportador de email creado exitosamente')
    return transporter
  } catch (error) {
    console.error('❌ Error creando transportador de email:', error)
    return null
  }
}

export const sendVerificationEmail = async (
  email: string, 
  name: string, 
  verificationToken: string
): Promise<boolean> => {
  try {
    console.log(`📧 Intentando enviar email de verificación a: ${email}`)
    
    const transporter = createTransporter()
    
    if (!transporter) {
      console.warn('⚠️ No se pudo crear el transportador de email')
      return false
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify?token=${verificationToken}`
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@misionesarrienda.com',
      to: email,
      subject: '✅ Verifica tu cuenta en Misiones Arrienda',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">¡Bienvenido a Misiones Arrienda!</h1>
            <p style="color: #666; font-size: 16px;">Hola ${name}, gracias por registrarte</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Para completar tu registro y comenzar a usar Misiones Arrienda, necesitas verificar tu dirección de email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Verificar mi cuenta
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px;">
              Este email fue enviado desde Misiones Arrienda<br>
              Si no creaste una cuenta, puedes ignorar este mensaje.
            </p>
          </div>
        </div>
      `
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email de verificación enviado exitosamente:', result.messageId)
    return true

  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error)
    return false
  }
}

export const checkEmailConfiguration = (): { configured: boolean; message: string } => {
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS
  
  if (!emailUser || !emailPass) {
    return {
      configured: false,
      message: 'Variables EMAIL_USER y EMAIL_PASS no configuradas'
    }
  }
  
  return {
    configured: true,
    message: 'Configuración de email disponible'
  }
}

// Función para envío asíncrono (no bloquea la respuesta)
export const sendVerificationEmailAsync = (
  email: string, 
  name: string, 
  verificationToken: string
): void => {
  // Ejecutar en el próximo tick del event loop
  setImmediate(async () => {
    try {
      const sent = await sendVerificationEmail(email, name, verificationToken)
      if (sent) {
        console.log(`✅ Email de verificación enviado exitosamente a ${email}`)
      } else {
        console.warn(`⚠️ No se pudo enviar email de verificación a ${email}`)
      }
    } catch (error) {
      console.error(`❌ Error en envío asíncrono de email a ${email}:`, error)
    }
  })
}
