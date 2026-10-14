import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { categoriesApi } from '../api/categories'
import { listingsApi } from '../api/listings'
import { ListingGrid } from '../components/listings/ListingGrid'
import { FilterSidebar } from '../components/listings/FilterSidebar'
import { Button, Drawer, Pagination } from '../components/ui'
import { useDebounce } from '../hooks/useDebounce'

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  // URL state
  const qParam = searchParams.get('q') || ''
  const catParam = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : null
  const minPriceParam = searchParams.get('min_price') || ''
  const maxPriceParam = searchParams.get('max_price') || ''
  const condParams = searchParams.getAll('condition')
  const sortParam = searchParams.get('sort') || 'newest'
  const pageParam = Number(searchParams.get('page')) || 1

  const [searchQuery, setSearchQuery] = useState(qParam)
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Sync debounced search to URL — only when the debounced value actually differs
  useEffect(() => {
    if (debouncedSearch !== qParam) {
      updateUrlParam('q', debouncedSearch || null)
    }
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load categories once on mount
  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data || [])).catch(() => {})
  }, [])

  // Fetch listings whenever individual filter params change.
  // NOTE: Do NOT include searchParams.toString() here — it changes on every
  // setSearchParams call and would create an infinite update loop.
  useEffect(() => {
    setIsLoading(true)
    const params = {
      page: pageParam,
      page_size: 12,
      sort: sortParam,
      status: 'active',
    }
    if (qParam) params.q = qParam
    if (catParam) params.category_id = catParam
    if (minPriceParam) params.min_price = minPriceParam
    if (maxPriceParam) params.max_price = maxPriceParam
    if (condParams.length > 0) params.condition = condParams

    listingsApi
      .list(params)
      .then((res) => {
        setListings(res.data.items || [])
        setTotal(res.data.total || 0)
        setTotalPages(res.data.total_pages || 1)
      })
      .catch(() => {
        setListings([])
      })
      .finally(() => setIsLoading(false))
  // condParams is a new array on every render — join it to a stable string for comparison
  }, [qParam, catParam, minPriceParam, maxPriceParam, condParams.join(','), sortParam, pageParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateUrlParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value === null || value === '' || value === undefined) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    next.set('page', '1') // Reset to page 1 on filter change
    setSearchParams(next)
  }

  const handleToggleCondition = (condId) => {
    const next = new URLSearchParams(searchParams)
    const current = next.getAll('condition')
    next.delete('condition')

    if (current.includes(condId)) {
      current.filter((c) => c !== condId).forEach((c) => next.append('condition', c))
    } else {
      ;[...current, condId].forEach((c) => next.append('condition', c))
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 text-white p-6 sm:p-10 shadow-sm overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/15">
            <Sparkles size={14} className="text-amber-300" />
            Peer-to-Peer Campus Marketplace
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Buy & sell textbooks, electronics & dorm essentials
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-lg leading-relaxed">
            Directly with verified SSN College students. Save money, recycle semester gear, and meet safely on campus.
          </p>

          {/* Large Hero Search Input */}
          <div className="pt-2">
            <div className="relative max-w-lg">
              <input
                type="text"
                placeholder="Search by book name, course code, cycle, calculator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-2xl py-3 pl-11 pr-10 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Value props */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-blue-100/90 font-medium">
            <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              🎓 Verified @ssn.edu.in Students
            </span>
            <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              ⚡ 0% Commission
            </span>
            <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              🤝 Handover at Hostels & Depts
            </span>
          </div>
        </div>

        {/* Ambient background accent */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 rounded-full bg-white/5 pointer-events-none blur-2xl" />
      </div>

      {/* Category Horizontal Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => updateUrlParam('category_id', null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs ${
            catParam === null
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateUrlParam('category_id', cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs flex items-center gap-1.5 ${
              catParam === cat.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Main Browse Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block card p-5 bg-white border border-gray-200 sticky top-20">
          <FilterSidebar
            categories={categories}
            selectedCategory={catParam}
            onSelectCategory={(id) => updateUrlParam('category_id', id)}
            minPrice={minPriceParam}
            onMinPriceChange={(val) => updateUrlParam('min_price', val)}
            maxPrice={maxPriceParam}
            onMaxPriceChange={(val) => updateUrlParam('max_price', val)}
            selectedConditions={condParams}
            onToggleCondition={handleToggleCondition}
            sort={sortParam}
            onSortChange={(val) => updateUrlParam('sort', val)}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Mobile Filter Trigger */}
        <div className="lg:hidden flex items-center justify-between pb-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="gap-2"
          >
            <SlidersHorizontal size={15} />
            Filters {condParams.length > 0 || catParam || minPriceParam ? '(Active)' : ''}
          </Button>

          <span className="text-xs text-gray-500 font-medium">{total} listings</span>
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer
          isOpen={isMobileFiltersOpen}
          onClose={() => setIsMobileFiltersOpen(false)}
          title="Filter Marketplace"
          side="left"
        >
          <FilterSidebar
            categories={categories}
            selectedCategory={catParam}
            onSelectCategory={(id) => updateUrlParam('category_id', id)}
            minPrice={minPriceParam}
            onMinPriceChange={(val) => updateUrlParam('min_price', val)}
            maxPrice={maxPriceParam}
            onMaxPriceChange={(val) => updateUrlParam('max_price', val)}
            selectedConditions={condParams}
            onToggleCondition={handleToggleCondition}
            sort={sortParam}
            onSortChange={(val) => updateUrlParam('sort', val)}
            onReset={handleResetFilters}
          />
        </Drawer>

        {/* Listings Results Grid */}
        <section className="lg:col-span-3 space-y-6">
          <div className="hidden lg:flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Showing <strong className="text-gray-900">{listings.length}</strong> of{' '}
              <strong className="text-gray-900">{total}</strong> campus listings
            </span>
          </div>

          <ListingGrid listings={listings} isLoading={isLoading} />

          {totalPages > 1 && (
            <div className="pt-6">
              <Pagination
                page={pageParam}
                totalPages={totalPages}
                onPageChange={(p) => updateUrlParam('page', p)}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
