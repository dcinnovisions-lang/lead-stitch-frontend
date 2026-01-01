import { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import Header from './Header'

interface AdminLayoutProps {
  children: ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

