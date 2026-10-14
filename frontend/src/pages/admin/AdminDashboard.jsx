import React, { useState, useEffect } from 'react'
import { adminApi } from '../../api/admin'
import { StatsCards } from '../../components/admin/StatsCards'
import { Spinner } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .getStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />
    </div>
  )
}
