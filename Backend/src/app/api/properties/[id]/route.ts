import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

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

  const supabase = createServerSupabase();

  const cols = [
    'id','title','description','price','bedrooms','bathrooms','area','address','city','province',
    '"postalCode"','"propertyType"','"images"','"coverImagePath"','"amenities"','"features"','"createdAt"','"userId"'
  ].join(', ');

  const { data: property, error } = await supabase
    .from('Property')
    .select(cols)
    .eq('id', params.id)
    .eq('status', 'PUBLISHED')
    // ⚠️ Desactivar por ahora. Lo reactivamos después si existe la columna.
    // .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('API /properties/[id] Supabase error:', {
      status: error.code,
      message: error.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: error.code
    });
    return NextResponse.json({ error: 'Upstream error', message: error.message, details: (error as any)?.details }, { status: 500 });
  }

  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(property, { status: 200 });
}
