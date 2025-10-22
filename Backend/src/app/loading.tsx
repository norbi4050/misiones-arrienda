import { PropertyCardSkeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="h-12 w-3/4 bg-white/20 rounded animate-pulse mb-4"></div>
          <div className="h-6 w-1/2 bg-white/20 rounded animate-pulse mb-8"></div>
          <div className="h-12 w-48 bg-white/20 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Properties grid skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
