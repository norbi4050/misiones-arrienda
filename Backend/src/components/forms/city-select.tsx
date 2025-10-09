'use client'
import { useEffect, useMemo, useState } from 'react'

export function CitySelect({
  value,
  onChange,
  province = 'Misiones',
  name = 'city',
  placeholder = 'Seleccioná ciudad…'
}: {
  value?: string
  onChange: (v: string) => void
  province?: string
  name?: string
  placeholder?: string
}) {
  const [items, setItems] = useState<{name:string,department:string|null}[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const url = `/api/geo/cities?province=${encodeURIComponent(province)}${q ? `&q=${encodeURIComponent(q)}` : ''}`
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(d => setItems(d?.items ?? []))
      .catch(() => {})
    return () => controller.abort()
  }, [province, q])

  const id = useMemo(() => `cities-${province}`, [province])

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">Ciudad</label>
      <input
        list={id}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md px-3 py-2"
        autoComplete="off"
      />
      <datalist id={id}>
        {items.map((c, i) => (
          <option key={`${c.name}-${i}`} value={c.name}>
            {c.department ? `${c.name} (${c.department})` : c.name}
          </option>
        ))}
      </datalist>
    </div>
  )
}
