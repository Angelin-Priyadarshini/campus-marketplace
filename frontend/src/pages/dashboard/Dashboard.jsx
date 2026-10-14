import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle,
  ShoppingBag,
  Eye,
  Star,
  Edit,
  Trash2,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  RefreshCw,
  PackageCheck,
  Clock,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { listingsApi } from '../../api/listings'
import { storesApi } from '../../api/stores'
import { ordersApi } from '../../api/orders'
import { formatPrice, formatRelativeTime, STATUS_LABELS, STATUS_VARIANTS } from '../../utils/format'
import { Badge, Button, Spinner, EmptyState } from '../../components/ui'
import { useWebSocket } from '../../hooks/useWebSocket'
import { OrderCard } from '../../components/orders/OrderCard'

export default function Dashboard() {
  const [store, setStore] = useState(null)
  const [listings, setListings] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const pollingRef = useRef(null)

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [storeRes, listRes, ordersRes] = await Promise.all([
        storesApi.get('me').catch(() => null),
        listingsApi.myListings(),
        ordersApi.list({ role: 'seller' }),
      ])
      if (storeRes) setStore(storeRes.data)
      setListings(listRes.data || [])
      setOrders(ordersRes.data || [])
      setLastRefreshed(new Date())
    } catch {
      if (!silent) toast.error('Failed to load dashboard data')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Poll every 10 seconds as fallback
  useEffect(() => {
    pollingRef.current = setInterval(() => loadDashboardData(true), 10000)
    return () => clearInterval(pollingRef.current)
  }, [loadDashboardData])

  // Real-time: refresh immediately when a WebSocket order_update event arrives
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'order_update') {
      loadDashboardData(true)
      toast.success(
        `Order #${msg.order_id} updated to "${msg.status}"`,
        { icon: '🔔', duration: 4000 }
      )
    }
  }, [loadDashboardData])

  useWebSocket(handleWsMessage)

  const handleAcceptOrder = async (orderId) => {
    try {
      await ordersApi.accept(orderId)
      toast.success('Order accepted! Stock reserved.')
      loadDashboardData(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to accept order')
    }
  }

  const handleRejectOrder = async (orderId) => {
    const reason = window.prompt('Reason for declining this request (optional):')
    try {
      await ordersApi.reject(orderId, reason || 'Declined by seller')
      toast.success('Order declined')
      loadDashboardData(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to decline order')
    }
  }

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm('Confirm that in-person campus handover is complete and payment received?')) return
    try {
      await ordersApi.complete(orderId)
      toast.success('Handover confirmed! Order marked as completed.')
      loadDashboardData(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete order')
    }
  }

  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      await listingsApi.update(listingId, { status: newStatus })
      toast.success(`Listing status updated to ${newStatus}`)
      const res = await listingsApi.myListings()
      setListings(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status')
    }
  }

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return
    try {
      await listingsApi.delete(listingId)
      toast.success('Listing deleted')
      setListings((prev) => prev.filter((l) => l.id !== listingId))
    } catch {
      toast.error('Failed to delete listing')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const filteredListings = statusFilter
    ? listings.filter((l) => l.status === statusFilter)
    : listings

  const totalViews = listings.reduce((acc, curr) => acc + (curr.view_count || 0), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const acceptedOrders = orders.filter((o) => o.status === 'accepted').length
  const completedOrders = orders.filter((o) => o.status === 'completed').length

  const displayedOrders = orderStatusFilter
    ? orders.filter((o) => o.status === orderStatusFilter)
    : orders

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {store?.name || 'Vendor Dashboard'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your storefront inventory, track student views, and accept orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {store?.id && (
            <Link to={`/stores/${store.id}`}>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <ExternalLink size={15} />
                View Public Store
              </Button>
            </Link>
          )}

          <Link to="/dashboard/listings/new">
            <Button variant="primary" size="sm" className="gap-1.5">
              <PlusCircle size={16} />
              Add New Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 sm:p-5 bg-white border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Listings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{listings.length}</p>
        </div>

        <div className="card p-4 sm:p-5 bg-white border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Views</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalViews}</p>
        </div>

        <div className="card p-4 sm:p-5 bg-white border border-gray-200">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Store Rating</p>
          <p className="text-2xl font-bold text-amber-600 mt-1 flex items-center gap-1">
            <Star size={18} className="fill-amber-400 text-amber-400" />
            {Number(store?.rating_avg || 0).toFixed(1)}
          </p>
        </div>

        <div
          onClick={() => setOrderStatusFilter('pending')}
          className="card p-4 sm:p-5 bg-white border border-gray-200 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pending Inquiries</p>
          <p className={`text-2xl font-bold mt-1 ${pendingOrders > 0 ? 'text-primary' : 'text-gray-900'}`}>
            {pendingOrders}
          </p>
        </div>
      </div>

      {/* Incoming Purchase Requests & Inquiries Section */}
      <div className="card p-6 bg-white border border-gray-200 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <PackageCheck size={18} className="text-primary" />
              Incoming Purchase Requests ({orders.length})
            </h2>
            {pendingOrders > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingOrders} Pending Action
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: '', label: 'All', count: orders.length },
                { id: 'pending', label: 'Pending', count: pendingOrders },
                { id: 'accepted', label: 'Accepted', count: acceptedOrders },
                { id: 'completed', label: 'Completed', count: completedOrders },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOrderStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    orderStatusFilter === tab.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      orderStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => loadDashboardData(false)}
              className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
              title="Refresh requests"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {displayedOrders.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title={orderStatusFilter ? `No ${orderStatusFilter} requests` : 'No purchase requests yet'}
            description="When campus students request to buy your items, their inquiries appear here in real time."
          />
        ) : (
          <div className="space-y-3">
            {displayedOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                isSeller={true}
                onAccept={handleAcceptOrder}
                onReject={handleRejectOrder}
                onComplete={handleCompleteOrder}
              />
            ))}
          </div>
        )}
      </div>

      {/* My Listings Table Section */}
      <div className="card p-6 bg-white border border-gray-200 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Inventory & Availability ({filteredListings.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['', 'active', 'reserved', 'sold', 'hidden'].map((st) => (
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

        {filteredListings.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No listings in this view"
            description="Add your first second-hand book, cycle, or lab tool to start selling."
            action={
              <Link to="/dashboard/listings/new">
                <Button variant="primary" size="sm" className="mt-2">
                  Create First Listing
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-2">Item</th>
                  <th className="py-3 px-2">Price</th>
                  <th className="py-3 px-2">Stock</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Views</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredListings.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {l.images && l.images.length > 0 ? (
                          <img
                            src={l.images[0].thumb_url || l.images[0].url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/listings/${l.id}`}
                            className="font-semibold text-gray-900 hover:text-primary transition-colors truncate block max-w-xs"
                          >
                            {l.title}
                          </Link>
                          <span className="text-[10px] text-gray-400">
                            Added {formatRelativeTime(l.created_at)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-2 font-bold text-gray-900">
                      {formatPrice(l.price)}
                    </td>

                    <td className="py-3 px-2 text-gray-600 font-medium">
                      {l.quantity} {l.reserved_quantity > 0 && `(${l.reserved_quantity} res)`}
                    </td>

                    <td className="py-3 px-2">
                      <Badge variant={STATUS_VARIANTS[l.status]}>
                        {STATUS_LABELS[l.status]}
                      </Badge>
                    </td>

                    <td className="py-3 px-2 text-gray-500">
                      {l.view_count || 0}
                    </td>

                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/dashboard/listings/${l.id}/edit`}>
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-primary transition-colors"
                            title="Edit listing"
                          >
                            <Edit size={15} />
                          </button>
                        </Link>

                        {l.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(l.id, 'sold')}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                            title="Mark as Sold"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}

                        {l.status === 'sold' && (
                          <button
                            onClick={() => handleUpdateStatus(l.id, 'active')}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-primary transition-colors"
                            title="Reactivate listing"
                          >
                            <Bookmark size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(l.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete listing"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
