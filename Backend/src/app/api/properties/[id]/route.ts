import { NextResponse } from 'next/server';

function isValidId(id: string): boolean {
  // UUID v4 regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // CUID regex (starts with 'c' and has 25+ chars)
  const cuidRegex = /^c[^\s]{24,}$/;

  return uuidRegex.test(id) || cuidRegex.test(id);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  // Validate ID format before querying
  if (!isValidId(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Property` +
    `?id=eq.${encodeURIComponent(id)}&status=eq.PUBLISHED&select=*&limit=1`;

  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: 'Upstream error' }, { status: 500 });
  }

  const data = await res.json();
  const property = Array.isArray(data) ? data[0] : data;
  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Soportar camel o snake: isActive / is_active
  const active = property.isActive ?? property.is_active ?? true;
  if (!active) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(property, { status: 200 });
}
