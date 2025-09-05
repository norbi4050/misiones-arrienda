"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PropertyCard } from '@/components/ui/property-card';
import { PropertyFilters, PropertyFilters as PropertyFiltersType } from '@/components/ui/property-filters';
import { PropertyStats } from '@/components/ui/property-stats';
import { BulkActions, BulkAction } from '@/components/ui/bulk-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Grid3X3, 
  List, 
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Filter
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  oldPrice?: number;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  area: number;
  address: string;
  city: string;
  province: string;
  propertyType: string;
  status: string;
  images: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  activePlan?: {
    planType: string;
    planName: string;
  };
  views?: number;
  inquiries?: number;
  favorites?: number;
}

interface PropertyStats {
  totalProperties: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalViews?: number;
  totalInquiries?: number;
  totalFavorites?: number;
  averagePrice?: number;
  recentActivity?: {
    newProperties: number;
    updatedProperties: number;
    period: string;
  };
  performance?: {
    topPerforming?: Array<{
      id: string;
      title: string;
      views: number;
      inquiries: number;
    }>;
    conversionRate?: number;
  };
}

export default function PropertiesManagementPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [filters, setFilters] = useState<PropertyFiltersType>({
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
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/properties/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch analytics/stats
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/properties/analytics/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Generate mock stats from properties
      generateMockStats();
    }
  }, [user?.id, properties]);

  // Generate mock stats from current properties
  const generateMockStats = useCallback(() => {
    if (properties.length === 0) return;

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalViews = 0;
    let totalInquiries = 0;
    let totalFavorites = 0;
    let totalPrice = 0;

    properties.forEach(property => {
      // Count by status
      byStatus[property.status] = (byStatus[property.status] || 0) + 1;
      
      // Count by type
      byType[property.propertyType] = (byType[property.propertyType] || 0) + 1;
      
      // Sum analytics
      totalViews += property.views || Math.floor(Math.random() * 100);
      totalInquiries += property.inquiries || Math.floor(Math.random() * 20);
      totalFavorites += property.favorites || Math.floor(Math.random() * 15);
      totalPrice += property.price;
    });

    const mockStats: PropertyStats = {
      totalProperties: properties.length,
      byStatus,
      byType,
      totalViews,
      totalInquiries,
      totalFavorites,
      averagePrice: totalPrice / properties.length,
      recentActivity: {
        newProperties: Math.floor(Math.random() * 5),
        updatedProperties: Math.floor(Math.random() * 10),
        period: 'esta semana'
      },
      performance: {
        topPerforming: properties
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            title: p.title,
            views: p.views || Math.floor(Math.random() * 100),
            inquiries: p.inquiries || Math.floor(Math.random() * 20)
          })),
        conversionRate: Math.random() * 10 + 5
      }
    };

    setStats(mockStats);
  }, [properties]);

  // Apply filters to properties
  const applyFilters = useCallback(() => {
    let filtered = [...properties];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(searchTerm) ||
        property.description.toLowerCase().includes(searchTerm) ||
        property.address.toLowerCase().includes(searchTerm) ||
        property.city.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(property => property.status === filters.status);
    }

    // Property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(property => property.propertyType === filters.propertyType);
    }

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter(property => property.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(property => property.price <= parseInt(filters.maxPrice));
    }

    // Location filters
    if (filters.city) {
      filtered = filtered.filter(property => 
        property.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    if (filters.province) {
      filtered = filtered.filter(property => 
        property.province.toLowerCase().includes(filters.province.toLowerCase())
      );
    }

    // Room filters
    if (filters.bedrooms) {
      const minBedrooms = parseInt(filters.bedrooms);
      filtered = filtered.filter(property => property.bedrooms >= minBedrooms);
    }
    if (filters.bathrooms) {
      const minBathrooms = parseInt(filters.bathrooms);
      filtered = filtered.filter(property => property.bathrooms >= minBathrooms);
    }

    // Featured filter
    if (filters.featured !== null) {
      filtered = filtered.filter(property => property.featured === filters.featured);
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(property => 
        new Date(property.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(property => 
        new Date(property.createdAt) <= new Date(filters.dateTo)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof Property];
      let bValue: any = b[filters.sortBy as keyof Property];

      if (filters.sortBy === 'price' || filters.sortBy === 'area') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (filters.sortBy === 'createdAt' || filters.sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProperties(filtered);
  }, [properties, filters]);

  // Handle property selection
  const handlePropertySelect = (propertyId: string, selected: boolean) => {
    if (selected) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProperties(filteredProperties.map(p => p.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedProperties([]);
  };

  // Handle bulk actions
  const handleBulkAction = async (action: BulkAction) => {
    try {
      const response = await fetch('/api/properties/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.type,
          propertyIds: selectedProperties,
          data: action.data
        }),
      });

      if (response.ok) {
        // Refresh properties after bulk action
        await fetchProperties();
        setSelectedProperties([]);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  // Handle individual property actions
  const handlePropertyEdit = (propertyId: string) => {
    window.location.href = `/publicar?edit=${propertyId}`;
  };

  const handlePropertyDelete = async (propertyId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      try {
        const response = await fetch(`/api/properties/${propertyId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchProperties();
        }
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };

  const handlePropertyView = (propertyId: string) => {
    window.open(`/property/${propertyId}`, '_blank');
  };

  const handlePropertyPromote = (propertyId: string) => {
    window.location.href = `/publicar/premium?propertyId=${propertyId}`;
  };

  const handleToggleFeatured = async (propertyId: string) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featured: !property.featured
        }),
      });

      if (response.ok) {
        await fetchProperties();
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProperties(), fetchStats()]);
    setIsRefreshing(false);
  };

  // Effects
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (properties.length > 0) {
      fetchStats();
    }
  }, [fetchStats]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Requerido</h2>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus propiedades.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Propiedades</h1>
              <p className="text-gray-600 mt-1">
                Administra y controla todas tus propiedades desde un solo lugar
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Button
                onClick={() => window.location.href = '/publicar'}
                className="flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Propiedad
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="properties" className="flex items-center">
              <Grid3X3 className="w-4 h-4 mr-2" />
              Propiedades ({filteredProperties.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            {/* Filters */}
            <PropertyFilters
              onFiltersChange={setFilters}
              initialFilters={filters}
              totalCount={filteredProperties.length}
            />

            {/* Bulk Actions */}
            <BulkActions
              selectedItems={selectedProperties}
              totalItems={filteredProperties.length}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkAction={handleBulkAction}
              isLoading={isLoading}
            />

            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Vista:</span>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {filteredProperties.length} de {properties.length} propiedades
                </Badge>
              </div>
            </div>

            {/* Properties Grid/List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando propiedades...</p>
                </div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Grid3X3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron propiedades
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {properties.length === 0 
                      ? 'Aún no has publicado ninguna propiedad. ¡Comienza creando tu primera publicación!'
                      : 'No hay propiedades que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                    }
                  </p>
                  <Button
                    onClick={() => window.location.href = '/publicar'}
                    className="flex items-center mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Publicar Propiedad
                  </Button>
                </div>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onEdit={handlePropertyEdit}
                    onDelete={handlePropertyDelete}
                    onView={handlePropertyView}
                    onPromote={handlePropertyPromote}
                    onToggleFeatured={handleToggleFeatured}
                    isSelected={selectedProperties.includes(property.id)}
                    onSelect={handlePropertySelect}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {stats ? (
              <PropertyStats stats={stats} />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando estadísticas...</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
