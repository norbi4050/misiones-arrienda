import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InquilinoProfileServerPage() {
  const supabase = createServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 space-y-4 text-center">
          <h1 className="text-xl font-semibold">Accede a tu Perfil de Inquilino</h1>
          <p className="text-gray-600">
            Inicia sesión para gestionar tu perfil, favoritos y más.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="px-4 py-2 rounded bg-blue-600 text-white">
              Iniciar sesión
            </Link>
            <Link href="/register" className="px-4 py-2 rounded border border-blue-600 text-blue-600">
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Perfil de Inquilino</h1>
      <p className="text-gray-600 mb-6">
        Sección en construcción. Tu sesión está activa como{" "}
        <strong>{session.user.email ?? session.user.id}</strong>.
      </p>
      <div className="rounded border p-4 bg-white">
        Próximamente: edición de perfil y foto de avatar.
      </div>
    </div>
  );
}
