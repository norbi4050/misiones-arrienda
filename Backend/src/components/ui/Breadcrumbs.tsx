'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string; // Si no tiene href, es el último item (actual)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Componente: Breadcrumbs (Migas de Pan)
 * 
 * Navegación jerárquica con:
 * - Separadores con "/"
 * - Último item sin link (página actual)
 * - Responsive (colapsa en mobile)
 * - Icono de home al inicio
 * 
 * Uso: Perfiles públicos y páginas con navegación jerárquica
 */
export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-sm ${className}`}
    >
      {/* Home icon */}
      <Link
        href="/"
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label="Inicio"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {/* Separador */}
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />

            {/* Item */}
            {isLast || !item.href ? (
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px] md:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors truncate max-w-[150px] md:max-w-none"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
