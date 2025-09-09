import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import InquilinoProfilePage from "./InquilinoProfilePage";

export default async function Page() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (k) => cookieStore.get(k)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();

  console.log("SSR session user id:", session?.user?.id);

  return <InquilinoProfilePage session={session ?? null} />;
}
