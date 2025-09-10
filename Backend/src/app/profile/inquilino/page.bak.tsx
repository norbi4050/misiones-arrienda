import InquilinoProfilePage from './InquilinoProfilePage';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic'; // opcional, evita cache SSR

export default async function Page() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {}, // no-ops en server
        remove: () => {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  return <InquilinoProfilePage session={session ?? null} />;
}
