import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listingsApi } from '../../api/listings'
import { ListingForm } from '../../components/listings/ListingForm'
import { Spinner } from '../../components/ui'

export default function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listingsApi
      .get(id)
      .then((res) => setListing(res.data))
      .catch(() => {
        toast.error('Listing not found or permission denied')
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="py-4">
      <ListingForm initialData={listing} isEdit={true} />
    </div>
  )
}
