// src/app/api/debug-my-user-type/route.ts
// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = getServerSupabase();
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: authError?.message || 'No user session found',
        authenticated: false
      }, { status: 401 });
    }

    console.log('🔍 Checking user:', user.id, user.email);

    // Check in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Check in user_profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      authenticated: true,
      authUser: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        user_metadata: user.user_metadata
      },
      usersTable: {
        found: !!userData,
        error: userError?.message,
        data: userData || null,
        hasIsCompany: userData ? 'is_company' in userData : false,
        isCompanyValue: userData?.is_company,
        userType: userData?.user_type,
        companyName: userData?.company_name
      },
      userProfilesTable: {
        found: !!profileData,
        error: profileError?.message,
        data: profileData || null
      },
      diagnosis: {
        existsInUsers: !!userData,
        existsInUserProfiles: !!profileData,
        isCompanyFieldExists: userData ? 'is_company' in userData : false,
        isCompanyValue: userData?.is_company,
        userTypeValue: userData?.user_type,
        needsMigration: !userData || !('is_company' in userData),
        recommendation: !userData 
          ? '❌ Usuario NO existe en tabla users - Necesita migración'
          : !('is_company' in userData)
          ? '⚠️ Campo is_company NO existe - Ejecutar SQL fix'
          : userData.is_company === null
          ? '⚠️ Campo is_company es NULL - Necesita actualización'
          : userData.is_company === true
          ? '✅ Usuario ES inmobiliaria'
          : '✅ Usuario NO es inmobiliaria (inquilino/dueño directo)'
      }
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
