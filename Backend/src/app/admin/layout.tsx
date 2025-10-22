import { redirect } from 'next/navigation'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { AdminNavbar } from '@/components/admin/AdminNavbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdmin = await isCurrentUserAdmin()

  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
