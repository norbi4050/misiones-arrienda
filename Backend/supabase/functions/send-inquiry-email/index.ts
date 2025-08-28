// =====================================================
// EDGE FUNCTION: SEND INQUIRY EMAIL
// Procesa consultas de propiedades y envía emails
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtener datos del request
    const { inquiry_id, property_id, user_id } = await req.json()
    
    console.log('📧 Processing inquiry email:', { inquiry_id, property_id, user_id })

    // Crear cliente Supabase con service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Obtener datos de la consulta con relaciones
    const { data: inquiry, error: inquiryError } = await supabase
      .from('UserInquiry')
      .select(`
        *,
        User:userId(*),
        Property:propertyId(
          *,
          User:userId(*)
        )
      `)
      .eq('id', inquiry_id)
      .single()

    if (inquiryError) {
      console.error('❌ Error fetching inquiry:', inquiryError)
      throw new Error(`Failed to fetch inquiry: ${inquiryError.message}`)
    }

    if (!inquiry) {
      throw new Error('Inquiry not found')
    }

    console.log('✅ Inquiry data fetched successfully')

    // Preparar datos del email
    const emailData = {
      to: inquiry.Property.User.email,
      from: 'noreply@misionesarrienda.com',
      subject: `Nueva consulta para tu propiedad: ${inquiry.Property.title}`,
      html: generateEmailHTML(inquiry),
      inquiry_id,
      property_id,
      user_id
    }

    console.log('📨 Email data prepared:', {
      to: emailData.to,
      subject: emailData.subject,
      inquiry_id: emailData.inquiry_id
    })

    // TODO: Integrar con proveedor de email (SendGrid, Resend, etc.)
    // Por ahora solo loggeamos los datos
    console.log('📧 Email would be sent with data:', emailData)

    // Simular envío exitoso
    const emailResult = {
      success: true,
      message: 'Email queued for delivery',
      provider: 'mock',
      timestamp: new Date().toISOString()
    }

    // Registrar el evento en analytics (opcional)
    try {
      await supabase
        .from('Analytics')
        .insert({
          event_type: 'email_sent',
          user_id: user_id,
          metadata: {
            inquiry_id,
            property_id,
            email_type: 'inquiry_notification',
            recipient: emailData.to
          }
        })
    } catch (analyticsError) {
      console.warn('⚠️ Failed to log analytics:', analyticsError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Inquiry email processed successfully',
        data: emailResult
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Error in send-inquiry-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    )
  }
})

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateEmailHTML(inquiry: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nueva consulta - Misiones Arrienda</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .property-info { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .user-info { background: #e3f2fd; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Nueva Consulta</h1>
          <p>Misiones Arrienda</p>
        </div>
        
        <div class="content">
          <h2>¡Tienes una nueva consulta!</h2>
          
          <div class="property-info">
            <h3>📍 Propiedad Consultada</h3>
            <p><strong>Título:</strong> ${inquiry.Property.title}</p>
            <p><strong>Precio:</strong> $${inquiry.Property.price.toLocaleString()}</p>
            <p><strong>Ubicación:</strong> ${inquiry.Property.address}, ${inquiry.Property.city}</p>
            <p><strong>Tipo:</strong> ${inquiry.Property.propertyType}</p>
          </div>
          
          <div class="user-info">
            <h3>👤 Datos del Interesado</h3>
            <p><strong>Nombre:</strong> ${inquiry.User.name}</p>
            <p><strong>Email:</strong> ${inquiry.User.email}</p>
            <p><strong>Teléfono:</strong> ${inquiry.User.phone || 'No proporcionado'}</p>
            <p><strong>Tipo de consulta:</strong> ${inquiry.type}</p>
            ${inquiry.visitDate ? `<p><strong>Fecha de visita solicitada:</strong> ${new Date(inquiry.visitDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div class="property-info">
            <h3>💬 Mensaje</h3>
            <p>${inquiry.message}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://misionesarrienda.com/dashboard" class="btn">
              Ver en Dashboard
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Este email fue enviado automáticamente por Misiones Arrienda</p>
          <p>No respondas a este email. Para contactar al interesado, usa los datos proporcionados arriba.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/* Deno.serve */
