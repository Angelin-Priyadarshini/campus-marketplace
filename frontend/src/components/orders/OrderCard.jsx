import React from 'react'
import { Link } from 'react-router-dom'
import { formatPrice, formatRelativeTime, STATUS_LABELS, STATUS_VARIANTS } from '../../utils/format'
import { Badge, Button } from '../ui'

export function OrderCard({
  order,
  isSeller,
  onAccept,
  onReject,
  onComplete,
  onCancel,
}) {
  const statusLabel = STATUS_LABELS[order.status] || order.status
  const statusVariant = STATUS_VARIANTS[order.status] || 'default'

  return (
    <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3.5 min-w-0">
        {order.listing_image ? (
          <img
            src={order.listing_image}
            alt={order.listing_title}
            className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(order.created_at)}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {order.listing_title}
          </h3>

          <p className="text-xs text-gray-500 mt-0.5">
            Quantity: <strong className="text-gray-700">{order.quantity}</strong> · Total:{' '}
            <strong className="text-primary font-bold">{formatPrice(order.total_price)}</strong>
            {order.payment_method && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-semibold uppercase">
                {order.payment_method === 'upi' ? 'UPI' : order.payment_method === 'cash' ? 'Cash' : 'COD'}
              </span>
            )}
          </p>

          <p className="text-[11px] text-gray-400 mt-0.5">
            {isSeller
              ? `Buyer: ${order.buyer?.full_name || 'Student'}`
              : `Seller: ${order.seller?.full_name || 'Student'}`}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
        <Link to={`/orders/${order.id}`}>
          <Button variant="secondary" size="sm">
            View Details
          </Button>
        </Link>

        {isSeller && order.status === 'pending' && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAccept?.(order.id)}
            >
              Accept
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onReject?.(order.id)}
            >
              Decline
            </Button>
          </>
        )}

        {isSeller && order.status === 'accepted' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onComplete?.(order.id)}
          >
            Confirm Handover
          </Button>
        )}

        {!isSeller && (order.status === 'pending' || order.status === 'accepted') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel?.(order.id)}
            className="text-red-600 hover:bg-red-50"
          >
            Cancel Request
          </Button>
        )}
      </div>
    </div>
  )
}
