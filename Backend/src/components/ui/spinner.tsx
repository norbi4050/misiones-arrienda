import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-current border-t-transparent",
      sizeClasses[size],
      colorClasses[color],
      className
    )}>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

// Loading Overlay Component
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  className?: string;
}> = ({ isLoading, message = 'Cargando...', className }) => {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-white/80 backdrop-blur-sm",
      "flex items-center justify-center z-50",
      className
    )}>
      <div className="flex flex-col items-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default Spinner;