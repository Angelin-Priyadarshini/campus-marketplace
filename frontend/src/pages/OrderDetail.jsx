import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, MapPin, Store, ShieldCheck, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordersApi } from '../api/orders'
import { conversationsApi } from '../api/conversations'
import { useAuth } from '../context/AuthContext'
import { formatPrice, formatRelativeTime, STATUS_LABELS, STATUS_VARIANTS } from '../utils/format'
import { OrderTimeline } from '../components/orders/OrderTimeline'
import { ReviewForm } from '../components/orders/ReviewForm'
import { Badge, Button, Spinner } from '../components/ui'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = () => {
    setLoading(true)
    ordersApi
      .get(id)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        toast.error('Order not found or permission denied')
        navigate('/orders')
      })
      .finally(() => setLoading(false))
  }

  const handleAccept = async () => {
    try {
      await ordersApi.accept(id)
      toast.success('Order accepted! Stock reserved.')
      loadOrder()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to accept order')
    }
  }

  const handleReject = async () => {
    const reason = window.prompt('Reason for declining this request (optional):')
    try {
      await ordersApi.reject(id, reason || 'Declined by seller')
      toast.success('Order declined')
      loadOrder()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to decline order')
    }
  }

  const handleComplete = async () => {
    if (!window.confirm('Confirm that in-person campus handover is complete and payment settled?')) return
    try {
      await ordersApi.complete(id)
      toast.success('Handover confirmed! Order marked as completed.')
      loadOrder()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete order')
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    try {
      await ordersApi.cancel(id)
      toast.success('Order cancelled')
      loadOrder()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order')
    }
  }

  const handleOpenChat = async () => {
    try {
      const res = await conversationsApi.create(order.listing_id)
      navigate(`/messages/${res.data.id}`)
    } catch {
      navigate('/messages')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!order) return null

  const isSeller = user?.id === order.seller?.id
  const isBuyer = user?.id === order.buyer?.id
  const hasReviewed = order.reviews?.some((r) => r.reviewer_id === user?.id)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Back to My Orders
      </button>

      {/* Main Order Card */}
      <div className="card p-6 sm:p-8 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-400">ORDER #{order.id}</span>
              <Badge variant={STATUS_VARIANTS[order.status]}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={handleOpenChat} className="gap-1.5">
            <MessageSquare size={15} />
            Chat with {isSeller ? 'Buyer' : 'Seller'}
          </Button>
        </div>

        {/* Item Summary */}
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/60">
          {order.listing_image ? (
            <img
              src={order.listing_image}
              alt={order.listing_title}
              className="w-20 h-20 rounded-xl object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <Link
              to={`/listings/${order.listing_id}`}
              className="text-sm font-bold text-gray-900 hover:text-primary transition-colors truncate block"
            >
              {order.listing_title}
            </Link>
            <p className="text-xs text-gray-500 mt-1">
              Quantity: <strong className="text-gray-800">{order.quantity}</strong> × {formatPrice(order.unit_price)}
            </p>
            <p className="text-sm font-extrabold text-primary mt-1">
              Total: {formatPrice(order.total_price)}
            </p>
          </div>
        </div>

        {/* Proposed Meetup & Notes */}
        {(order.proposed_meetup || order.note) && (
          <div className="space-y-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-xs">
            {order.proposed_meetup && (
              <div className="flex items-center gap-1.5 text-blue-900 font-medium">
                <MapPin size={14} className="text-primary flex-shrink-0" />
                <span>Proposed Campus Meetup: <strong>{order.proposed_meetup}</strong></span>
              </div>
            )}
            {order.note && (
              <p className="text-blue-800">
                Buyer's Note: "{order.note}"
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        <OrderTimeline events={order.events} currentStatus={order.status} />

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
          {isSeller && order.status === 'pending' && (
            <>
              <Button variant="danger" size="sm" onClick={handleReject}>
                Decline Request
              </Button>
              <Button variant="primary" size="sm" onClick={handleAccept}>
                Accept Order Request
              </Button>
            </>
          )}

          {isSeller && order.status === 'accepted' && (
            <Button variant="primary" size="sm" onClick={handleComplete}>
              Confirm Campus Handover Completed
            </Button>
          )}

          {(order.status === 'pending' || order.status === 'accepted') && (
            <Button variant="ghost" size="sm" onClick={handleCancel} className="text-red-600 hover:bg-red-50">
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Review Section (when completed) */}
      {order.status === 'completed' && !hasReviewed && (
        <ReviewForm orderId={order.id} onReviewSubmitted={() => loadOrder()} />
      )}

      {order.status === 'completed' && hasReviewed && (
        <div className="card p-5 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-xs text-green-800">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <span>You have submitted your transaction review for this order. Thank you for contributing to campus trust!</span>
        </div>
      )}
    </div>
  )
}
