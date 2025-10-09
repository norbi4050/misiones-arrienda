'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Primitive = string | number | boolean | null | undefined
type StateRecord = Record<string, Primitive>

/**
 * useQueryParamsState
 * - Hidrata el estado inicial desde searchParams al montar
 * - Actualiza la URL (replace) con debounce (300ms) cuando cambia el estado vía set()
 * - Limpia parámetros vacíos (undefined, null, '', false)
 * - Devuelve { state, set, reset }
 *
 * Ejemplo:
 * const { state, set } = useQueryParamsState({ q: '', city: '', min: '', max: '', role: '' })
 * set('city', 'Posadas')
 */
export function useQueryParamsState<T extends StateRecord>(defaults: T, debounceMs = 300) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Estado interno
  const [state, setState] = useState<T>(defaults)

  // Ref para evitar actualizar URL durante la hidratación inicial
  const didHydrateRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Helper: parsear strings a tipos primitivos (number/bool) si corresponde
  const parseValue = (key: string, value: string): Primitive => {
    // Si el default es number, convertir
    const def = (defaults as any)[key]
    if (typeof def === 'number') {
      const n = Number(value)
      return isNaN(n) ? def : n
    }
    // Si el default es boolean, convertir "true"/"false"
    if (typeof def === 'boolean') {
      if (value === 'true') return true
      if (value === 'false') return false
      return def
    }
    // Dejar string por defecto
    return value
  }

  // Hidratación inicial desde la URL
  useEffect(() => {
    if (didHydrateRef.current) return

    const entries: [string, Primitive][] = Object.keys(defaults).map((key) => {
      const sp = searchParams.get(key)
      if (sp === null || sp === undefined) {
        return [key, defaults[key]]
      }
      const parsed = parseValue(key, sp)
      // Si viene vacío, mantener default
      if (parsed === '' || parsed === null) {
        return [key, defaults[key]]
      }
      return [key, parsed]
    })

    setState(Object.fromEntries(entries) as T)
    didHydrateRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Construye URLSearchParams desde el estado actual, limpiando valores vacíos
  const buildParamsFromState = useMemo(() => {
    return (s: T) => {
      const params = new URLSearchParams()
      for (const [key, val] of Object.entries(s)) {
        if (val === undefined || val === null) continue
        if (typeof val === 'string' && val.trim() === '') continue
        if (typeof val === 'boolean') {
          if (val) params.set(key, 'true')
          continue
        }
        params.set(key, String(val))
      }
      return params
    }
  }, [])

  // Actualiza la URL con replace (debounced)
  const updateUrlDebounced = (next: T) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = buildParamsFromState(next)
      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      router.replace(url, { scroll: false })
    }, debounceMs)
  }

  // API: set(key, value) con merge-in
  const set = (key: keyof T, value: Primitive) => {
    setState((prev) => {
      const next = { ...prev, [key]: value } as T
      updateUrlDebounced(next)
      return next
    })
  }

  // API: reset() al default
  const reset = () => {
    setState(defaults)
    updateUrlDebounced(defaults)
  }

  return { state, set, reset }
}
