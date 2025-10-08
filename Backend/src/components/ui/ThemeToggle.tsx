'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Componente: Theme Toggle (Dark Mode)
 * 
 * Toggle para cambiar entre modo claro y oscuro:
 * - Icono sol/luna
 * - Persistencia en localStorage
 * - Transición suave
 * - Accesible
 * 
 * Uso: Header del perfil público y navbar
 * 
 * NOTA: Requiere next-themes instalado (npm install next-themes)
 * y ThemeProvider configurado en layout.tsx
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Leer tema del localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // Aplicar tema al documento
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Guardar en localStorage
    localStorage.setItem('theme', newTheme);
    
    // Aplicar al documento
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // No renderizar hasta que esté montado (evita flash)
  if (!mounted) {
    return (
      <div className={`w-10 h-10 ${className}`}></div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
}
