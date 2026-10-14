import React, { useState, useEffect } from 'react'
import { Search, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import { Badge, Button, Pagination, Spinner } from '../../components/ui'
import { formatCurrency } from '../../utils/format'

const STATUS_COLORS = {
  active: 'success',
  hidden: 'warning',
  sold: 'default',
  reserved: 'info',
  deleted: 'danger',
  expired: 'default',
}

export default function AdminListings() {
  const [listings, setListings] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadListings()
  }, [page, search, statusFilter])

  const loadListings = () => {
    setLoading(true)
    adminApi
      .getListings({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        page_size: 15,
      })
      .then((res) => {
        setListings(res.data.items || [])
        setTotalPages(res.data.total_pages || 1)
      })
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setLoading(false))
  }

  const handleToggleVisibility = async (listing) => {
    try {
      if (listing.status === 'hidden') {
        await adminApi.restoreListing(listing.id)
        toast.success('Listing restored to active')
      } else {
        if (!window.confirm(`Hide listing "${listing.title}"?`)) return
        await adminApi.hideListing(listing.id)
        toast.success('Listing hidden')
      }
      loadListings()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update listing')
    }
  }

  const statusTabs = ['', 'active', 'hidden', 'sold', 'reserved', 'deleted']

  return (
    <div className="card p-6 bg-white border border-gray-200 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Listings Moderation
        </h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {statusTabs.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-2">Listing</th>
                <th className="py-2.5 px-2">Price</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2">Views</th>
                <th className="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-semibold text-gray-900 max-w-xs truncate">{l.title}</p>
                      <p className="text-[11px] text-gray-400">ID #{l.id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700 font-medium">
                    {formatCurrency(l.price)}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={STATUS_COLORS[l.status] || 'default'}>
                      {l.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-gray-500">{l.view_count ?? 0}</td>
                  <td className="py-3 px-2 text-right">
                    {l.status !== 'deleted' && (
                      <Button
                        variant={l.status === 'hidden' ? 'secondary' : 'danger'}
                        size="sm"
                        onClick={() => handleToggleVisibility(l)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        {l.status === 'hidden' ? (
                          <><Eye size={12} className="inline mr-1" />Restore</>
                        ) : (
                          <><EyeOff size={12} className="inline mr-1" />Hide</>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No listings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
