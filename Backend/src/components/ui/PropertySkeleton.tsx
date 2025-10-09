'use client';

/**
 * Componente: Property Skeleton (Loading State)
 * 
 * Skeleton loader para property cards con:
 * - Shimmer effect animado
 * - Tamaño grande (para grid de 10 propiedades)
 * - Responsive
 * - Dark mode support
 * 
 * Uso: Mientras cargan las propiedades en el perfil público
 */
export default function PropertySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm animate-pulse">
      {/* Imagen */}
      <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-gray-600/20 to-transparent animate-shimmer"></div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-3">
        {/* Título */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>

        {/* Ubicación */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>

        {/* Precio */}
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>

        {/* Características */}
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>

        {/* Botón */}
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

/**
 * Grid de Skeletons
 * Muestra múltiples skeletons en grid
 */
export function PropertySkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertySkeleton key={i} />
      ))}
    </div>
  );
}
