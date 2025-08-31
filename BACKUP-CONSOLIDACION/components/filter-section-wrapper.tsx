import { Suspense } from 'react'
import { FilterSection } from './filter-section'
import { PropertyFilters } from '@/types/property'

interface FilterSectionWrapperProps {
  onFilterChange?: (filters: PropertyFilters) => void
  enableUrlPersistence?: boolean
  enableRealTimeFiltering?: boolean
}

function FilterSectionFallback() {
  return (
    <section className="py-8 bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Filtrar propiedades
            </h2>
            <p className="text-gray-600">Cargando filtros...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function FilterSectionWrapper(props: FilterSectionWrapperProps) {
  return (
    <Suspense fallback={<FilterSectionFallback />}>
      <FilterSection {...props} />
    </Suspense>
  )
}
