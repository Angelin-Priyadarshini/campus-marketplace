import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { categoriesApi } from '../../api/categories'
import { listingsApi } from '../../api/listings'
import { Button, Input, Select, Textarea } from '../ui'
import { ImageUploader } from './ImageUploader'

export function ListingForm({ initialData = null, isEdit = false }) {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [price, setPrice] = useState(initialData?.price || '')
  const [condition, setCondition] = useState(initialData?.condition || 'good')
  const [quantity, setQuantity] = useState(initialData?.quantity || 1)
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [status, setStatus] = useState(initialData?.status || 'active')

  // Images state: array of { id, url, file, isNew }
  const [images, setImages] = useState(
    initialData?.images?.map((img) => ({
      id: img.id,
      url: img.url,
      isNew: false,
    })) || []
  )

  const [errors, setErrors] = useState({})

  useEffect(() => {
    categoriesApi.list().then((res) => {
      setCategories(res.data || [])
      if (!categoryId && res.data?.length > 0 && !isEdit) {
        setCategoryId(res.data[0].id)
      }
    }).catch(() => {})
  }, [categoryId, isEdit])

  const validate = () => {
    const errs = {}
    if (!title.trim()) errs.title = 'Title is required'
    else if (title.trim().length > 120) errs.title = 'Title must be 120 characters or fewer'

    if (!description.trim()) errs.description = 'Description is required'
    if (price === '' || Number(price) < 0) errs.price = 'Price must be 0 or greater'
    if (quantity < 1) errs.quantity = 'Quantity must be at least 1'
    if (!categoryId) errs.category = 'Category is required'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      if (isEdit) {
        // Update listing fields
        await listingsApi.update(initialData.id, {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          condition,
          quantity: Number(quantity),
          category_id: Number(categoryId),
          status,
        })

        // Upload any newly added files
        const newFiles = images.filter((img) => img.isNew && img.file).map((img) => img.file)
        if (newFiles.length > 0) {
          await listingsApi.uploadImages(initialData.id, newFiles)
        }

        toast.success('Listing updated successfully!')
        navigate('/dashboard')
      } else {
        // Create listing
        const res = await listingsApi.create({
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          condition,
          quantity: Number(quantity),
          category_id: Number(categoryId),
        })

        const listingId = res.data.id

        // Upload images if any selected
        const filesToUpload = images.filter((img) => img.isNew && img.file).map((img) => img.file)
        if (filesToUpload.length > 0) {
          await listingsApi.uploadImages(listingId, filesToUpload)
        }

        toast.success('Listing published successfully!')
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save listing'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? 'Edit Listing' : 'Create New Listing'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Provide accurate details and photos to help fellow campus students find your item.
        </p>
      </div>

      <ImageUploader images={images} onImagesChange={setImages} maxImages={6} />

      <Input
        label="Listing Title *"
        placeholder="e.g. Operating System Concepts Silberschatz 10th Ed"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category *"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          error={errors.category}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </Select>

        <Select
          label="Condition *"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="new">Brand New (Unopened / Unused)</option>
          <option value="like_new">Like New (Pristine condition)</option>
          <option value="good">Good (Normal wear, fully functional)</option>
          <option value="fair">Fair (Visible signs of use)</option>
          <option value="poor">Poor (Heavy wear)</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Price in INR (₹) *"
          type="number"
          placeholder="0.00"
          min="0"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.price}
        />

        <Input
          label="Available Quantity *"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={errors.quantity}
        />
      </div>

      {isEdit && (
        <Select
          label="Listing Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Active (Visible in search)</option>
          <option value="reserved">Reserved (Held for buyer)</option>
          <option value="sold">Sold</option>
          <option value="expired">Expired</option>
        </Select>
      )}

      <Textarea
        label="Description *"
        rows={5}
        placeholder="Describe the item's condition, whether it includes accessories, where you can meet on campus..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {isEdit ? 'Save Changes' : 'Publish Listing'}
        </Button>
      </div>
    </form>
  )
}
