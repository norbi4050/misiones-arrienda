"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save,
  RotateCcw
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
      featured?: boolean;
      rating?: number;
    }>;
    conversionRate?: number;
  };
  detailedStates?: {
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
  };
  featuredProperties?: Array<{
    id: string;
    title: string;
    price: number;
    views: number;
    featured: boolean;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface DashboardState {
  filters: PropertyFiltersType;
  selectedProperties: string[];
  viewMode: 'grid' | 'list';
  pagination: PaginationState;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  savedFilters: { [key: string]: PropertyFiltersType };
}

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];
const STORAGE_KEY = 'property-dashboard-state';

export default function PropertiesManagementPage() {
  const { user } = useAuth();
  
  // State management optimizado
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [paginatedProperties, setPaginatedProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard state con persistencia
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    filters: {
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
    },
    selectedProperties: [],
    viewMode: 'grid',
    pagination: {
      currentPage: 1,
      itemsPerPage: 12,
      totalItems: 0,
      totalPages: 0
    },
    sortBy: 'createdAt',
    sortOrder: 'desc',
    savedFilters: {}
  });

  // Load persisted state
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setDashboardState(prev => ({
          ...prev,
          ...parsedState,
          selectedProperties: [] // Reset selections on load
        }));
      } catch (error) {
        console.error('Error loading dashboard state:', error);
      }
    }
  }, []);

  // Persist state changes
  const updateDashboardState = useCallback((updates: Partial<DashboardState>) => {
    setDashboardState(prev => {
      const newState = { ...prev, ...updates };
      // Save to localStorage (excluding selectedProperties for security)
      const stateToSave = {
        ...newState,
        selectedProperties: []
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      return newState;
    });
  }, []);

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/properties/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      } else {
        throw new Error('Error al cargar propiedades');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch analytics/stats with enhanced data
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/properties/analytics/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Generate enhanced mock stats
        generateEnhancedMockStats();
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      generateEnhancedMockStats();
    }
  }, [user?.id, properties]);

  // Generate enhanced mock stats
  const generateEnhancedMockStats = useCallback(() => {
    if (properties.length === 0) return;

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalViews = 0;
    let totalInquiries = 0;
    let totalFavorites = 0;
    let totalPrice = 0;

    properties.forEach(property => {
      byStatus[property.status] = (byStatus[property.status] || 0) + 1;
      byType[property.propertyType] = (byType[property.propertyType] || 0) + 1;
      totalViews += property.views || Math.floor(Math.random() * 100);
      totalInquiries += property.inquiries || Math.floor(Math.random() * 20);
      totalFavorites += property.favorites || Math.floor(Math.random() * 15);
      totalPrice += property.price;
    });

    const featuredProps = properties.filter(p => p.featured);
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
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.title,
            views: p.views || Math.floor(Math.random() * 100),
            inquiries: p.inquiries || Math.floor(Math.random() * 20),
            featured: p.featured,
            rating: Math.floor(Math.random() * 5) + 1
          })),
        conversionRate: Math.random() * 10 + 5
      },
      detailedStates: {
        pending: Math.floor(properties.length * 0.2),
        approved: Math.floor(properties.length * 0.6),
        rejected: Math.floor(properties.length * 0.1),
        draft: Math.floor(properties.length * 0.1)
      },
      featuredProperties: featuredProps.slice(0, 3).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        views: p.views || Math.floor(Math.random() * 100),
        featured: p.featured,
        priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      }))
    };

    setStats(mockStats);
  }, [properties]);

  // Advanced filtering with memoization
  const applyFilters = useMemo(() => {
    let filtered = [...properties];
    const { filters } = dashboardState;

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
      let aValue: any = a[dashboardState.sortBy as keyof Property];
      let bValue: any = b[dashboardState.sortBy as keyof Property];

      if (dashboardState.sortBy === 'price' || dashboardState.sortBy === 'area') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (dashboardState.sortBy === 'createdAt' || dashboardState.sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (dashboardState.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [properties, dashboardState.filters, dashboardState.sortBy, dashboardState.sortOrder]);

  // Pagination logic
  const applyPagination = useMemo(() => {
    const { currentPage, itemsPerPage } = dashboardState.pagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const totalItems = filteredProperties.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Update pagination state if needed
    if (dashboardState.pagination.totalItems !== totalItems || 
        dashboardState.pagination.totalPages !== totalPages) {
      updateDashboardState({
        pagination: {
          ...dashboardState.pagination,
          totalItems,
          totalPages,
          currentPage: currentPage > totalPages ? 1 : currentPage
        }
      });
    }

    return filteredProperties.slice(startIndex, endIndex);
  }, [filteredProperties, dashboardState.pagination, updateDashboardState]);

  // Update filtered and paginated properties
  useEffect(() => {
    setFilteredProperties(applyFilters);
  }, [applyFilters]);

  useEffect(() => {
    setPaginatedProperties(applyPagination);
  }, [applyPagination]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: PropertyFiltersType) => {
    updateDashboardState({
      filters: newFilters,
      pagination: { ...dashboardState.pagination, currentPage: 1 }
    });
  }, [dashboardState.pagination, updateDashboardState]);

  // Handle property selection
  const handlePropertySelect = useCallback((propertyId: string, selected: boolean) => {
    const newSelected = selected 
      ? [...dashboardState.selectedProperties, propertyId]
      : dashboardState.selectedProperties.filter(id => id !== propertyId);
    
    updateDashboardState({ selectedProperties: newSelected });
  }, [dashboardState.selectedProperties, updateDashboardState]);

  const handleSelectAll = useCallback((selected: boolean) => {
    const newSelected = selected ? paginatedProperties.map(p => p.id) : [];
    updateDashboardState({ selectedProperties: newSelected });
  }, [paginatedProperties, updateDashboardState]);

  const handleClearSelection = useCallback(() => {
    updateDashboardState({ selectedProperties: [] });
  }, [updateDashboardState]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    updateDashboardState({
      pagination: { ...dashboardState.pagination, currentPage: page }
    });
  }, [dashboardState.pagination, updateDashboardState]);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    updateDashboardState({
      pagination: { 
        ...dashboardState.pagination, 
        itemsPerPage, 
        currentPage: 1 
      }
    });
  }, [dashboardState.pagination, updateDashboardState]);

  // Save and load filter presets
  const handleSaveFilterPreset = useCallback((name: string) => {
    const newSavedFilters = {
      ...dashboardState.savedFilters,
      [name]: dashboardState.filters
    };
    updateDashboardState({ savedFilters: newSavedFilters });
  }, [dashboardState.filters, dashboardState.savedFilters, updateDashboardState]);

  const handleLoadFilterPreset = useCallback((name: string) => {
    const preset = dashboardState.savedFilters[name];
    if (preset) {
      updateDashboardState({
        filters: preset,
        pagination: { ...dashboardState.pagination, currentPage: 1 }
      });
    }
  }, [dashboardState.savedFilters, dashboardState.pagination, updateDashboardState]);

  const handleResetFilters = useCallback(() => {
    const defaultFilters: PropertyFiltersType = {
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
    updateDashboardState({
      filters: defaultFilters,
      pagination: { ...dashboardState.pagination, currentPage: 1 }
    });
  }, [dashboardState.pagination, updateDashboardState]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: BulkAction) => {
    try {
      const response = await fetch('/api/properties/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.type,
          propertyIds: dashboardState.selectedProperties,
          data: action.data
        }),
      });

      if (response.ok) {
        await fetchProperties();
        updateDashboardState({ selectedProperties: [] });
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  }, [dashboardState.selectedProperties, fetchProperties, updateDashboardState]);

  // Individual property actions
  const handlePropertyEdit = useCallback((propertyId: string) => {
    window.location.href = `/publicar?edit=${propertyId}`;
  }, []);

  const handlePropertyDelete = useCallback(async (propertyId: string) => {
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
  }, [fetchProperties]);

  const handlePropertyView = useCallback((propertyId: string) => {
    window.open(`/property/${propertyId}`, '_blank');
  }, []);

  const handlePropertyPromote = useCallback((propertyId: string) => {
    window.location.href = `/publicar/premium?propertyId=${propertyId}`;
  }, []);

  const handleToggleFeatured = useCallback(async (propertyId: string) => {
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
  }, [properties, fetchProperties]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProperties(), fetchStats()]);
    setIsRefreshing(false);
  }, [fetchProperties, fetchStats]);

  // Effects
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (properties.length > 0) {
      fetchStats();
    }
  }, [fetchStats]);

  // Render pagination controls
  const renderPaginationControls = () => {
    const { currentPage, totalPages, itemsPerPage } = dashboardState.pagination;
    
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Mostrar:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">por página</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

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
            {/* Advanced Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="flex items-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Limpiar
                  </Button>
                  {Object.keys(dashboardState.savedFilters).length > 0 && (
                    <select
                      onChange={(e) => e.target.value && handleLoadFilterPreset(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                      defaultValue=""
                    >
                      <option value="">Cargar filtro guardado</option>
                      {Object.keys(dashboardState.savedFilters).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <PropertyFilters
                onFiltersChange={handleFiltersChange}
                initialFilters={dashboardState.filters}
                totalCount={filteredProperties.length}
              />
            </div>

            {/* Bulk Actions */}
            <BulkActions
              selectedItems={dashboardState.selectedProperties}
              totalItems={paginatedProperties.length}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkAction={handleBulkAction}
              isLoading={isLoading}
            />

            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Vista:</span>
                  <div className="flex border rounded-lg">
                    <Button
                      variant={dashboardState.viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => updateDashboardState({ viewMode: 'grid' })}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={dashboardState.viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => updateDashboardState({ viewMode: 'list' })}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Ordenar por:</span>
                  <select
                    value={dashboardState.sortBy}
                    onChange={(e) => updateDashboardState({ sortBy: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="createdAt">Fecha de creación</option>
                    <option value="updatedAt">Última actualización</option>
                    <option value="price">Precio</option>
                    <option value="title">Título</option>
                    <option value="views">Vistas</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateDashboardState({ 
                      sortOrder: dashboardState.sortOrder === 'asc' ? 'desc' : 'asc' 
                    })}
                  >
                    {dashboardState.sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {paginatedProperties.length} de {filteredProperties.length} propiedades
                </Badge>
                {filteredProperties.length !== properties.length && (
                  <Badge variant="outline">
                    {properties.length} total
                  </Badge>
                )}
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
            ) : error ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar propiedades</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <Button onClick={handleRefresh} className="flex items-center mx-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
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
              <>
                <div className={
                  dashboardState.viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {paginatedProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onEdit={handlePropertyEdit}
                      onDelete={handlePropertyDelete}
                      onView={handlePropertyView}
                      onPromote={handlePropertyPromote}
                      onToggleFeatured={handleToggleFeatured}
                      isSelected={dashboardState.selectedProperties.includes(property.id)}
                      onSelect={handlePropertySelect}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {renderPaginationControls()}
              </>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {stats ? (
              <PropertyStats 
                stats={stats} 
                loading={isLoading}
                error={error}
                onRefresh={handleRefresh}
                onRetry={handleRefresh}
              />
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
