// Inquiry Email Service Edge Function

// Professional HTML Email Template
const createInquiryEmailTemplate = (inquiryData: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
        .content { padding: 20px; background-color: #ffffff; }
        .footer { font-size: 0.8em; color: #777; text-align: center; padding: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Inquiry Received</h1>
    </div>
    <div class="content">
        <p><strong>Name:</strong> ${inquiryData.name}</p>
        <p><strong>Email:</strong> ${inquiryData.email}</p>
        <p><strong>Phone:</strong> ${inquiryData.phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${inquiryData.message}</blockquote>
    </div>
    <div class="footer">
        <p>This is an automated notification. Please do not reply directly to this email.</p>
    </div>
</body>
</html>
`;

// Internal Notification Email Template
const createInternalNotificationTemplate = (inquiryData: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e74c3c; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; background-color: #ffffff; }
        .footer { font-size: 0.8em; color: #777; text-align: center; padding: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 New Customer Inquiry</h1>
    </div>
    <div class="content">
        <h2>Inquiry Details</h2>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Name:</strong> ${inquiryData.name}</p>
        <p><strong>Email:</strong> ${inquiryData.email}</p>
        <p><strong>Phone:</strong> ${inquiryData.phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${inquiryData.message}</blockquote>
    </div>
    <div class="footer">
        <p>Internal notification - requires immediate attention</p>
    </div>
</body>
</html>
`;

// Email Sending Function
async function sendEmail(recipient: string, subject: string, html: string) {
    // Supabase Email Sending Strategy
    // Method 1: Using Supabase Auth Email Invite (works for notifications)
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!, 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fallback to service role email invite method
    const { error } = await supabase.auth.admin.inviteUserByEmail(recipient, {
        data: { subject, html }
    });

    if (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Main Edge Function Handler
Deno.serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const inquiryData = await req.json();

        // Validate required fields
        const requiredFields = ['name', 'email', 'message'];
        const missingFields = requiredFields.filter(field => !inquiryData[field]);
        
        if (missingFields.length > 0) {
            return new Response(JSON.stringify({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Configuration for recipients
        const CUSTOMER_EMAIL = inquiryData.email;
        const INTERNAL_NOTIFICATION_EMAIL = Deno.env.get('INTERNAL_NOTIFICATION_EMAIL') || 'admin@yourcompany.com';

        // Send Customer Confirmation Email
        const customerEmailResult = await sendEmail(
            CUSTOMER_EMAIL, 
            'Inquiry Received', 
            createInquiryEmailTemplate(inquiryData)
        );

        // Send Internal Notification Email
        const internalEmailResult = await sendEmail(
            INTERNAL_NOTIFICATION_EMAIL, 
            'New Customer Inquiry', 
            createInternalNotificationTemplate(inquiryData)
        );

        return new Response(JSON.stringify({
            customerEmailSent: customerEmailResult.success,
            internalNotificationSent: internalEmailResult.success
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Inquiry Email Service Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal Server Error', 
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

// Supabase Client Import (placed at end to ensure everything is defined)
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
