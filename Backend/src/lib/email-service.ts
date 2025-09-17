import { InquiryData } from '@/types/property';

// Environment-safe configuration
const getEnvVar = (name: string): string | undefined => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return (window as any).ENV?.[name] || (window as any).process?.env?.[name];
  }
  // Node.js environment - safely check for process
  try {
    // @ts-ignore - process may not be defined in all environments
    return process?.env?.[name];
  } catch {
    return undefined;
  }
};

export class EmailService {
  private static readonly EDGE_FUNCTION_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
    ? `${getEnvVar('NEXT_PUBLIC_SUPABASE_URL')}/functions/v1/send-inquiry-email`
    : 'http://localhost:54321/functions/v1/send-inquiry-email';

  /**
   * Send inquiry notification emails using Supabase Edge Function
   * @param inquiryData - The inquiry data to send
   * @returns Promise with email sending results
   */
  static async sendInquiryEmail(inquiryData: InquiryData): Promise<{
    success: boolean;
    customerEmailSent?: boolean;
    internalNotificationSent?: boolean;
    error?: string;
  }> {
    try {
      const token = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '';

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(inquiryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        customerEmailSent: result.customerEmailSent,
        internalNotificationSent: result.internalNotificationSent,
      };

    } catch (error) {
      console.error('❌ Error sending inquiry email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send a test email to verify the service is working
   * @param testData - Test inquiry data
   */
  static async sendTestEmail(testData: Partial<InquiryData>): Promise<{
    success: boolean;
    error?: string;
  }> {
    const testInquiry: InquiryData = {
      name: testData.name || 'Test User',
      email: testData.email || 'test@example.com',
      phone: testData.phone || '123-456-7890',
      message: testData.message || 'This is a test inquiry from the email service.',
      type: testData.type || 'GENERAL',
      propertyId: testData.propertyId || 'test-property-id',
    };

    return this.sendInquiryEmail(testInquiry);
  }

  /**
   * Validate inquiry data before sending
   * @param data - Inquiry data to validate
   */
  static validateInquiryData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length < 8) {
      errors.push('Valid phone number is required');
    }

    if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
      errors.push('Message is required');
    }

    if (!data.type || ['GENERAL', 'VISIT', 'FINANCING', 'OFFER'].indexOf(data.type) === -1) {
      errors.push('Valid inquiry type is required');
    }

    if (!data.propertyId || typeof data.propertyId !== 'string') {
      errors.push('Property ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export for use in other modules
export default EmailService;
