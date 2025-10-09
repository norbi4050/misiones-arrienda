// Health Check Endpoint - Database connectivity
// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const supabase = createClient();
    
    // Test database connectivity with a simple query
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.error('Health check DB error:', error);
      return NextResponse.json(
        { 
          db: 'error', 
          time: responseTime,
          error: error.message,
          timestamp: new Date().toISOString()
        }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json({
      db: 'ok',
      time: responseTime,
      timestamp: new Date().toISOString(),
      records_accessible: data ? data.length : 0
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        db: 'error', 
        time: responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}
