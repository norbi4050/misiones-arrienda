// =====================================================
// API Route: /api/users/plan
// Obtiene información del plan del usuario actual
// =====================================================

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanInfo } from '@/lib/plan-guards';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Obtener información del plan
    const planInfo = await getPlanInfo(user.id);
    
    if (!planInfo) {
      return NextResponse.json(
        { error: 'No se pudo obtener información del plan' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      plan: planInfo
    });
    
  } catch (error) {
    console.error('[API /users/plan] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
