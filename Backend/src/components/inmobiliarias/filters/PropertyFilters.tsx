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
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="p-1.5 rounded-lg bg-gray-100">
          <ArrowUpDown className="h-4 w-4 text-gray-600" />
        </div>
        <span className="font-semibold">Ordenar por:</span>
      </div>

      <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger className="w-[200px] shadow-sm border-gray-200 hover:border-blue-400 transition-colors">
          <SelectValue placeholder="Seleccionar orden" />
        </SelectTrigger>
        <SelectContent className="shadow-lg">
          <SelectItem value="recent" className="cursor-pointer">Más recientes</SelectItem>
          <SelectItem value="price_desc" className="cursor-pointer">Precio: Mayor a menor</SelectItem>
          <SelectItem value="price_asc" className="cursor-pointer">Precio: Menor a mayor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
