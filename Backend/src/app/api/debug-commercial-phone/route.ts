// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Obtener datos directos de la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({
        error: 'Error fetching user',
        details: userError.message,
      }, { status: 500 });
    }

    // Verificar qué campos existen
    const diagnostico = {
      userId,
      camposEncontrados: {
        company_name: userData?.company_name || null,
        phone: userData?.phone || null,
        commercial_phone: userData?.commercial_phone || null,
        show_phone_public: userData?.show_phone_public || null,
        user_type: userData?.user_type || null,
        role: userData?.role || null,
      },
      todosLosCampos: Object.keys(userData || {}),
      datosCompletos: userData,
    };

    return NextResponse.json(diagnostico, { status: 200 });
  } catch (error) {
    console.error('Error in debug-commercial-phone:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
