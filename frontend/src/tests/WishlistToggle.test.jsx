import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Hoist mock functions before vi.mock
const { mockAdd, mockRemove } = vi.hoisted(() => ({
  mockAdd: vi.fn(),
  mockRemove: vi.fn(),
}))

vi.mock('../api/wishlist', () => ({
  wishlistApi: {
    add: mockAdd,
    remove: mockRemove,
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 99, full_name: 'Priya' },
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

import { ListingCard } from '../components/listings/ListingCard'

const LISTING = {
  id: 10,
  title: 'Wireless Mouse',
  price: '450.00',
  condition: 'like_new',
  status: 'active',
  images: [],
  is_wishlisted: false,
  created_at: new Date().toISOString(),
  store: { id: 2, name: 'Tech Store', rating_avg: 4.2, rating_count: 5 },
}

function renderCard(overrides = {}) {
  return render(
    <MemoryRouter>
      <ListingCard listing={{ ...LISTING, ...overrides }} />
    </MemoryRouter>
  )
}

describe('WishlistToggle', () => {
  beforeEach(() => {
    mockAdd.mockReset()
    mockRemove.mockReset()
  })

  it('calls add API when not wishlisted and heart clicked', async () => {
    mockAdd.mockResolvedValue({ data: {} })
    renderCard({ is_wishlisted: false })

    const heartBtn = screen.getAllByRole('button')[0]
    fireEvent.click(heartBtn)

    await waitFor(() => expect(mockAdd).toHaveBeenCalledWith(10))
  })

  it('calls remove API when already wishlisted and heart clicked', async () => {
    mockRemove.mockResolvedValue({ data: {} })
    renderCard({ is_wishlisted: true })

    const heartBtn = screen.getAllByRole('button')[0]
    fireEvent.click(heartBtn)

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(10))
  })

  it('reverts optimistic update when API call fails', async () => {
    mockAdd.mockRejectedValue({ response: { data: { detail: 'Error' } } })
    renderCard({ is_wishlisted: false })

    const heartBtn = screen.getAllByRole('button')[0]
    fireEvent.click(heartBtn)

    await waitFor(() => expect(mockAdd).toHaveBeenCalledTimes(1))
  })

  it('renders correctly when listing is sold', () => {
    renderCard({ status: 'sold', is_wishlisted: false })
    expect(screen.getByText(/sold/i)).toBeTruthy()
  })
})
