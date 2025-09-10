"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ProfileImageUpload } from "@/components/ui/image-upload";

type Profile = { id: string; email?: string | null; profile_image?: string | null; };
type ProfileResponse = { profile: Profile } | { success?: boolean; error?: string };

export default function InquilinoProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch("/api/users/profile", { credentials: "include" });
        if (!canceled) {
          if (res.ok) {
            const data = (await res.json()) as ProfileResponse;
            const p = (data as any)?.profile as Profile | undefined;
            if (p?.id) {
              setUserId(p.id);
              setAvatar(p.profile_image ?? undefined);
            }
          } else {
            setUserId(null);
          }
        }
      } catch {
        if (!canceled) setUserId(null);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, []);

  if (loading) return <div className="p-6">Cargando…</div>;

  if (!userId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white shadow rounded-xl p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">Accedé a tu Perfil</h1>
          <p className="text-gray-600 mb-6">
            Iniciá sesión para ver y editar tu perfil de inquilino.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Iniciar sesión</Link>
            <Link href="/register" className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600">Crear cuenta</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Perfil de Inquilino</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-medium mb-3">Foto de perfil</h2>
        <ProfileImageUpload
          value={avatar}
          userId={userId}
          onChange={(url) => setAvatar(url)}
          className="max-w-md"
        />
      </div>
    </div>
  );
}
