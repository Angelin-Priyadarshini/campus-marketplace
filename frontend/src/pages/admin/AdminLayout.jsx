import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, Users, ShoppingBag, FolderTree } from 'lucide-react'

export default function AdminLayout() {
  const links = [
    { to: '/admin', label: 'Platform Stats', icon: LayoutDashboard, end: true },
    { to: '/admin/reports', label: 'Report Queue', icon: AlertTriangle },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/listings', label: 'Moderated Listings', icon: ShoppingBag },
    { to: '/admin/categories', label: 'Categories CRUD', icon: FolderTree },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CampusMart Admin Console</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review community reports, moderate bad listings, manage campus categories, and monitor health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Admin Navigation Sidebar */}
        <aside className="card p-3 bg-white border border-gray-200 rounded-2xl md:col-span-1 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </aside>

        {/* Content Area */}
        <div className="md:col-span-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
