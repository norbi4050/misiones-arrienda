import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Llamar al endpoint de profile
    const response = await fetch('http://localhost:3000/api/users/profile', {
      headers: {
        'Cookie': '', // Las cookies se pasan automáticamente
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json({
        error: 'Profile endpoint failed',
        status: response.status,
        statusText: response.statusText
      }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      raw_response: data,
      profile_userType: data.profile?.userType,
      profile_isCompany: data.profile?.isCompany,
      should_hide_comunidad: data.profile?.userType === 'inmobiliaria',
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
