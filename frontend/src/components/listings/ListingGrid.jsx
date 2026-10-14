import React from 'react'
import { ListingCard } from './ListingCard'
import { ListingCardSkeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui'
import { PackageOpen } from 'lucide-react'

export function ListingGrid({ listings, isLoading, skeletonCount = 12, onWishlistChange }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No listings found"
        description="Try clearing your search query or broadening the selected category and price filters."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {listings.map((item) => (
        <ListingCard key={item.id} listing={item} onWishlistChange={onWishlistChange} />
      ))}
    </div>
  )
}
