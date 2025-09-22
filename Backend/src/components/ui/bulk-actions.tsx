"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckSquare,
  Square,
  Trash2,
  Edit,
  Star,
  StarOff,
  Eye,
  EyeOff,
  FolderArchive as Archive,
  ArchiveRestore,
  ArrowDown as Download,
  Upload,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2 as Check,
  X
} from 'lucide-react';

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  onBulkAction: (action: BulkAction, data?: any) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export interface BulkAction {
  type: 'delete' | 'update-status' | 'toggle-featured' | 'archive' | 'export' | 'duplicate';
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresConfirmation?: boolean;
  data?: any;
}

const statusOptions = [
  { value: 'AVAILABLE', label: 'Disponible', color: 'bg-green-100 text-green-800' },
  { value: 'RENTED', label: 'Alquilado', color: 'bg-blue-100 text-blue-800' },
  { value: 'SOLD', label: 'Vendido', color: 'bg-gray-100 text-gray-800' },
  { value: 'MAINTENANCE', label: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'RESERVED', label: 'Reservado', color: 'bg-purple-100 text-purple-800' },
  { value: 'EXPIRED', label: 'Expirado', color: 'bg-red-100 text-red-800' }
];

export function BulkActions({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  isLoading = false,
  className = ''
}: BulkActionsProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<BulkAction | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;
  const hasSelection = selectedItems.length > 0;
  const selectionPercentage = totalItems > 0 ? Math.round((selectedItems.length / totalItems) * 100) : 0;

  const handleSelectAll = () => {
    onSelectAll(!isAllSelected);
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setShowConfirmDialog(action);
      return;
    }

    await executeBulkAction(action);
  };

  const executeBulkAction = async (action: BulkAction) => {
    try {
      setActionInProgress(action.type);
      await onBulkAction(action);
      setShowConfirmDialog(null);
    } catch (error) {
      console.error('Error executing bulk action:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStatusChange = async (status: string) => {
    const action: BulkAction = {
      type: 'update-status',
      label: `Cambiar a ${statusOptions.find(s => s.value === status)?.label}`,
      icon: <Edit className="w-4 h-4" />,
      data: { status }
    };

    await executeBulkAction(action);
    setShowStatusMenu(false);
  };

  const bulkActions: BulkAction[] = [
    {
      type: 'update-status',
      label: 'Cambiar Estado',
      icon: <Edit className="w-4 h-4" />,
      variant: 'outline'
    },
    {
      type: 'toggle-featured',
      label: 'Destacar/Quitar',
      icon: <Star className="w-4 h-4" />,
      variant: 'outline'
    },
    {
      type: 'archive',
      label: 'Archivar',
      icon: <Archive className="w-4 h-4" />,
      variant: 'outline',
      requiresConfirmation: true
    },
    {
      type: 'export',
      label: 'Exportar',
      icon: <Download className="w-4 h-4" />,
      variant: 'outline'
    },
    {
      type: 'duplicate',
      label: 'Duplicar',
      icon: <Upload className="w-4 h-4" />,
      variant: 'outline',
      requiresConfirmation: true
    },
    {
      type: 'delete',
      label: 'Eliminar',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'destructive',
      requiresConfirmation: true
    }
  ];

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`bg-white border rounded-lg p-3 md:p-4 shadow-sm ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Selection Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center justify-center w-5 h-5 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label={isAllSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : isPartiallySelected ? (
                  <div className="w-2 h-2 bg-blue-600 rounded-sm" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {selectedItems.length} de {totalItems} seleccionados
                </span>

                <div className="flex items-center gap-2">
                  {hasSelection && (
                    <Badge variant="secondary" className="text-xs">
                      {selectionPercentage}%
                    </Badge>
                  )}

                  {selectedItems.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {selectedItems.length}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
                aria-label="Limpiar selección"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Limpiar selección</span>
                <span className="sm:hidden">Limpiar</span>
              </Button>

              {/* Select All/None Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectAll(!isAllSelected)}
                className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
                aria-label={isAllSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
              >
                {isAllSelected ? (
                  <>
                    <Square className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Deseleccionar todo</span>
                    <span className="sm:hidden">Ninguno</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Seleccionar todo</span>
                    <span className="sm:hidden">Todo</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {bulkActions.map((action) => {
              if (action.type === 'update-status') {
                return (
                  <div key={action.type} className="relative">
                    <Button
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      disabled={isLoading || actionInProgress !== null}
                      className="flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                    >
                      {actionInProgress === action.type ? (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-1 sm:mr-2" />
                      ) : (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2">
                          {action.icon}
                        </div>
                      )}
                      <span className="hidden sm:inline">{action.label}</span>
                      <span className="sm:hidden">Estado</span>
                    </Button>

                    {/* Status Dropdown */}
                    {showStatusMenu && (
                      <div className="absolute top-full left-0 mt-1 w-40 sm:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          {statusOptions.map((status) => (
                            <button
                              key={status.value}
                              onClick={() => handleStatusChange(status.value)}
                              className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>{status.label}</span>
                              <Badge className={`${status.color} text-xs`}>
                                {status.label}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Button
                  key={action.type}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => handleBulkAction(action)}
                  disabled={isLoading || actionInProgress !== null}
                  className="flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  {actionInProgress === action.type ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-1 sm:mr-2" />
                  ) : (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2">
                      {action.icon}
                    </div>
                  )}
                  <span className="hidden sm:inline">{action.label}</span>
                  <span className="sm:hidden">
                    {action.type === 'delete' ? 'Del' :
                     action.type === 'toggle-featured' ? 'Star' :
                     action.type === 'archive' ? 'Arch' :
                     action.type === 'export' ? 'Exp' :
                     action.type === 'duplicate' ? 'Dup' : action.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Progress Indicator */}
        {actionInProgress && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
              <span>
                Procesando {selectedItems.length} propiedades...
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div
                className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300 animate-pulse"
                style={{ width: `${selectionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {hasSelection && !actionInProgress && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>
                  <strong>{selectedItems.length}</strong> elementos seleccionados
                </span>
                <span>
                  <strong>{selectionPercentage}%</strong> del total
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  {totalItems - selectedItems.length} sin seleccionar
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mr-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Acción
                </h3>
                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                ¿Estás seguro de que quieres <strong>{showConfirmDialog.label.toLowerCase()}</strong> las{' '}
                <strong>{selectedItems.length}</strong> propiedades seleccionadas?
              </p>

              {showConfirmDialog.type === 'delete' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Advertencia:</strong> Esta acción eliminará permanentemente las propiedades seleccionadas.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(null)}
                disabled={actionInProgress !== null}
              >
                Cancelar
              </Button>
              <Button
                variant={showConfirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={() => executeBulkAction(showConfirmDialog)}
                disabled={actionInProgress !== null}
                className="flex items-center"
              >
                {actionInProgress === showConfirmDialog.type ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close status menu */}
      {showStatusMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowStatusMenu(false)}
        />
      )}
    </>
  );
}
