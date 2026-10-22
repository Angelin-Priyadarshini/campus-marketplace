import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PackageCheck, ShoppingBag, Store, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordersApi } from '../api/orders'
import { OrderCard } from '../components/orders/OrderCard'
import { Button, EmptyState, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'

export function Orders() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryTab = searchParams.get('tab')
  // Default to seller tab if vendor, or if query param specifies seller
  const defaultTab = queryTab === 'seller' || (!queryTab && user?.has_storefront) ? 'seller' : 'buyer'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [statusFilter, setStatusFilter] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const params = { role: activeTab }
    if (statusFilter) params.status = statusFilter

    try {
      const res = await ordersApi.list(params)
      setOrders(res.data || [])
    } catch {
      if (!silent) toast.error('Failed to load orders')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [activeTab, statusFilter])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // 10-second background polling
  useEffect(() => {
    const timer = setInterval(() => loadOrders(true), 10000)
    return () => clearInterval(timer)
  }, [loadOrders])

  // Real-time WebSocket updates
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'order_update') {
      loadOrders(true)
      toast.success(
        `Order #${msg.order_id} updated: ${msg.status}`,
        { duration: 3500 }
      )
    }
  }, [loadOrders])

  useWebSocket(handleWsMessage)

  const handleAccept = async (orderId) => {
    try {
      await ordersApi.accept(orderId)
      toast.success('Order accepted! Stock reserved.')
      loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to accept order')
    }
  }

  const handleReject = async (orderId) => {
    const reason = window.prompt('Reason for declining this request (optional):')
    try {
      await ordersApi.reject(orderId, reason || 'Declined by seller')
      toast.success('Order declined')
      loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to decline order')
    }
  }

  const handleComplete = async (orderId) => {
    if (!window.confirm('Confirm that in-person campus handover is complete and payment received?')) return
    try {
      await ordersApi.complete(orderId)
      toast.success('Handover confirmed! Order marked as completed.')
      loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete order')
    }
  }

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order request?')) return
    try {
      await ordersApi.cancel(orderId)
      toast.success('Order cancelled')
      loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Campus Orders & Inquiries</h1>
        <p className="text-xs text-gray-500 mt-1">
          Track in-person purchase requests, accept incoming buyer requests, and confirm completed trades.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('buyer')
              setStatusFilter('')
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'buyer'
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShoppingBag size={15} />
            My Buying Requests
          </button>
          <button
            onClick={() => {
              setActiveTab('seller')
              setStatusFilter('')
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'seller'
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Store size={15} />
            Incoming Sales Inquiries
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['', 'pending', 'accepted', 'completed', 'cancelled', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
              }`}
            >
              {st ? st.charAt(0).toUpperCase() + st.slice(1) : 'All Statuses'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title={`No ${activeTab === 'buyer' ? 'purchase requests' : 'incoming sales inquiries'} found`}
          description={
            activeTab === 'buyer'
              ? 'Find items on the marketplace and click "Request to Buy" to begin.'
              : 'When students place purchase requests on your storefront, they appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              isSeller={activeTab === 'seller'}
              onAccept={handleAccept}
              onReject={handleReject}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
export default Orders
