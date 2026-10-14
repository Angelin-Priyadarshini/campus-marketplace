import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { ReportCard } from '../../components/admin/ReportCard'
import { Spinner, EmptyState } from '../../components/ui'
import { AlertTriangle } from 'lucide-react'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [statusFilter, setStatusFilter] = useState('open')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [statusFilter])

  const loadReports = () => {
    setLoading(true)
    adminApi
      .getReports({ status: statusFilter || undefined })
      .then((res) => setReports(res.data || []))
      .catch(() => toast.error('Failed to load reports queue'))
      .finally(() => setLoading(false))
  }

  const handleResolve = async (reportId, action) => {
    const note = window.prompt(`Admin note for '${action}' resolution (optional):`) || ''
    try {
      await adminApi.resolveReport(reportId, { action, note })
      toast.success(`Report resolved with action: ${action}`)
      loadReports()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resolve report')
    }
  }

  return (
    <div className="card p-6 bg-white border border-gray-200 rounded-2xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Moderation Reports Queue
        </h2>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          {['open', 'resolved', 'dismissed', ''].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
              }`}
            >
              {st ? st.charAt(0).toUpperCase() + st.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No reports in this queue"
          description="Everything is quiet. No user or listing flags require immediate attention."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  )
}
