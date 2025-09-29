// src/app/mi-cuenta/publicaciones/mis-publicaciones-client.tsx
'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

type Property = {
  id: string
  title: string | null
  price: number | null
  status: 'DRAFT' | 'PUBLISHED' | 'AVAILABLE' | 'ARCHIVED' | 'RESERVED' | 'RENTED' | 'SOLD'
  is_active: boolean | null
  expires_at: string | null
  created_at: string | null
  updated_at: string | null
  city: string | null
  province: string | null
  images: string[] | null
}

type Props = {
  initialItems: Property[]
}

function fmtMoney(n: number | null) {
  if (!n && n !== 0) return '—'
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return String(n)
  }
}

function daysUntil(dateIso: string | null) {
  if (!dateIso) return null
  const now = new Date()
  const t = new Date(dateIso)
  const diff = Math.ceil((t.getTime() - now.getTime()) / 86400000)
  return diff
}

function statusBadge(s: Property['status']) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium'
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-yellow-100 text-yellow-800',
    RESERVED: 'bg-blue-100 text-blue-800',
    RENTED: 'bg-purple-100 text-purple-800',
    SOLD: 'bg-red-100 text-red-800',
  }
  return <span className={`${base} ${map[s] || 'bg-gray-100 text-gray-800'}`}>{s}</span>
}

export default function MisPublicacionesClient({ initialItems }: Props) {
  const [items, setItems] = useState<Property[]>(initialItems)
  const [tab, setTab] = useState<'publicadas' | 'borradores' | 'archivadas'>('publicadas')
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (tab === 'borradores') return items.filter(i => i.status === 'DRAFT')
    if (tab === 'archivadas') return items.filter(i => i.status === 'ARCHIVED')
    // publicadas = PUBLISHED o AVAILABLE
    return items.filter(i => i.status === 'PUBLISHED' || i.status === 'AVAILABLE')
  }, [items, tab])

  const counters = useMemo(() => {
    return {
      publicadas: items.filter(i => i.status === 'PUBLISHED' || i.status === 'AVAILABLE').length,
      borradores: items.filter(i => i.status === 'DRAFT').length,
      archivadas: items.filter(i => i.status === 'ARCHIVED').length,
    }
  }, [items])

  async function callAction(id: string, action: 'publish' | 'renew' | 'archive') {
    setBusyId(id)
    try {
      const resp = await fetch(`/api/properties/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || data?.ok === false) {
        throw new Error(data?.error || `No se pudo ${action}`)
      }

      // Actualizamos estado local sin recargar
      startTransition(() => {
        setItems(prev =>
          prev.map(p => {
            if (p.id !== id) return p
            if (action === 'publish') {
              const plus30 = new Date()
              plus30.setDate(plus30.getDate() + 30)
              return {
                ...p,
                status: 'PUBLISHED',
                is_active: true,
                expires_at: plus30.toISOString(),
              }
            }
            if (action === 'renew') {
              const base = p.expires_at ? new Date(p.expires_at) : new Date()
              const plus30 = new Date(base.getTime())
              plus30.setDate(plus30.getDate() + 30)
              return { ...p, expires_at: plus30.toISOString(), is_active: true }
            }
            if (action === 'archive') {
              return { ...p, status: 'ARCHIVED', is_active: false }
            }
            return p
          })
        )
      })

      const nice =
        action === 'publish'
          ? '¡Publicada!'
          : action === 'renew'
          ? '¡Renovada +30 días!'
          : 'Archivada'
      toast.success(nice)
    } catch (e: any) {
      toast.error(e?.message || 'Acción fallida')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/properties/${id}/delete`, {
          method: 'DELETE',
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.ok === false) {
          toast.error(data?.error ?? 'No se pudo eliminar')
          return
        }
        setItems(prev => prev.filter(p => p.id !== id))
        toast.success('Publicación eliminada')
      } catch (err: any) {
        toast.error(err?.message || 'Error al eliminar')
      }
    })
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['publicadas', 'borradores', 'archivadas'] as const).map(key => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              tab === key ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            {key === 'publicadas' && `Publicadas (${counters.publicadas})`}
            {key === 'borradores' && `Borradores (${counters.borradores})`}
            {key === 'archivadas' && `Archivadas (${counters.archivadas})`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mt-6 grid grid-cols-1 gap-4">
        {filtered.length === 0 && (
          <div className="text-gray-500 text-sm">No hay propiedades en esta pestaña.</div>
        )}

        {filtered.map(p => {
          const cover =
            (Array.isArray(p.images) && p.images[0]) || '/placeholder-apartment-1.jpg'
          const dleft = daysUntil(p.expires_at)
          const soon = typeof dleft === 'number' && dleft <= 5

          const canPublish = p.status === 'DRAFT' || p.status === 'ARCHIVED'
          const canRenew = (p.status === 'PUBLISHED' || p.status === 'AVAILABLE') && typeof dleft === 'number'
          const canArchive = p.status !== 'ARCHIVED'

          return (
            <div
              key={p.id}
              className="rounded-xl border bg-white p-4 flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <div className="w-full md:w-40 aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt={p.title || 'Propiedad'} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{p.title || 'Sin título'}</h3>
                  {statusBadge(p.status)}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {p.city && p.province ? `${p.city}, ${p.province}` : 'Ubicación no indicada'}
                </div>
                <div className="mt-2 text-lg">{fmtMoney(p.price)}</div>
                <div className="mt-2 text-sm text-gray-600">
                  {p.expires_at ? (
                    <>
                      Vence:{' '}
                      <span className={soon ? 'text-red-600 font-medium' : ''}>
                        {new Date(p.expires_at).toLocaleDateString('es-AR')}
                        {typeof dleft === 'number' && ` (${dleft} días)`}
                      </span>
                    </>
                  ) : (
                    'Sin fecha de vencimiento'
                  )}
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                {/* Publicar */}
                <button
                  onClick={() => callAction(p.id, 'publish')}
                  disabled={pending || busyId === p.id || !canPublish}
                  className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                    canPublish
                      ? 'border-gray-300 hover:bg-gray-50'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={canPublish ? 'Publicar' : 'No disponible'}
                >
                  Publicar
                </button>

                {/* Renovar */}
                <button
                  onClick={() => callAction(p.id, 'renew')}
                  disabled={pending || busyId === p.id || !canRenew}
                  className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                    canRenew
                      ? 'border-gray-300 hover:bg-gray-50'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={canRenew ? 'Renovar +30 días' : 'No disponible'}
                >
                  Renovar
                </button>

                {/* Archivar */}
                <button
                  onClick={() => callAction(p.id, 'archive')}
                  disabled={pending || busyId === p.id || !canArchive}
                  className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                    canArchive
                      ? 'border-gray-300 hover:bg-gray-50'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title={canArchive ? 'Archivar' : 'No disponible'}
                >
                  Archivar
                </button>

                {/* Editar */}
                <Link
                  href={`/mi-cuenta/publicaciones/${p.id}/editar`}
                  className="px-3 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-50 text-gray-700"
                  title="Editar"
                >
                  Editar
                </Link>

                {/* Borrar */}
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={pending || busyId === p.id}
                  className="px-3 py-2 rounded-md text-sm border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                  title="Eliminar propiedad"
                >
                  Borrar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
