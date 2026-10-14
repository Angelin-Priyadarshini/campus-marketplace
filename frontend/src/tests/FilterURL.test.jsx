import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import React from 'react'

// ─── Helper: component that reads URL params and sets them ─────────────────
function FilterTestComponent() {
  const [params, setParams] = useSearchParams()

  const setCategory = (id) => {
    const next = new URLSearchParams(params)
    next.set('category_id', id)
    setParams(next)
  }

  const setSort = (sort) => {
    const next = new URLSearchParams(params)
    next.set('sort', sort)
    setParams(next)
  }

  const setPriceMax = (max) => {
    const next = new URLSearchParams(params)
    next.set('max_price', max)
    setParams(next)
  }

  return (
    <div>
      <p data-testid="category">{params.get('category_id') ?? 'none'}</p>
      <p data-testid="sort">{params.get('sort') ?? 'none'}</p>
      <p data-testid="max_price">{params.get('max_price') ?? 'none'}</p>

      <button onClick={() => setCategory('3')}>Set Category 3</button>
      <button onClick={() => setSort('price_asc')}>Sort Price Asc</button>
      <button onClick={() => setPriceMax('500')}>Max Price 500</button>
    </div>
  )
}

function renderFilter(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<FilterTestComponent />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FilterURL – URL search params', () => {
  it('starts with no filters', () => {
    renderFilter()
    expect(screen.getByTestId('category').textContent).toBe('none')
    expect(screen.getByTestId('sort').textContent).toBe('none')
  })

  it('sets category_id in URL on filter change', () => {
    renderFilter()
    fireEvent.click(screen.getByText('Set Category 3'))
    expect(screen.getByTestId('category').textContent).toBe('3')
  })

  it('sets sort parameter in URL', () => {
    renderFilter()
    fireEvent.click(screen.getByText('Sort Price Asc'))
    expect(screen.getByTestId('sort').textContent).toBe('price_asc')
  })

  it('sets max_price in URL', () => {
    renderFilter()
    fireEvent.click(screen.getByText('Max Price 500'))
    expect(screen.getByTestId('max_price').textContent).toBe('500')
  })

  it('reads initial URL params from route', () => {
    renderFilter('/?category_id=7&sort=newest')
    expect(screen.getByTestId('category').textContent).toBe('7')
    expect(screen.getByTestId('sort').textContent).toBe('newest')
  })

  it('can combine multiple filter params', () => {
    renderFilter()
    fireEvent.click(screen.getByText('Set Category 3'))
    fireEvent.click(screen.getByText('Sort Price Asc'))
    fireEvent.click(screen.getByText('Max Price 500'))

    expect(screen.getByTestId('category').textContent).toBe('3')
    expect(screen.getByTestId('sort').textContent).toBe('price_asc')
    expect(screen.getByTestId('max_price').textContent).toBe('500')
  })
})
