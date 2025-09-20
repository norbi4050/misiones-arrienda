"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Search,
  Filter,
  X,
  Calendar,
  Banknote,
  Home,
  MapPin,
  SlidersHorizontal
} from 'lucide-react';

interface PropertyFiltersProps {
  onFiltersChange: (filters: PropertyFilters) => void;
  initialFilters?: Partial<PropertyFilters>;
  totalCount?: number;
  className?: string;
}

export interface PropertyFilters {
  search: string;
  status: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  city: string;
  province: string;
  bedrooms: string;
  bathrooms: string;
  featured: boolean | null;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: PropertyFilters = {
  search: '',
  status: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  city: '',
  province: '',
  bedrooms: '',
  bathrooms: '',
  featured: null,
  dateFrom: '',
  dateTo: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'RENTED', label: 'Alquilado' },
  { value: 'SOLD', label: 'Vendido' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'RESERVED', label: 'Reservado' },
  { value: 'EXPIRED', label: 'Expirado' }
];

const propertyTypeOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'APARTMENT', label: 'Departamento' },
  { value: 'HOUSE', label: 'Casa' },
  { value: 'COMMERCIAL', label: 'Comercial' },
  { value: 'LAND', label: 'Terreno' },
  { value: 'OFFICE', label: 'Oficina' },
  { value: 'WAREHOUSE', label: 'Depósito' },
  { value: 'PH', label: 'PH' },
  { value: 'STUDIO', label: 'Monoambiente' }
];

const sortOptions = [
  { value: 'createdAt', label: 'Fecha de creación' },
  { value: 'updatedAt', label: 'Última actualización' },
  { value: 'price', label: 'Precio' },
  { value: 'title', label: 'Título' },
  { value: 'city', label: 'Ciudad' },
  { value: 'area', label: 'Superficie' }
];

const bedroomOptions = [
  { value: '', label: 'Cualquier cantidad' },
  { value: '1', label: '1 dormitorio' },
  { value: '2', label: '2 dormitorios' },
  { value: '3', label: '3 dormitorios' },
  { value: '4', label: '4+ dormitorios' }
];

const bathroomOptions = [
  { value: '', label: 'Cualquier cantidad' },
  { value: '1', label: '1 baño' },
  { value: '2', label: '2 baños' },
  { value: '3', label: '3+ baños' }
];

export function PropertyFilters({
  onFiltersChange,
  initialFilters = {},
  totalCount = 0,
  className = ''
}: PropertyFiltersProps) {
  const [filters, setFilters] = useState<PropertyFilters>({
    ...defaultFilters,
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Update filters when they change
  useEffect(() => {
    onFiltersChange(filters);

    // Count active filters
    const count = Object.entries(filters).reduce((acc, [key, value]) => {
      if (key === 'sortBy' || key === 'sortOrder') return acc;
      if (value && value !== '' && value !== null) return acc + 1;
      return acc;
    }, 0);

    setActiveFiltersCount(count);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  const clearFilter = (key: keyof PropertyFilters) => {
    handleFilterChange(key, key === 'featured' ? null : '');
  };

  const getActiveFilters = () => {
    const active: Array<{ key: keyof PropertyFilters; label: string; value: any }> = [];

    if (filters.search) active.push({ key: 'search', label: 'Búsqueda', value: filters.search });
    if (filters.status) active.push({ key: 'status', label: 'Estado', value: statusOptions.find(o => o.value === filters.status)?.label });
    if (filters.propertyType) active.push({ key: 'propertyType', label: 'Tipo', value: propertyTypeOptions.find(o => o.value === filters.propertyType)?.label });
    if (filters.minPrice) active.push({ key: 'minPrice', label: 'Precio mín.', value: `$${filters.minPrice}` });
    if (filters.maxPrice) active.push({ key: 'maxPrice', label: 'Precio máx.', value: `$${filters.maxPrice}` });
    if (filters.city) active.push({ key: 'city', label: 'Ciudad', value: filters.city });
    if (filters.province) active.push({ key: 'province', label: 'Provincia', value: filters.province });
    if (filters.bedrooms) active.push({ key: 'bedrooms', label: 'Dormitorios', value: `${filters.bedrooms}+` });
    if (filters.bathrooms) active.push({ key: 'bathrooms', label: 'Baños', value: `${filters.bathrooms}+` });
    if (filters.featured !== null) active.push({ key: 'featured', label: 'Destacados', value: filters.featured ? 'Sí' : 'No' });
    if (filters.dateFrom) active.push({ key: 'dateFrom', label: 'Desde', value: filters.dateFrom });
    if (filters.dateTo) active.push({ key: 'dateTo', label: 'Hasta', value: filters.dateTo });

    return active;
  };

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalCount} propiedades
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar ({activeFiltersCount})
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            {isExpanded ? 'Menos filtros' : 'Más filtros'}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar por título, descripción o dirección..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de propiedad</label>
          <select
            value={filters.propertyType}
            onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {propertyTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t">
          {/* Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-green-600 font-bold mr-1">$</span>
                Precio mínimo
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-green-600 font-bold mr-1">$</span>
                Precio máximo
              </label>
              <Input
                type="number"
                placeholder="Sin límite"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ciudad
              </label>
              <Input
                placeholder="Ej: Posadas"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Provincia
              </label>
              <Input
                placeholder="Ej: Misiones"
                value={filters.province}
                onChange={(e) => handleFilterChange('province', e.target.value)}
              />
            </div>
          </div>

          {/* Rooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home className="w-4 h-4 inline mr-1" />
                Dormitorios
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {bedroomOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home className="w-4 h-4 inline mr-1" />
                Baños
              </label>
              <select
                value={filters.bathrooms}
                onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {bathroomOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha desde
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha hasta
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Featured Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Propiedades destacadas</label>
            <div className="flex gap-2">
              <Button
                variant={filters.featured === true ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('featured', filters.featured === true ? null : true)}
              >
                Solo destacadas
              </Button>
              <Button
                variant={filters.featured === false ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('featured', filters.featured === false ? null : false)}
              >
                Solo normales
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {getActiveFilters().map(filter => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-xs">
                  {filter.label}: {filter.value}
                </span>
                <button
                  onClick={() => clearFilter(filter.key)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
