import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente simple sin cookies - solo anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  console.log('[DEBUG API] Starting...');

  // Test 1: Raw count
  const { data: allData, count: allCount, error: allError } = await supabase
    .from('Property')
    .select('*', { count: 'exact' });

  console.log('[DEBUG API] All properties:', {
    count: allCount,
    length: allData?.length,
    error: allError?.message
  });

  // Test 2: With status filter
  const { data: publishedData, count: publishedCount, error: publishedError } = await supabase
    .from('Property')
    .select('*', { count: 'exact' })
    .eq('status', 'published');

  console.log('[DEBUG API] Published properties:', {
    count: publishedCount,
    length: publishedData?.length,
    error: publishedError?.message
  });

  // Test 3: With status and is_active
  const { data: activeData, count: activeCount, error: activeError } = await supabase
    .from('Property')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .eq('is_active', true);

  console.log('[DEBUG API] Published + active properties:', {
    count: activeCount,
    length: activeData?.length,
    error: activeError?.message
  });

  return NextResponse.json({
    test1_all: {
      count: allCount,
      length: allData?.length,
      error: allError?.message,
      sample: allData?.[0]
    },
    test2_published: {
      count: publishedCount,
      length: publishedData?.length,
      error: publishedError?.message,
      sample: publishedData?.[0]
    },
    test3_published_active: {
      count: activeCount,
      length: activeData?.length,
      error: activeError?.message,
      sample: activeData?.[0]
    }
  });
}
