import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { reviewsApi } from '../../api/reviews'
import { Button, StarRating, Textarea } from '../ui'

export function ReviewForm({ orderId, onReviewSubmitted }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      toast.error('Please select a star rating between 1 and 5')
      return
    }

    setLoading(true)
    try {
      const res = await reviewsApi.create(orderId, {
        rating,
        comment: comment.trim() || null,
      })
      toast.success('Thank you! Your review has been published.')
      onReviewSubmitted?.(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit review'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 bg-white border border-gray-200 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Leave a Transaction Review</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Rate your trade partner to help build trust across the campus marketplace.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-700">Rating *</label>
        <StarRating value={rating} onChange={setRating} size={22} />
      </div>

      <Textarea
        label="Feedback / Comments (Optional)"
        rows={3}
        placeholder="Was the item in the described condition? Was the handover on time?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
      />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" loading={loading}>
          Submit Review
        </Button>
      </div>
    </form>
  )
}
