import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Cliente admin con Service Role Key para operaciones de webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // MercadoPago webhook data
    const { id, topic, type } = body
    
    console.log('MercadoPago webhook received:', { id, topic, type })

    // Handle payment notifications
    if (topic === 'payment' || type === 'payment') {
      try {
        const paymentInfo = await verifyPayment(id)
        
        console.log('Payment info:', paymentInfo)
        
        const propertyId = paymentInfo.external_reference
        const paymentId = paymentInfo.id
        const amount = paymentInfo.transaction_amount
        
        // Update database based on payment status
        switch (paymentInfo.status) {
          case 'approved':
            console.log(`Payment ${paymentId} approved for property ${propertyId}`)
            
            try {
              // Primero obtener la propiedad para conseguir el userId
              const property = await prisma.property.findUnique({
                where: { id: propertyId },
                select: { userId: true }
              })

              if (!property) {
                console.error(`Property ${propertyId} not found`)
                break
              }

              // 1. Crear/actualizar registro de Payment
              await prisma.payment.upsert({
                where: { mercadopagoId: paymentId.toString() },
                update: {
                  status: 'approved',
                  amount: amount,
                  dateApproved: new Date(),
                  webhookData: JSON.stringify(paymentInfo)
                },
                create: {
                  mercadopagoId: paymentId.toString(),
                  preferenceId: paymentId.toString(),
                  externalReference: propertyId,
                  propertyId: propertyId,
                  userId: property.userId,
                  status: 'approved',
                  amount: amount,
                  dateApproved: new Date(),
                  payerEmail: paymentInfo.payer?.email || '',
                  payerName: paymentInfo.payer?.name || '',
                  webhookData: JSON.stringify(paymentInfo)
                }
              })

              // 2. Actualizar Property: isPaid=true, featured=true
              const updatedProperty = await prisma.property.update({
                where: { id: propertyId },
                data: {
                  isPaid: true,
                  featured: true,
                  // Destacar por 30 días para plan premium
                  highlightedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
              })

              console.log(`✅ Property ${propertyId} marked as paid and featured`)
              
            } catch (dbError) {
              console.error('Error updating database for approved payment:', dbError)
              // No retornar error para evitar reenvíos del webhook
            }
            break
            
          case 'pending':
            console.log(`Payment ${paymentId} is pending`)
            
            try {
              // Crear/actualizar registro de Payment como pending
              await prisma.payment.upsert({
                where: { mercadopagoId: paymentId.toString() },
                update: {
                  status: 'pending',
                  amount: amount,
                  webhookData: JSON.stringify(paymentInfo)
                },
                create: {
                  mercadopagoId: paymentId.toString(),
                  preferenceId: paymentId.toString(),
                  externalReference: propertyId,
                  propertyId: propertyId,
                  userId: '', // Se necesitará obtener del property
                  status: 'pending',
                  amount: amount,
                  payerEmail: paymentInfo.payer?.email || '',
                  payerName: paymentInfo.payer?.name || '',
                  webhookData: JSON.stringify(paymentInfo)
                }
              })

              console.log(`⏳ Payment ${paymentId} marked as pending`)
              
            } catch (dbError) {
              console.error('Error updating database for pending payment:', dbError)
            }
            break
            
          case 'rejected':
          case 'cancelled':
            console.log(`Payment ${paymentId} was ${paymentInfo.status}`)
            
            try {
              // Actualizar registro de Payment como failed/cancelled
              await prisma.payment.upsert({
                where: { mercadopagoId: paymentId.toString() },
                update: {
                  status: paymentInfo.status === 'rejected' ? 'rejected' : 'cancelled',
                  amount: amount,
                  webhookData: JSON.stringify(paymentInfo)
                },
                create: {
                  mercadopagoId: paymentId.toString(),
                  preferenceId: paymentId.toString(),
                  externalReference: propertyId,
                  propertyId: propertyId,
                  userId: '', // Se necesitará obtener del property
                  status: paymentInfo.status === 'rejected' ? 'rejected' : 'cancelled',
                  amount: amount,
                  payerEmail: paymentInfo.payer?.email || '',
                  payerName: paymentInfo.payer?.name || '',
                  webhookData: JSON.stringify(paymentInfo)
                }
              })

              // Opcional: Limpiar propiedad si fue creada para plan premium
              // pero el pago falló (mantener como no destacada)
              await prisma.property.updateMany({
                where: { 
                  id: propertyId,
                  isPaid: false // Solo si no estaba pagada previamente
                },
                data: {
                  featured: false,
                  highlightedUntil: null
                }
              })

              console.log(`❌ Payment ${paymentId} marked as ${paymentInfo.status}`)
              
            } catch (dbError) {
              console.error('Error updating database for failed payment:', dbError)
            }
            break
            
          default:
            console.log(`Payment ${paymentId} has status: ${paymentInfo.status}`)
            
            // Para estados no manejados, solo registrar el pago
            try {
              await prisma.payment.upsert({
                where: { mercadopagoId: paymentId.toString() },
                update: {
                  status: 'unknown',
                  amount: amount,
                  webhookData: JSON.stringify(paymentInfo)
                },
                create: {
                  mercadopagoId: paymentId.toString(),
                  preferenceId: paymentId.toString(),
                  externalReference: propertyId,
                  propertyId: propertyId,
                  userId: '', // Se necesitará obtener del property
                  status: 'unknown',
                  amount: amount,
                  payerEmail: paymentInfo.payer?.email || '',
                  payerName: paymentInfo.payer?.name || '',
                  webhookData: JSON.stringify(paymentInfo)
                }
              })
            } catch (dbError) {
              console.error('Error updating database for unknown payment status:', dbError)
            }
        }
        
        return NextResponse.json({ received: true })
      } catch (error) {
        console.error('Error processing payment webhook:', error)
        return NextResponse.json({ error: 'Error processing payment' }, { status: 500 })
      }
    }
    
    // Handle other webhook types if needed
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// GET method for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}
