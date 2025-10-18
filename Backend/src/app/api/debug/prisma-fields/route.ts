// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/debug/prisma-fields
 * Debug endpoint para verificar si el campo avatar_url existe en Prisma
 */
export async function GET() {
  try {
    // Intentar obtener un UserProfile con avatar_url
    const testProfile = await prisma.userProfile.findFirst({
      select: {
        id: true,
        userId: true,
        avatar_url: true,
        photos: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'avatar_url field exists in Prisma schema',
      testProfile,
      prismaVersion: '5.22.0',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: 'avatar_url field might not exist in Prisma client',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
