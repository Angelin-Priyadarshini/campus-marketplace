import React, { useRef } from 'react'
import { Upload, X, Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export function ImageUploader({
  images = [], // Array of { id, url, file, isNew }
  onImagesChange,
  maxImages = 6,
}) {
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (images.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images in total.`)
      return
    }

    const newItems = []
    for (const f of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.error(`Unsupported file type: ${f.name}. Only JPEG, PNG, WebP allowed.`)
        continue
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`File ${f.name} exceeds 5 MB limit.`)
        continue
      }
      newItems.push({
        id: `local_${Date.now()}_${Math.random()}`,
        url: URL.createObjectURL(f),
        file: f,
        isNew: true,
      })
    }

    if (newItems.length > 0) {
      onImagesChange([...images, ...newItems])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index)
    onImagesChange(updated)
  }

  const handleMove = (index, direction) => {
    const newIdx = index + direction
    if (newIdx < 0 || newIdx >= images.length) return
    const updated = [...images]
    const temp = updated[index]
    updated[index] = updated[newIdx]
    updated[newIdx] = temp
    onImagesChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Listing Photos ({images.length}/{maxImages})
        </label>
        <span className="text-xs text-gray-500">First photo is the cover image</span>
      </div>

      {/* Grid of uploaded images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
          >
            <img src={img.url} alt="Listing upload" className="w-full h-full object-cover" />

            {/* Cover indicator */}
            {idx === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                Cover
              </span>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-90"
              title="Remove photo"
            >
              <X size={12} />
            </button>

            {/* Move left / right controls */}
            <div className="absolute bottom-1 inset-x-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  className="p-1 bg-black/60 text-white rounded hover:bg-black"
                  title="Move left"
                >
                  <ArrowLeft size={12} />
                </button>
              )}
              {idx < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  className="p-1 bg-black/60 text-white rounded hover:bg-black ml-auto"
                  title="Move right"
                >
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add photo tile */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-50/20 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-primary transition-all"
          >
            <Upload size={20} />
            <span className="text-xs font-medium">Upload</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
      />
    </div>
  )
}
