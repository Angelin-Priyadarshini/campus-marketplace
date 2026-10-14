import React from 'react'
import { Users, ShoppingBag, CheckCircle, AlertTriangle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export function StatsCards({ stats }) {
  if (!stats) return null

  const chartData = [
    { name: 'Pending', count: stats.orders_by_status?.pending || 0, color: '#f59e0b' },
    { name: 'Accepted', count: stats.orders_by_status?.accepted || 0, color: '#3b82f6' },
    { name: 'Completed', count: stats.orders_by_status?.completed || 0, color: '#10b981' },
    { name: 'Cancelled', count: stats.orders_by_status?.cancelled || 0, color: '#6b7280' },
    { name: 'Rejected', count: stats.orders_by_status?.rejected || 0, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-white border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_users || 0}</p>
            <p className="text-[11px] text-green-600 mt-0.5">
              {stats.verified_users || 0} verified accounts
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-primary rounded-xl">
            <Users size={22} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Listings</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active_listings || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Across all categories</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed (30d)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed_orders_30d || 0}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Successful handovers</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Open Reports</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.open_reports || 0}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Pending admin review</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Orders Breakdown Chart */}
      <div className="card p-6 bg-white border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Orders Distribution by Status
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
