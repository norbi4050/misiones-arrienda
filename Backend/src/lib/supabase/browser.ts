'use client';
import { createBrowserClient } from '@supabase/ssr';

export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error('Faltan env de Supabase en cliente');
  return createBrowserClient(url, anon);
}
