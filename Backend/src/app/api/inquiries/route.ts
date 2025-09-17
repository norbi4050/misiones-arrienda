import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone must be at least 8 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  type: z.enum(['GENERAL', 'VISIT', 'FINANCING', 'OFFER']),
  visitDate: z.string().optional(),
  propertyId: z.string().cuid('Invalid property ID'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = inquirySchema.parse(body);

    const inquiry = await prisma.inquiry.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        message: validatedData.message,
        type: validatedData.type,
        visitDate: validatedData.visitDate ? new Date(validatedData.visitDate) : null,
        propertyId: validatedData.propertyId,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            address: true,
            city: true,
            agent: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    // Here you would typically send an email notification
    // For now, we'll just return the created inquiry

    return NextResponse.json({
      success: true,
      inquiry,
      message: 'Inquiry submitted successfully. We will contact you soon!'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Error submitting inquiry' },
      { status: 500 }
    );
  }
}
