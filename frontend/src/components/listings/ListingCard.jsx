import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Star, Clock, Store, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice, formatRelativeTime } from '../../utils/format'
import { ConditionBadge } from './ConditionBadge'
import { wishlistApi } from '../../api/wishlist'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui'

export function ListingCard({ listing, onWishlistChange }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isWishlisted, setIsWishlisted] = useState(listing.is_wishlisted || false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)

  const coverImage = listing.images && listing.images.length > 0 ? listing.images[0].url : null

  const handleToggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error('Please log in to save items to your wishlist')
      navigate('/login')
      return
    }

    if (isTogglingWishlist) return
    setIsTogglingWishlist(true)

    const prev = isWishlisted
    setIsWishlisted(!prev) // Optimistic update

    try {
      if (prev) {
        await wishlistApi.remove(listing.id)
        toast.success('Removed from wishlist')
      } else {
        await wishlistApi.add(listing.id)
        toast.success('Added to wishlist')
      }
      onWishlistChange?.(listing.id, !prev)
    } catch (err) {
      setIsWishlisted(prev) // Revert on failure
      const msg = err.response?.data?.detail || 'Failed to update wishlist'
      toast.error(msg)
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  const isUnavailable = listing.status !== 'active'

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group card overflow-hidden flex flex-col hover:shadow-md hover:border-gray-300 transition-all duration-200"
    >
      {/* 4:3 Image Container */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={listing.title}
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              isUnavailable ? 'grayscale opacity-75' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
            <Store size={36} className="opacity-40" />
          </div>
        )}

        {/* Status Overlay */}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white/95 text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Sold Out
            </span>
          </div>
        )}
        {listing.status === 'reserved' && (
          <div className="absolute inset-0 bg-amber-900/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Reserved
            </span>
          </div>
        )}
        {listing.status === 'hidden' && (
          <div className="absolute inset-0 bg-red-900/50 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Moderated
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <ConditionBadge condition={listing.condition} />
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleToggleWishlist}
          disabled={isTogglingWishlist}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-red-500 hover:bg-white shadow-sm transition-all focus:outline-none"
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={16}
            className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Category & Stock */}
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            {listing.category ? (
              <span className="font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md text-[10px] tracking-wide">
                {listing.category.name}
              </span>
            ) : <span />}
            {listing.quantity > 1 && (
              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                {listing.quantity} in stock
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              {formatPrice(listing.price)}
            </span>
          </div>
        </div>

        {/* Store & Ratings */}
        {listing.store && (
          <div className="flex items-center justify-between text-[11px] text-gray-600 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-1.5 truncate max-w-[70%]">
              <Store size={12} className="text-primary-600 flex-shrink-0" />
              <span className="truncate font-medium text-gray-700">{listing.store.name}</span>
            </div>
            {listing.store.rating_avg > 0 ? (
              <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span>{Number(listing.store.rating_avg).toFixed(1)}</span>
                {listing.store.rating_count > 0 && (
                  <span className="text-gray-400 text-[10px]">({listing.store.rating_count})</span>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-emerald-600 font-medium">Verified Student</span>
            )}
          </div>
        )}

        {/* Footer info: views, relative time */}
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatRelativeTime(listing.created_at)}</span>
          </div>

          {listing.view_count > 0 && (
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>{listing.view_count} views</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
