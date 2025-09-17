import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from "@/utils";

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = toastIcons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className={cn(
      "flex items-start p-4 border rounded-lg shadow-lg transition-all duration-300 transform",
      toastStyles[type],
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    )}>
      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        {message && (
          <p className="mt-1 text-sm opacity-90">{message}</p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="ml-3 p-1 hover:bg-black/10 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
export const ToastContainer: React.FC<{ toasts: ToastProps[] }> = ({ toasts }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default Toast;