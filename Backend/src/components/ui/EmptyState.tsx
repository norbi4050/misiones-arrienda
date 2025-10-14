import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Componente reutilizable para mostrar estados vacíos o avisos de acceso
 * UX: Diseño centrado, limpio y accesible
 */
export function EmptyState({ title, description, actions, icon }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full text-center">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {icon && (
            <div className="flex justify-center mb-4">
              {icon}
            </div>
          )}
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            {title}
          </h2>
          
          {description && (
            <p className="text-gray-600 mb-6 leading-relaxed">
              {description}
            </p>
          )}
          
          {actions && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
