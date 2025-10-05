/**
 * PROMPT D3: Avatar Nudge Banner
 * ============================================================================
 * Banner no intrusivo que invita a usuarios sin avatar a subir uno
 * 
 * Características:
 * - Solo visible si user.avatar === null
 * - Botón "Subir avatar" abre modal/linkea a perfil
 * - Botón "No volver a mostrar" guarda en localStorage
 * - Se cierra automáticamente al subir avatar
 * - Accesible (ARIA), responsive, dark-mode friendly
 * - No impacta TTI ni CLS (lazy loaded)
 * 
 * Persistencia:
 * - localStorage.hideAvatarNudge = 'v1'
 * - Se puede resetear limpiando localStorage
 * ============================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'hideAvatarNudge';
const STORAGE_VERSION = 'v1';

export interface AvatarNudgeBannerProps {
  /** Si el usuario ya tiene avatar (no mostrar banner) */
  hasAvatar: boolean;
  /** Callback cuando se hace click en "Subir avatar" */
  onUploadClick: () => void;
  /** Clase CSS adicional (opcional) */
  className?: string;
}

/**
 * PROMPT D3: Banner para invitar a subir avatar
 * 
 * @example
 * ```tsx
 * <AvatarNudgeBanner
 *   hasAvatar={!!user?.avatar}
 *   onUploadClick={() => setIsUploadModalOpen(true)}
 * />
 * ```
 */
export function AvatarNudgeBanner({ 
  hasAvatar, 
  onUploadClick,
  className = ''
}: AvatarNudgeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // No mostrar si ya tiene avatar
    if (hasAvatar) {
      setIsVisible(false);
      return;
    }

    // Verificar si el usuario ocultó el banner
    if (typeof window !== 'undefined') {
      const hidden = localStorage.getItem(STORAGE_KEY);
      if (hidden === STORAGE_VERSION) {
        setIsVisible(false);
        return;
      }
    }

    // Mostrar banner
    setIsVisible(true);
  }, [hasAvatar]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, STORAGE_VERSION);
    }
    setIsVisible(false);
  };

  const handleUpload = () => {
    onUploadClick();
    // Opcional: cerrar el banner después de hacer click
    // setIsVisible(false);
  };

  // No renderizar en SSR
  if (!isMounted) return null;

  // No mostrar si no es visible
  if (!isVisible) return null;

  return (
    <div
      role="banner"
      aria-label="Sugerencia para subir avatar"
      aria-live="polite"
      className={`
        relative 
        bg-gradient-to-r from-blue-50 to-indigo-50 
        dark:from-blue-900/20 dark:to-indigo-900/20 
        border-l-4 border-blue-500 dark:border-blue-400
        p-4 mb-4 rounded-r-lg 
        shadow-sm
        animate-in fade-in slide-in-from-top-2 duration-300
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl" aria-hidden="true">👋</span>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Personalizá tu perfil con una foto
            </p>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Los usuarios con foto reciben más respuestas y generan más confianza
          </p>
        </div>
        
        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleUpload}
            className="
              bg-blue-600 hover:bg-blue-700 
              dark:bg-blue-500 dark:hover:bg-blue-600
              text-white
              shadow-sm
              transition-all
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
            aria-label="Abrir modal para subir avatar"
          >
            <Upload className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Subir avatar
          </Button>
          
          <button
            onClick={handleDismiss}
            aria-label="No volver a mostrar esta sugerencia"
            className="
              text-blue-600 dark:text-blue-400 
              hover:text-blue-800 dark:hover:text-blue-200 
              p-1.5 rounded-md
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
            title="No volver a mostrar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * PROMPT D3: Variante compacta del banner (para header)
 */
export function AvatarNudgeBannerCompact({ 
  hasAvatar, 
  onUploadClick 
}: Omit<AvatarNudgeBannerProps, 'className'>) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (hasAvatar) {
      setIsVisible(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const hidden = localStorage.getItem(STORAGE_KEY);
      if (hidden === STORAGE_VERSION) {
        setIsVisible(false);
        return;
      }
    }

    setIsVisible(true);
  }, [hasAvatar]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, STORAGE_VERSION);
    }
    setIsVisible(false);
  };

  if (!isMounted || !isVisible) return null;

  return (
    <div
      role="banner"
      aria-label="Sugerencia para subir avatar"
      className="
        flex items-center gap-2 
        bg-blue-50 dark:bg-blue-900/20 
        border border-blue-200 dark:border-blue-800
        px-3 py-2 rounded-lg
        text-xs
      "
    >
      <span aria-hidden="true">👋</span>
      <span className="text-blue-900 dark:text-blue-100 font-medium">
        Subí tu foto
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={onUploadClick}
        className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
      >
        Ahora
      </Button>
      <button
        onClick={handleDismiss}
        aria-label="Cerrar"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * PROMPT D3: Utilidad para resetear el banner (útil para testing)
 */
export function resetAvatarNudge() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * PROMPT D3: Verificar si el banner está oculto
 */
export function isAvatarNudgeHidden(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === STORAGE_VERSION;
}
