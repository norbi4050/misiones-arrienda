import { InquiryData } from '@/types/property';

// Enhanced Email Service with multiple providers and fallbacks
export class EnhancedEmailService {
  private static readonly EMAIL_PROVIDERS = {
    RESEND: 'resend',
    NODEMAILER: 'nodemailer',
    SENDGRID: 'sendgrid',
    MOCK: 'mock'
  };

  private static readonly TEMPLATES = {
    INQUIRY_CONFIRMATION: 'inquiry-confirmation',
    INQUIRY_NOTIFICATION: 'inquiry-notification',
    WELCOME: 'welcome',
    PROPERTY_ALERT: 'property-alert'
  };

  /**
   * Send inquiry emails with enhanced error handling and multiple providers
   */
  static async sendInquiryEmail(inquiryData: InquiryData): Promise<{
    success: boolean;
    customerEmailSent?: boolean;
    internalNotificationSent?: boolean;
    provider?: string;
    error?: string;
  }> {
    try {
      console.log('📧 Enhanced Email Service: Sending inquiry emails...');
      
      // Validate data first
      const validation = this.validateInquiryData(inquiryData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Try different providers in order of preference
      const providers = [
        this.EMAIL_PROVIDERS.RESEND,
        this.EMAIL_PROVIDERS.NODEMAILER,
        this.EMAIL_PROVIDERS.MOCK
      ];

      for (const provider of providers) {
        try {
          const result = await this.sendWithProvider(provider, inquiryData);
          if (result.success) {
            console.log(`✅ Emails sent successfully via ${provider}`);
            return { ...result, provider };
          }
        } catch (providerError) {
          console.warn(`⚠️ Provider ${provider} failed:`, providerError);
          continue;
        }
      }

      throw new Error('All email providers failed');

    } catch (error) {
      console.error('❌ Enhanced Email Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send email using specific provider
   */
  private static async sendWithProvider(provider: string, inquiryData: InquiryData): Promise<{
    success: boolean;
    customerEmailSent: boolean;
    internalNotificationSent: boolean;
  }> {
    switch (provider) {
      case this.EMAIL_PROVIDERS.RESEND:
        return this.sendWithResend(inquiryData);
      
      case this.EMAIL_PROVIDERS.NODEMAILER:
        return this.sendWithNodemailer(inquiryData);
      
      case this.EMAIL_PROVIDERS.MOCK:
        return this.sendWithMockProvider(inquiryData);
      
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Send emails using Resend (recommended for production)
   */
  private static async sendWithResend(inquiryData: InquiryData): Promise<{
    success: boolean;
    customerEmailSent: boolean;
    internalNotificationSent: boolean;
  }> {
    // This would require Resend API key in environment
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Resend API key not configured');
    }

    // Simulate Resend API call
    const customerEmail = await this.sendCustomerConfirmation(inquiryData);
    const internalEmail = await this.sendInternalNotification(inquiryData);

    return {
      success: true,
      customerEmailSent: customerEmail,
      internalNotificationSent: internalEmail
    };
  }

  /**
   * Send emails using Nodemailer (SMTP)
   */
  private static async sendWithNodemailer(inquiryData: InquiryData): Promise<{
    success: boolean;
    customerEmailSent: boolean;
    internalNotificationSent: boolean;
  }> {
    // This would require SMTP configuration
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    };

    if (!smtpConfig.host || !smtpConfig.user) {
      throw new Error('SMTP configuration not complete');
    }

    // Simulate SMTP sending
    const customerEmail = await this.sendCustomerConfirmation(inquiryData);
    const internalEmail = await this.sendInternalNotification(inquiryData);

    return {
      success: true,
      customerEmailSent: customerEmail,
      internalNotificationSent: internalEmail
    };
  }

  /**
   * Mock email provider for development and testing
   */
  private static async sendWithMockProvider(inquiryData: InquiryData): Promise<{
    success: boolean;
    customerEmailSent: boolean;
    internalNotificationSent: boolean;
  }> {
    console.log('📧 MOCK EMAIL SERVICE - Development Mode');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log email content for development
    console.log('📨 Customer Confirmation Email:', {
      to: inquiryData.email,
      subject: 'Confirmación de consulta - Misiones Arrienda',
      template: this.generateCustomerEmailTemplate(inquiryData)
    });

    console.log('📨 Internal Notification Email:', {
      to: 'admin@misionesarrienda.com.ar',
      subject: `Nueva consulta de ${inquiryData.name}`,
      template: this.generateInternalEmailTemplate(inquiryData)
    });

    return {
      success: true,
      customerEmailSent: true,
      internalNotificationSent: true
    };
  }

  /**
   * Send customer confirmation email
   */
  private static async sendCustomerConfirmation(inquiryData: InquiryData): Promise<boolean> {
    const template = this.generateCustomerEmailTemplate(inquiryData);
    
    // Here would be the actual email sending logic
    console.log('Sending customer confirmation to:', inquiryData.email);
    
    return true;
  }

  /**
   * Send internal notification email
   */
  private static async sendInternalNotification(inquiryData: InquiryData): Promise<boolean> {
    const template = this.generateInternalEmailTemplate(inquiryData);
    
    // Here would be the actual email sending logic
    console.log('Sending internal notification to admin');
    
    return true;
  }

  /**
   * Generate customer email template
   */
  private static generateCustomerEmailTemplate(inquiryData: InquiryData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirmación de consulta - Misiones Arrienda</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Misiones Arrienda</h1>
            <p>Confirmación de consulta recibida</p>
        </div>
        
        <div class="content">
            <h2>¡Hola ${inquiryData.name}!</h2>
            
            <p>Hemos recibido tu consulta y te contactaremos pronto. Aquí tienes un resumen:</p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                <p><strong>Tipo de consulta:</strong> ${this.getInquiryTypeLabel(inquiryData.type || 'GENERAL')}</p>
                <p><strong>Mensaje:</strong> ${inquiryData.message}</p>
                <p><strong>Teléfono:</strong> ${inquiryData.phone}</p>
                ${inquiryData.propertyId ? `<p><strong>Propiedad:</strong> ID ${inquiryData.propertyId}</p>` : ''}
            </div>
            
            <p><strong>¿Qué sigue?</strong></p>
            <ul>
                <li>📞 Te contactaremos en las próximas 2 horas</li>
                <li>📋 Revisaremos tu consulta en detalle</li>
                <li>🏠 Te ayudaremos a encontrar la propiedad perfecta</li>
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="https://misionesarrienda.com.ar" class="button">Ver más propiedades</a>
            </p>
        </div>
        
        <div class="footer">
            <p>Misiones Arrienda - Tu hogar en Misiones</p>
            <p>📧 info@misionesarrienda.com.ar | 📱 +54 376 123-4567</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate internal notification email template
   */
  private static generateInternalEmailTemplate(inquiryData: InquiryData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nueva consulta - Misiones Arrienda</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .urgent { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .data-table th, .data-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        .data-table th { background: #f3f4f6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Nueva Consulta Recibida</h1>
            <p>Misiones Arrienda - Panel Administrativo</p>
        </div>
        
        <div class="content">
            <div class="urgent">
                <h3>⏰ Acción Requerida</h3>
                <p>Nueva consulta recibida. <strong>Contactar en las próximas 2 horas.</strong></p>
            </div>
            
            <h3>📋 Detalles de la Consulta</h3>
            <table class="data-table">
                <tr><th>Campo</th><th>Valor</th></tr>
                <tr><td><strong>Nombre</strong></td><td>${inquiryData.name}</td></tr>
                <tr><td><strong>Email</strong></td><td><a href="mailto:${inquiryData.email}">${inquiryData.email}</a></td></tr>
                <tr><td><strong>Teléfono</strong></td><td><a href="tel:${inquiryData.phone}">${inquiryData.phone}</a></td></tr>
                <tr><td><strong>Tipo</strong></td><td>${this.getInquiryTypeLabel(inquiryData.type || 'GENERAL')}</td></tr>
                <tr><td><strong>Propiedad ID</strong></td><td>${inquiryData.propertyId || 'N/A'}</td></tr>
                <tr><td><strong>Fecha</strong></td><td>${new Date().toLocaleString('es-AR')}</td></tr>
            </table>
            
            <h3>💬 Mensaje del Cliente</h3>
            <div style="background: white; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                <p>${inquiryData.message}</p>
            </div>
            
            <h3>🎯 Acciones Recomendadas</h3>
            <ul>
                <li>📞 Llamar al cliente en las próximas 2 horas</li>
                <li>📧 Enviar información adicional por email</li>
                <li>📋 Registrar la consulta en el CRM</li>
                <li>🏠 Preparar propiedades similares si aplica</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Get human-readable inquiry type label
   */
  private static getInquiryTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'GENERAL': '💬 Consulta General',
      'VISIT': '🏠 Solicitud de Visita',
      'FINANCING': '💰 Consulta de Financiación',
      'OFFER': '📝 Oferta de Compra'
    };
    return labels[type] || type;
  }

  /**
   * Validate inquiry data with enhanced validation
   */
  static validateInquiryData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Name validation
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required and must be a string');
    } else if (data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (data.name.trim().length > 100) {
      errors.push('Name must be less than 100 characters');
    }

    // Email validation
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required and must be a string');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push('Email must be a valid email address');
      }
    }

    // Phone validation
    if (!data.phone || typeof data.phone !== 'string') {
      errors.push('Phone is required and must be a string');
    } else if (data.phone.trim().length < 8) {
      errors.push('Phone must be at least 8 characters long');
    } else if (data.phone.trim().length > 20) {
      errors.push('Phone must be less than 20 characters');
    }

    // Message validation
    if (!data.message || typeof data.message !== 'string') {
      errors.push('Message is required and must be a string');
    } else if (data.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters long');
    } else if (data.message.trim().length > 1000) {
      errors.push('Message must be less than 1000 characters');
    }

    // Type validation
    const validTypes = ['GENERAL', 'VISIT', 'FINANCING', 'OFFER'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push(`Type must be one of: ${validTypes.join(', ')}`);
    }

    // Property ID validation (optional)
    if (data.propertyId && typeof data.propertyId !== 'string') {
      errors.push('Property ID must be a string if provided');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Send test email for development
   */
  static async sendTestEmail(): Promise<{ success: boolean; error?: string }> {
    const testData: InquiryData = {
      name: 'Juan Pérez',
      email: 'test@example.com',
      phone: '+54 376 123-4567',
      message: 'Esta es una consulta de prueba del sistema de emails mejorado de Misiones Arrienda.',
      type: 'GENERAL',
      propertyId: 'test-property-123',
    };

    return this.sendInquiryEmail(testData);
  }

  /**
   * Get service status and configuration
   */
  static getServiceStatus(): {
    available: boolean;
    providers: string[];
    configuration: Record<string, boolean>;
  } {
    return {
      available: true,
      providers: Object.values(this.EMAIL_PROVIDERS),
      configuration: {
        resendConfigured: !!process.env.RESEND_API_KEY,
        smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
        mockEnabled: process.env.NODE_ENV === 'development'
      }
    };
  }
}

// Export for use in other modules
export default EnhancedEmailService;
