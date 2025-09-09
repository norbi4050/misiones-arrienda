import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Property?id=eq.${encodeURIComponent(id)}&select=*`
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        // Retorna un objeto único si hay una sola fila
        Prefer: 'return=representation,single-object'
      },
      cache: 'no-store'
    })

    if (res.status === 404) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    if (!res.ok) {
      const text = await res.text()
      console.error('Supabase REST error', res.status, text)
      return NextResponse.json({ error: 'Upstream error', detail: text }, { status: 502 })
    }

    const property = await res.json()
    if (!property || (Array.isArray(property) && property.length === 0)) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Fetch agent data if agentId exists
    let agent = null
    if (property.agentId) {
      const agentUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Agent?id=eq.${encodeURIComponent(property.agentId)}&select=*`
      const agentRes = await fetch(agentUrl, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation,single-object'
        },
        cache: 'no-store'
      })

      if (agentRes.ok) {
        agent = await agentRes.json()
      }
    }

    return NextResponse.json({ property, agent }, { status: 200 })
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
