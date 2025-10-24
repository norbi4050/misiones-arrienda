'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'recent' | 'price_asc' | 'price_desc';

interface PropertyFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function PropertyFilters({ sortBy, onSortChange }: PropertyFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <ArrowUpDown className="h-4 w-4" />
        <span className="font-medium">Ordenar por:</span>
      </div>

      <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Seleccionar orden" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Más recientes</SelectItem>
          <SelectItem value="price_desc">Precio: Mayor a menor</SelectItem>
          <SelectItem value="price_asc">Precio: Menor a mayor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
