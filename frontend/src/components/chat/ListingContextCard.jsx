import React from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../utils/format'
import { Badge } from '../ui'

export function ListingContextCard({ listing }) {
  if (!listing) return null

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-3">
      <Link
        to={`/listings/${listing.id}`}
        className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0"
      >
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0].thumb_url || listing.images[0].url}
            alt={listing.title}
            className="w-11 h-11 rounded-lg object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-gray-200 flex-shrink-0" />
        )}
        <div className="truncate">
          <p className="text-xs font-semibold text-gray-900 truncate">{listing.title}</p>
          <p className="text-xs font-bold text-primary">{formatPrice(listing.price)}</p>
        </div>
      </Link>

      <div className="flex-shrink-0">
        <Badge
          variant={
            listing.status === 'active'
              ? 'success'
              : listing.status === 'reserved'
              ? 'warning'
              : 'default'
          }
        >
          {listing.status.toUpperCase()}
        </Badge>
      </div>
    </div>
  )
}
