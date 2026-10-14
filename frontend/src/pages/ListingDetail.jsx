import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  MessageSquare,
  ShoppingBag,
  Store,
  MapPin,
  Star,
  ShieldAlert,
  Clock,
  Eye,
  CheckCircle,
  Flag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { listingsApi } from '../api/listings'
import { conversationsApi } from '../api/conversations'
import { ordersApi } from '../api/orders'
import { reportsApi } from '../api/reports'
import { wishlistApi } from '../api/wishlist'
import { useAuth } from '../context/AuthContext'
import { formatPrice, formatRelativeTime } from '../utils/format'
import { ConditionBadge } from '../components/listings/ConditionBadge'
import { ListingGrid } from '../components/listings/ListingGrid'
import { Button, Modal, Spinner, Input, Textarea, Select } from '../components/ui'

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [listing, setListing] = useState(null)
  const [similarListings, setSimilarListings] = useState([])
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [orderMeetupNote, setOrderMeetupNote] = useState('')
  const [isOrdering, setIsOrdering] = useState(false)

  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [isReporting, setIsReporting] = useState(false)

  useEffect(() => {
    setLoading(true)
    listingsApi
      .get(id)
      .then((res) => {
        setListing(res.data)
        return listingsApi.similar(id)
      })
      .then((simRes) => {
        setSimilarListings(simRes.data || [])
      })
      .catch(() => {
        toast.error('Listing not found')
        navigate('/')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleMessageSeller = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to message this seller')
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    try {
      const res = await conversationsApi.create(listing.id)
      navigate(`/messages/${res.data.id}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to start conversation'
      toast.error(msg)
    }
  }

  const handleOrderSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setIsOrdering(true)
    try {
      const res = await ordersApi.create({
        listing_id: listing.id,
        quantity: Number(orderQuantity),
        proposed_meetup: orderMeetupNote.trim() || null,
      })
      toast.success('Purchase request submitted! Seller has been notified.')
      setIsOrderModalOpen(false)
      navigate(`/orders/${res.data.id}`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit order request'
      toast.error(msg)
    } finally {
      setIsOrdering(false)
    }
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setIsReporting(true)
    try {
      await reportsApi.create({
        target_type: 'listing',
        target_id: listing.id,
        reason: reportReason,
        details: reportDetails.trim() || null,
      })
      toast.success('Report submitted to moderation queue.')
      setIsReportModalOpen(false)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit report'
      toast.error(msg)
    } finally {
      setIsReporting(false)
    }
  }

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const prev = listing.is_wishlisted
    setListing((l) => ({ ...l, is_wishlisted: !prev }))

    try {
      if (prev) {
        await wishlistApi.remove(listing.id)
        toast.success('Removed from wishlist')
      } else {
        await wishlistApi.add(listing.id)
        toast.success('Saved to wishlist')
      }
    } catch {
      setListing((l) => ({ ...l, is_wishlisted: prev }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!listing) return null

  const images = listing.images || []
  const activeImgUrl = images[activeImageIdx]?.url || null
  const isOwner = user?.id === listing.store?.owner_id
  const isUnavailable = listing.status !== 'active'

  return (
    <div className="space-y-12">
      {/* Product Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative shadow-xs">
            {activeImgUrl ? (
              <img
                src={activeImgUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Store size={48} className="opacity-40" />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <ConditionBadge condition={listing.condition} />
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImageIdx === idx
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img.thumb_url || img.url} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-primary">
                {listing.category?.name || 'General Category'}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatRelativeTime(listing.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  {listing.view_count} views
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
              {listing.title}
            </h1>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-extrabold text-gray-900">
                {formatPrice(listing.price)}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {listing.quantity > 0 ? `${listing.quantity} available` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwner && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  className="flex-1 py-3 text-sm font-semibold gap-2 shadow-xs"
                  disabled={isUnavailable || listing.quantity < 1}
                  onClick={() => setIsOrderModalOpen(true)}
                >
                  <ShoppingBag size={18} />
                  Request to Buy
                </Button>

                <button
                  onClick={handleToggleWishlist}
                  className={`p-3 rounded-xl border transition-colors ${
                    listing.is_wishlisted
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                  title="Save to Wishlist"
                >
                  <Heart size={20} className={listing.is_wishlisted ? 'fill-red-600' : ''} />
                </button>
              </div>

              <Button
                variant="secondary"
                className="w-full py-2.5 text-xs font-semibold gap-2"
                onClick={handleMessageSeller}
              >
                <MessageSquare size={16} />
                Message Seller
              </Button>
            </div>
          )}

          {/* Seller Storefront Card */}
          {listing.store && (
            <div className="card p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Storefront
                </span>
                {Number(listing.store.rating_avg) >= 4.5 && listing.store.rating_count >= 5 && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    ⭐ Trusted Seller
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Link
                    to={`/stores/${listing.store.id}`}
                    className="text-sm font-bold text-gray-900 hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <Store size={16} className="text-primary" />
                    {listing.store.name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {Number(listing.store.rating_avg).toFixed(1)}
                    </span>
                    <span>({listing.store.rating_count} reviews)</span>
                  </div>
                </div>

                <Link to={`/stores/${listing.store.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Store →
                  </Button>
                </Link>
              </div>

              {listing.store.pickup_location_hint && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 pt-2 border-t border-gray-200/60">
                  <MapPin size={14} className="text-primary flex-shrink-0" />
                  <span>Pickup hint: {listing.store.pickup_location_hint}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Description
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Report Button */}
          <div className="pt-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1.5 transition-colors"
            >
              <Flag size={13} />
              Report listing for abuse or rule violation
            </button>
          </div>
        </div>
      </div>

      {/* Similar Items Section */}
      {similarListings.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Similar Items on Campus</h2>
          </div>
          <ListingGrid listings={similarListings} />
        </section>
      )}

      {/* Request to Buy Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Request to Buy Item"
      >
        <form onSubmit={handleOrderSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Submit a purchase inquiry to coordinate in-person cash or UPI payment on campus.
          </p>

          <Input
            label="Quantity to purchase"
            type="number"
            min="1"
            max={listing.quantity}
            value={orderQuantity}
            onChange={(e) => setOrderQuantity(e.target.value)}
          />

          <Input
            label="Proposed Meetup Location & Time"
            placeholder="e.g. Central Library porch, Thursday 1:15 PM lunch"
            value={orderMeetupNote}
            onChange={(e) => setOrderMeetupNote(e.target.value)}
          />

          <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Estimated Total: {formatPrice(listing.price * orderQuantity)}</p>
            <p className="text-[11px] text-blue-600">
              No online payment required. Pay seller upon physical inspection.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isOrdering}>
              Confirm Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report This Listing"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <Select
            label="Reason for report"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            <option value="spam">Spam / Misleading</option>
            <option value="prohibited_item">Prohibited Item (Alcohol, Weapons, Vapes)</option>
            <option value="scam">Scam / Fraudulent</option>
            <option value="inappropriate">Inappropriate Content</option>
            <option value="other">Other Violation</option>
          </Select>

          <Textarea
            label="Additional Details (Optional)"
            rows={3}
            placeholder="Help campus moderators understand the issue..."
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={isReporting}>
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
