import { NextResponse } from 'next/server'
import DatabaseAdapter from '@/lib/db-adapter'

export async function GET() {
  try {
    const healthStatus = await DatabaseAdapter.healthCheck()
    
    const overallStatus = healthStatus.supabase.status === 'ok' ? 'healthy' : 'degraded'
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: healthStatus,
      recommendations: {
        primary: 'Supabase (REST API)',
        fallback: 'Prisma (Direct PostgreSQL)',
        current_strategy: 'Using Supabase for critical operations due to Prisma connectivity issues'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
