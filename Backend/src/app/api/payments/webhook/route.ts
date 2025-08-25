import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/mercadopago'

export const runtime = 'nodejs'

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
        
        // Here you can update your database based on payment status
        switch (paymentInfo.status) {
          case 'approved':
            // Payment was approved
            console.log(`Payment ${id} approved for property ${paymentInfo.external_reference}`)
            // TODO: Update database - mark payment as completed
            break
            
          case 'pending':
            // Payment is pending
            console.log(`Payment ${id} is pending`)
            // TODO: Update database - mark payment as pending
            break
            
          case 'rejected':
            // Payment was rejected
            console.log(`Payment ${id} was rejected`)
            // TODO: Update database - mark payment as failed
            break
            
          case 'cancelled':
            // Payment was cancelled
            console.log(`Payment ${id} was cancelled`)
            // TODO: Update database - mark payment as cancelled
            break
            
          default:
            console.log(`Payment ${id} has status: ${paymentInfo.status}`)
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
