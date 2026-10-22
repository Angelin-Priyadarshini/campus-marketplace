import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Store as StoreIcon, Star, MapPin, PackageCheck, MessageSquare, CornerDownRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { storesApi } from '../api/stores'
import { formatRelativeTime } from '../utils/format'
import { ListingGrid } from '../components/listings/ListingGrid'
import { Avatar, Badge, StarRating, Spinner, Pagination } from '../components/ui'

export default function StorePage() {
  const { id } = useParams()
  const [storeData, setStoreData] = useState(null)
  const [reviewsData, setReviewsData] = useState({ items: [], total: 0, page: 1, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('listings') // 'listings' | 'reviews'

  useEffect(() => {
    setLoading(true)
    storesApi
      .get(id)
      .then((res) => {
        setStoreData(res.data)
        return storesApi.getReviews(id, { page: 1, page_size: 10 })
      })
      .then((revRes) => {
        setReviewsData(revRes.data)
      })
      .catch(() => {
        toast.error('Storefront not found')
      })
      .finally(() => setLoading(false))
  }, [id])

  const loadReviewsPage = async (page) => {
    try {
      const res = await storesApi.getReviews(id, { page, page_size: 10 })
      setReviewsData(res.data)
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!storeData) return null

  const { store, owner, listings } = storeData
  const isTrustedSeller = Number(store.rating_avg) >= 4.5 && store.rating_count >= 5

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Store Header Banner */}
      <div className="card p-6 sm:p-8 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 flex-shrink-0">
              <StoreIcon size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{store.name}</h1>
                {isTrustedSeller && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    Trusted Seller
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Managed by <strong className="text-gray-700">{owner.full_name}</strong>
                {owner.department && ` · ${owner.department}`}
              </p>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <div>
              <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span>{Number(store.rating_avg).toFixed(1)}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{store.rating_count} reviews</p>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-900">{store.items_sold || 0}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">items sold</p>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-900">{listings.length}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">active listings</p>
            </div>
          </div>
        </div>

        {store.bio && (
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
            {store.bio}
          </p>
        )}

        {store.pickup_location_hint && (
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
            <MapPin size={15} className="text-primary flex-shrink-0" />
            <span>
              Campus Meetup Preference: <strong>{store.pickup_location_hint}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'listings'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Active Listings ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Student Reviews ({reviewsData.total})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' ? (
        <ListingGrid listings={listings} />
      ) : (
        <div className="space-y-4">
          {reviewsData.items.length === 0 ? (
            <p className="text-center py-12 text-xs text-gray-500">
              No reviews yet for this storefront.
            </p>
          ) : (
            reviewsData.items.map((rev) => (
              <div
                key={rev.id}
                className="card p-5 bg-white border border-gray-200 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={rev.reviewer_name} size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{rev.reviewer_name}</p>
                      {rev.reviewer_dept && (
                        <p className="text-[10px] text-gray-400">{rev.reviewer_dept}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={rev.rating} size={14} />
                    <span className="text-[11px] text-gray-400">
                      {formatRelativeTime(rev.created_at)}
                    </span>
                  </div>
                </div>

                {rev.listing_title && (
                  <p className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg inline-block">
                    Item: {rev.listing_title}
                  </p>
                )}

                {rev.comment && <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>}

                {rev.seller_reply && (
                  <div className="ml-4 pl-3 border-l-2 border-primary-200 pt-1 text-xs text-gray-600 bg-primary-50/30 p-2 rounded-r-lg">
                    <div className="flex items-center gap-1 font-semibold text-primary text-[11px] mb-0.5">
                      <CornerDownRight size={13} />
                      Seller Response:
                    </div>
                    {rev.seller_reply}
                  </div>
                )}
              </div>
            ))
          )}

          {reviewsData.total_pages > 1 && (
            <Pagination
              page={reviewsData.page}
              totalPages={reviewsData.total_pages}
              onPageChange={loadReviewsPage}
            />
          )}
        </div>
      )}
    </div>
  )
}
