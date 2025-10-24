import { FilterSection } from './filter-section'
import { PropertyFilters } from '@/types/property'

interface FilterSectionWrapperProps {
  onFilterChange?: (filters: PropertyFilters) => void
  enableUrlPersistence?: boolean
  enableRealTimeFiltering?: boolean
}

// Removed Suspense wrapper as parent component (PropertiesPageClient) is already wrapped in Suspense
// This fixes the issue where FilterSection using useSearchParams() was causing hydration errors
export function FilterSectionWrapper(props: FilterSectionWrapperProps) {
  return <FilterSection {...props} />
}
