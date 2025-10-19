'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  place_id: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: AddressSuggestion) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
}

/**
 * Componente: Address Autocomplete con Nominatim (OpenStreetMap)
 *
 * - Autocomplete gratuito usando Nominatim
 * - Debounce de 500ms para limitar requests
 * - Filtrado para Argentina/Misiones
 * - Sin API key necesaria
 *
 * Uso: Mi Empresa - campo de dirección
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Ej: Av. Corrientes 1234, Posadas',
  disabled = false,
  className = '',
  error = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Buscar sugerencias con Nominatim
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      // Construir query para Argentina/Misiones
      const searchQuery = `${query}, Misiones, Argentina`
      const encodedQuery = encodeURIComponent(searchQuery)

      // Llamar a Nominatim con límite de resultados
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodedQuery}&` +
        `limit=5&` +
        `countrycodes=ar&` +
        `addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MisionesArrienda/1.0 (contact@misiones-arrienda.com)'
          }
        }
      )

      if (!response.ok) {
        console.warn('[AddressAutocomplete] Error en Nominatim:', response.status)
        setSuggestions([])
        return
      }

      const data = await response.json()
      setSuggestions(data || [])
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('[AddressAutocomplete] Error buscando direcciones:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar cambio de input con debounce
  const handleInputChange = (newValue: string) => {
    onChange(newValue)

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Nuevo timer con debounce de 500ms (respetar límite de Nominatim)
    debounceTimerRef.current = setTimeout(() => {
      searchAddress(newValue)
    }, 500)
  }

  // Manejar selección de sugerencia
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name)
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)

    // Notificar al padre si hay callback
    if (onSelect) {
      onSelect(suggestion)
    }
  }

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break

      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break

      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input con icono */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10 pr-10',
            error && 'border-red-500',
            className
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />
        )}
      </div>

      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                'flex items-start gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0',
                selectedIndex === index && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {suggestion.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mensaje de ayuda */}
      {value.length > 0 && value.length < 3 && !disabled && (
        <p className="text-xs text-gray-500 mt-1">
          Escribe al menos 3 caracteres para ver sugerencias
        </p>
      )}
    </div>
  )
}
