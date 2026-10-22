import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { storesApi } from '../api/stores'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Textarea } from '../components/ui'

export default function SellPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [pickupHint, setPickupHint] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user?.has_storefront) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const validate = () => {
    const errs = {}
    const clean = name.trim()
    if (!clean) errs.name = 'Store name is required'
    else if (clean.length < 3 || clean.length > 40) errs.name = 'Store name must be between 3 and 40 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await storesApi.create({
        name: name.trim(),
        bio: bio.trim() || null,
        pickup_location_hint: pickupHint.trim() || null,
      })
      updateUser({ has_storefront: true })
      toast.success('Your campus storefront is now active!')
      navigate('/dashboard/listings/new')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create storefront'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Store size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Open Your Campus Storefront</h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Become a campus vendor in one click! Sell second-hand books, dorm furniture, engineering tools, and gadgets to fellow students.
          </p>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span>Zero vendor fees</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span>Direct campus meetup</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <span>Reputation ratings</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Storefront Name (3–40 chars) *"
            placeholder="e.g. Priya's Book Bazaar, Hostel 3 Gadgets"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />

          <Textarea
            label="About Your Store / Bio"
            rows={3}
            placeholder="Tell students what you usually sell and how quickly you can meet on campus..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />

          <Input
            label="Default Pickup Location Hint"
            placeholder="e.g. Hostel B Lobby, IT Dept Canteen, Central Library Porch"
            value={pickupHint}
            onChange={(e) => setPickupHint(e.target.value)}
            maxLength={120}
          />

          <Button type="submit" variant="primary" className="w-full py-3 text-sm font-semibold mt-4" loading={loading}>
            Launch My Storefront & Add First Item →
          </Button>
        </form>
      </div>
    </div>
  )
}
