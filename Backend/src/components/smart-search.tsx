"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchSuggestion {
  id: string
  name: string
  type: 'city' | 'neighborhood' | 'area'
  province: string
}

interface SmartSearchProps {
  onSearch: (location: string) => void
  placeholder?: string
  className?: string
}

export function SmartSearch({ onSearch, placeholder = "Buscar por ubicación...", className = "" }: SmartSearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Datos de ubicaciones de Misiones (simulado - en producción vendría de la API)
  const misionesLocations: SearchSuggestion[] = [
    { id: '1', name: 'Posadas', type: 'city', province: 'Misiones' },
    { id: '2', name: 'Eldorado', type: 'city', province: 'Misiones' },
    { id: '3', name: 'Oberá', type: 'city', province: 'Misiones' },
    { id: '4', name: 'Puerto Iguazú', type: 'city', province: 'Misiones' },
    { id: '5', name: 'Apóstoles', type: 'city', province: 'Misiones' },
    { id: '6', name: 'Leandro N. Alem', type: 'city', province: 'Misiones' },
    { id: '7', name: 'San Vicente', type: 'city', province: 'Misiones' },
    { id: '8', name: 'Montecarlo', type: 'city', province: 'Misiones' },
    { id: '9', name: 'Puerto Rico', type: 'city', province: 'Misiones' },
    { id: '10', name: 'Jardín América', type: 'city', province: 'Misiones' },
    { id: '11', name: 'Villa Cabello', type: 'neighborhood', province: 'Misiones' },
    { id: '12', name: 'Centro', type: 'neighborhood', province: 'Misiones' },
    { id: '13', name: 'Villa Sarita', type: 'neighborhood', province: 'Misiones' },
    { id: '14', name: 'Itaembé Miní', type: 'neighborhood', province: 'Misiones' },
    { id: '15', name: 'Costanera Sur', type: 'area', province: 'Misiones' },
    { id: '16', name: 'Zona Norte', type: 'area', province: 'Misiones' },
  ]

  useEffect(() => {
    if (query.length >= 2) {
      const filtered = misionesLocations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6) // Máximo 6 sugerencias

      setSuggestions(filtered)
      setShowSuggestions(true)
      setSelectedIndex(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name)
    setShowSuggestions(false)
    onSearch(suggestion.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

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
          handleSuggestionClick(suggestions[selectedIndex])
        } else if (query.trim()) {
          setShowSuggestions(false)
          onSearch(query.trim())
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      onSearch(query.trim())
    }
  }

  const clearSearch = () => {
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'city':
        return '🏙️'
      case 'neighborhood':
        return '🏘️'
      case 'area':
        return '📍'
      default:
        return '📍'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'city':
        return 'Ciudad'
      case 'neighborhood':
        return 'Barrio'
      case 'area':
        return 'Zona'
      default:
        return 'Ubicación'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <Button
          type="submit"
          className="absolute right-1 top-1 bottom-1 px-4 rounded-md"
          disabled={!query.trim()}
        >
          Buscar
        </Button>
      </form>

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{suggestion.name}</div>
                <div className="text-sm text-gray-500">
                  {getTypeLabel(suggestion.type)} • {suggestion.province}
                </div>
              </div>
              <MapPin className="h-4 w-4 text-gray-400" />
            </button>
          ))}

          {query.length >= 2 && (
            <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
              💡 Tip: Usa las flechas ↑↓ para navegar y Enter para seleccionar
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar sugerencias */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}
