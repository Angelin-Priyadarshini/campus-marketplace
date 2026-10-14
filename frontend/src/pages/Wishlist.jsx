import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ArrowDown, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { wishlistApi } from '../api/wishlist'
import { formatPrice } from '../utils/format'
import { ConditionBadge } from '../components/listings/ConditionBadge'
import { Badge, Button, EmptyState, Spinner } from '../components/ui'

export function Wishlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = () => {
    setLoading(true)
    wishlistApi
      .list()
      .then((res) => setItems(res.data || []))
      .catch(() => toast.error('Failed to load wishlist'))
      .finally(() => setLoading(false))
  }

  const handleRemove = async (listingId) => {
    try {
      await wishlistApi.remove(listingId)
      setItems((prev) => prev.filter((item) => item.listing.id !== listingId))
      toast.success('Removed from wishlist')
    } catch {
      toast.error('Failed to remove item')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Saved Wishlist</h1>
        <p className="text-xs text-gray-500 mt-1">
          Track items you're interested in, spot price drops, and request to buy before they're sold.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Browse campus textbooks, electronics, and dorm items to save them here."
          action={
            <Link to="/">
              <Button variant="primary" size="sm" className="mt-2">
                Browse Marketplace
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(({ listing, price_at_save, current_price, price_dropped }) => {
            const cover = listing.images && listing.images.length > 0 ? listing.images[0].url : null
            return (
              <div
                key={listing.id}
                className="card p-4 bg-white border border-gray-200 rounded-2xl flex flex-col justify-between space-y-3 relative group"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                    {cover ? (
                      <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag size={28} className="opacity-40" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <ConditionBadge condition={listing.condition} />
                      {price_dropped && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                          <ArrowDown size={10} /> Price Drop
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(current_price)}
                      </span>
                      {price_at_save && Number(price_at_save) > Number(current_price) && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(price_at_save)}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/listings/${listing.id}`}
                      className="text-xs font-semibold text-gray-800 line-clamp-2 mt-1 hover:text-primary transition-colors"
                    >
                      {listing.title}
                    </Link>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <Link to={`/listings/${listing.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs">
                      View Item
                    </Button>
                  </Link>

                  <button
                    onClick={() => handleRemove(listing.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default Wishlist
