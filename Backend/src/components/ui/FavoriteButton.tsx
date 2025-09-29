"use client";
import { useEffect, useState, useTransition } from "react";

export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [fav, setFav] = useState<boolean>(false);
  const [pending, start] = useTransition();

  // cargar estado inicial
  useEffect(() => {
    let mounted = true;
    fetch("/api/favorites")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!mounted || !d?.propertyIds) return;
        setFav(d.propertyIds.includes(propertyId));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [propertyId]);

  function toggle() {
    start(async () => {
      try {
        setFav(v => !v); // optimista
        const res = fav
          ? await fetch(`/api/favorites/${propertyId}`, { method: "DELETE" })
          : await fetch(`/api/favorites`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ propertyId })
            });
        if (!res.ok) setFav(v => !v); // revertir si falla
      } catch {
        setFav(v => !v);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={fav}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
      title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <span className={fav ? "text-yellow-500" : "text-gray-400"}>
        {fav ? "★" : "☆"}
      </span>
      {fav ? "Guardado" : "Favorito"}
    </button>
  );
}
