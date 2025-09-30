"use client";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [fav, setFav] = useState<boolean>(false);
  const [pending, start] = useTransition();

  // cargar estado inicial
  useEffect(() => {
    let mounted = true;
    fetch("/api/favorites", {
      credentials: 'include'
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!mounted || !d?.propertyIds) return;
        setFav(d.propertyIds.includes(propertyId));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [propertyId]);

  function toggle(e: React.MouseEvent) {
    // Prevenir que el click se propague al card padre
    e.stopPropagation();
    e.preventDefault();

    start(async () => {
      try {
        setFav(v => !v); // optimista
        const res = fav
          ? await fetch(`/api/favorites/${propertyId}`, { 
              method: "DELETE",
              credentials: 'include'
            })
          : await fetch(`/api/favorites`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ propertyId }),
              credentials: 'include'
            });
        
        if (!res.ok) {
          setFav(v => !v); // revertir si falla
          
          // Manejar específicamente error 401
          if (res.status === 401) {
            toast.error("Iniciá sesión para guardar favoritos");
            return;
          }
          
          // Otros errores
          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || "Error al actualizar favoritos");
        } else {
          // Feedback positivo
          toast.success(fav ? "Eliminado de favoritos" : "Agregado a favoritos");
        }
      } catch (error) {
        setFav(v => !v); // revertir en caso de error de red
        toast.error("Error de conexión. Intentá de nuevo.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
      tabIndex={0}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 min-w-[40px] min-h-[40px] z-20 pointer-events-auto bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 ${
        pending ? 'animate-pulse' : ''
      } hover:scale-105 active:scale-95`}
      title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <span 
        className={`transition-all duration-120 ${
          fav ? "text-yellow-500 scale-110" : "text-gray-400 scale-100"
        } ${pending ? 'animate-bounce' : ''}`}
      >
        {fav ? "★" : "☆"}
      </span>
      <span className="hidden sm:inline transition-opacity duration-120">
        {pending ? "..." : fav ? "Guardado" : "Favorito"}
      </span>
      {/* Área de feedback para lectores de pantalla */}
      <div aria-live="polite" className="sr-only">
        {pending && "Actualizando favoritos..."}
        {!pending && fav && "Agregado a favoritos"}
        {!pending && !fav && "Eliminado de favoritos"}
      </div>
    </button>
  );
}
