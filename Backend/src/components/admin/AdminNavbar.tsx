'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Shield, Home, Flag, Users, Building2, MessageSquare, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

export function AdminNavbar() {
  const pathname = usePathname()
  const [pendingReports, setPendingReports] = useState(0)
  const [pendingSupport, setPendingSupport] = useState(0)

  useEffect(() => {
    // Fetch pending reports count
    fetch('/api/admin/reports?status=PENDING&limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pagination) {
          setPendingReports(data.pagination.total)
        }
      })
      .catch(console.error)
  }, [])

  const navItems: NavItem[] = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: <Home className="h-4 w-4" />,
    },
    {
      href: '/admin/reports',
      label: 'Reportes',
      icon: <Flag className="h-4 w-4" />,
      badge: pendingReports > 0 ? pendingReports : undefined,
    },
    {
      href: '/admin/users',
      label: 'Usuarios',
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: '/admin/properties',
      label: 'Propiedades',
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      href: '/admin/support',
      label: 'Soporte',
      icon: <MessageSquare className="h-4 w-4" />,
      badge: pendingSupport > 0 ? pendingSupport : undefined,
    },
    {
      href: '/admin/analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className="relative"
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-2 px-1.5 py-0.5 text-xs"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                Volver al sitio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
