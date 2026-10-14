import React from 'react'
import { ListingForm } from '../../components/listings/ListingForm'

export default function NewListing() {
  return (
    <div className="py-4">
      <ListingForm isEdit={false} />
    </div>
  )
}
