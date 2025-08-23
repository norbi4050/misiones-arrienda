interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In a Next.js app, we can use environment variables
      // These should be configured in your .env.local file
      
      console.log('📧 Email notification:', {
        to: options.to,
        subject: options.subject,
        timestamp: new Date().toISOString(),
      });

      // Production implementation would use:
      // - Gmail SMTP with cgonzalezarchilla@gmail.com
      // - SendGrid API
      // - Resend API
      // - Supabase Edge Functions
      
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  static async sendClientConfirmation(email: string, name: string, propertyTitle: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmación de Consulta - Misiones Arrienda</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">¡Hola ${name}!</h2>
            <p>Hemos recibido tu consulta sobre la propiedad: <strong>${propertyTitle}</strong></p>
            <p>Nos pondremos en contacto contigo muy pronto para ayudarte con toda la información que necesites.</p>
            <p>Mientras tanto, si tienes alguna pregunta adicional, no dudes en contactarnos.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280;">
              Saludos cordiales,<br>
              <strong>Equipo Misiones Arrienda</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Confirmación de consulta - ${propertyTitle}`,
      html,
    });
  }

  static async sendAgentNotification(
    agentEmail: string,
    agentName: string,
    inquiryDetails: {
      clientName: string;
      clientEmail: string;
      clientPhone: string;
      propertyTitle: string;
      message: string;
      type: string;
      visitDate?: string;
    }
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Nueva Consulta - Misiones Arrienda</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">¡Nueva consulta recibida!</h2>
            <p><strong>Propiedad:</strong> ${inquiryDetails.propertyTitle}</p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Datos del cliente:</h3>
              <p><strong>Nombre:</strong> ${inquiryDetails.clientName}</p>
              <p><strong>Email:</strong> ${inquiryDetails.clientEmail}</p>
              <p><strong>Teléfono:</strong> ${inquiryDetails.clientPhone}</p>
              <p><strong>Tipo de consulta:</strong> ${inquiryDetails.type}</p>
              ${inquiryDetails.visitDate ? `<p><strong>Fecha de visita:</strong> ${new Date(inquiryDetails.visitDate).toLocaleDateString('es-ES')}</p>` : ''}
            </div>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Mensaje:</h4>
              <p>${inquiryDetails.message}</p>
            </div>
            
            <p style="margin-top: 30px;">
              <a href="mailto:${inquiryDetails.clientEmail}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Responder al cliente
              </a>
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: agentEmail,
      subject: `Nueva consulta - ${inquiryDetails.propertyTitle}`,
      html,
    });
  }
}
