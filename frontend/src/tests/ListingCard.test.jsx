import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Mocks
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, full_name: 'Test Student' },
  }),
}))

vi.mock('../api/wishlist', () => ({
  wishlistApi: {
    add: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

import { ListingCard } from '../components/listings/ListingCard'

const MOCK_LISTING = {
  id: 42,
  title: 'Data Structures Textbook',
  price: '299.00',
  condition: 'good',
  status: 'active',
  images: [{ url: '/media/test.jpg', thumb_url: '/media/test_thumb.jpg', position: 0 }],
  is_wishlisted: false,
  view_count: 7,
  created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  store: {
    id: 1,
    name: "Karthik's Store",
    rating_avg: 4.5,
    rating_count: 12,
  },
}

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <ListingCard listing={{ ...MOCK_LISTING, ...props }} />
    </MemoryRouter>
  )
}

describe('ListingCard', () => {
  it('renders the listing title', () => {
    renderCard()
    expect(screen.getByText('Data Structures Textbook')).toBeTruthy()
  })

  it('renders price in INR format', () => {
    renderCard()
    // Should show ₹ symbol and 299
    const priceEl = screen.getByText(/₹|299/i)
    expect(priceEl).toBeTruthy()
  })

  it('renders condition badge', () => {
    renderCard()
    const badge = screen.getByText(/good/i)
    expect(badge).toBeTruthy()
  })

  it('shows SOLD overlay when status is sold', () => {
    renderCard({ status: 'sold' })
    expect(screen.getByText(/sold/i)).toBeTruthy()
  })

  it('renders wishlist heart button', () => {
    renderCard()
    // Heart button should be present (aria-label or role button)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('toggles wishlist optimistically on click', async () => {
    const { wishlistApi } = await import('../api/wishlist')
    renderCard({ is_wishlisted: false })

    const heartBtn = screen.getAllByRole('button')[0]
    fireEvent.click(heartBtn)

    await waitFor(() => expect(wishlistApi.add).toHaveBeenCalledWith(42))
  })
})
