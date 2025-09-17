'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Search, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface SearchHistoryItem {
  id: string;
  searchTerm: string;
  filters?: string;
  resultsCount: number;
  createdAt: string;
}

interface SearchHistoryProps {
  onSearchSelect?: (searchTerm: string, filters?: any) => void;
  className?: string;
  maxItems?: number;
}

export function SearchHistory({
  onSearchSelect,
  className = '',
  maxItems = 10
}: SearchHistoryProps) {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user && showHistory) {
      loadSearchHistory();
    }
  }, [user, showHistory]);

  const loadSearchHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search-history?limit=${maxItems}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.searchHistory);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast.error('Error al cargar el historial de búsquedas');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearch = async (searchTerm: string, filters?: any, resultsCount?: number) => {
    if (!user || !searchTerm.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await fetch('/api/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          filters,
          resultsCount: resultsCount || 0
        })
      });

      // Recargar historial si está visible
      if (showHistory) {
        loadSearchHistory();
      }
    } catch (error) {
      console.error('Error al guardar búsqueda:', error);
    }
  };

  const deleteSearchItem = async (searchId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search-history?searchId=${searchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSearchHistory(prev => prev.filter(item => item.id !== searchId));
        toast.success('Búsqueda eliminada del historial');
      }
    } catch (error) {
      console.error('Error al eliminar búsqueda:', error);
      toast.error('Error al eliminar la búsqueda');
    }
  };

  const clearAllHistory = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/search-history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSearchHistory([]);
        toast.success('Historial limpiado exitosamente');
      }
    } catch (error) {
      console.error('Error al limpiar historial:', error);
      toast.error('Error al limpiar el historial');
    }
  };

  const handleSearchSelect = (item: SearchHistoryItem) => {
    if (onSearchSelect) {
      const filters = item.filters ? JSON.parse(item.filters) : undefined;
      onSearchSelect(item.searchTerm, filters);
    }
    setShowHistory(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Botón para mostrar/ocultar historial */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2"
      >
        <Clock size={16} />
        Historial
      </Button>

      {/* Panel de historial */}
      {showHistory && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Búsquedas Recientes</h3>
            <div className="flex items-center gap-2">
              {searchHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllHistory}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Cargando historial...
              </div>
            ) : searchHistory.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Search size={24} className="mx-auto mb-2 opacity-50" />
                <p>No hay búsquedas recientes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer group flex items-center justify-between"
                    onClick={() => handleSearchSelect(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Search size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {item.searchTerm}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDate(item.createdAt)}</span>
                        <span>{item.resultsCount} resultado{item.resultsCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSearchItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook personalizado para usar el historial de búsquedas
export function useSearchHistory() {
  const { user } = useAuth();

  const saveSearch = async (searchTerm: string, filters?: any, resultsCount?: number) => {
    if (!user || !searchTerm.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await fetch('/api/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim(),
          filters,
          resultsCount: resultsCount || 0
        })
      });
    } catch (error) {
      console.error('Error al guardar búsqueda:', error);
    }
  };

  return { saveSearch };
}
