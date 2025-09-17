import nodemailer from 'nodemailer'

// Función para verificar si el servicio de email está configurado
function isEmailServiceConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Configuración del transportador de email con manejo de errores mejorado
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!isEmailServiceConfigured()) {
    return null;
  }

  if (!transporter) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Configuración adicional para mejor manejo de errores
        connectionTimeout: 10000, // 10 segundos
        greetingTimeout: 5000, // 5 segundos
        socketTimeout: 10000, // 10 segundos
      });
    } catch (error) {
      console.error('❌ Error configurando transportador de email:', error);
      return null;
    }
  }

  return transporter;
}

// Función mejorada para envío de email de verificación (no bloqueante)
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const emailTransporter = getTransporter();

    if (!emailTransporter) {
      return {
        success: false,
        error: 'Servicio de email no configurado'
      };
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;

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
    };

    // Intentar enviar el email con timeout
    await Promise.race([
      emailTransporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout enviando email')), 15000)
      )
    ]);

    return { success: true };

  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función para envío asíncrono (fire and forget) - no bloquea el registro
export function sendVerificationEmailAsync(email: string, name: string, token: string): void {
  // Ejecutar en el próximo tick para no bloquear
  setImmediate(async () => {
    try {
      const result = await sendVerificationEmail(email, name, token);
      if (result.success) {
        } else {
        }
    } catch (error) {
      console.error('❌ Error en envío asíncrono de email:', error);
    }
  });
}

// Función para verificar la configuración del servicio de email
export function checkEmailServiceStatus(): { configured: boolean; message: string } {
  if (!isEmailServiceConfigured()) {
    return {
      configured: false,
      message: 'Servicio de email no configurado. Se requieren variables SMTP_USER y SMTP_PASS.'
    };
  }

  return {
    configured: true,
    message: 'Servicio de email configurado correctamente.'
  };
}
