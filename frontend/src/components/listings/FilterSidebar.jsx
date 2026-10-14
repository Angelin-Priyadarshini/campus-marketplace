import React from 'react'
import { Filter, RotateCcw } from 'lucide-react'
import { Button } from '../ui'

const CONDITIONS = [
  { id: 'new', label: 'Brand New' },
  { id: 'like_new', label: 'Like New' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
  { id: 'poor', label: 'Poor' },
]

export function FilterSidebar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  selectedConditions = [],
  onToggleCondition,
  sort,
  onSortChange,
  onReset,
}) {
  return (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <Filter size={16} className="text-primary" />
          <span>Filters</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
          Sort Results
        </label>
        <select
          value={sort || 'newest'}
          onChange={(e) => onSortChange(e.target.value)}
          className="input-base bg-white text-xs"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
          Categories
        </label>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !selectedCategory
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                selectedCategory === c.id
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>
                {c.icon && <span className="mr-1.5">{c.icon}</span>}
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
          Price Range (₹)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice || ''}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="input-base py-1.5 text-xs"
            min="0"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice || ''}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="input-base py-1.5 text-xs"
            min="0"
          />
        </div>
      </div>

      {/* Condition Checkboxes */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
          Item Condition
        </label>
        <div className="space-y-2">
          {CONDITIONS.map((cond) => {
            const isChecked = selectedConditions.includes(cond.id)
            return (
              <label
                key={cond.id}
                className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleCondition(cond.id)}
                  className="rounded text-primary focus:ring-primary/30 h-4 w-4 border-gray-300"
                />
                <span>{cond.label}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
