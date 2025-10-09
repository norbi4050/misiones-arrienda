'use client';

import type { PlanLimitError } from '@/types/plan-limits';

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: PlanLimitError;
}

export function UpsellModal({ isOpen, onClose, error }: UpsellModalProps) {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-bold">Mejora tu Plan</h3>
        </div>

        {/* Mensaje */}
        <p className="text-gray-700 mb-4">{error.message}</p>

        {/* Detalles del límite */}
        {error.error === 'PLAN_LIMIT' && error.limit && error.current_usage !== undefined && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Uso actual:</span>
                <span className="font-semibold">{error.current_usage} / {error.limit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${(error.current_usage / error.limit) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Información del plan requerido */}
        {error.error === 'PLAN_REQUIRED' && error.required_plan && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <p className="text-sm text-blue-800">
              Esta característica está disponible en el plan <strong>{error.required_plan.toUpperCase()}</strong>.
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Planes
          </button>
        </div>
      </div>
    </div>
  );
}
