import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

import { OrderCard } from '../components/orders/OrderCard'

const BASE_ORDER = {
  id: 1,
  listing_title: 'Operating Systems Book',
  listing_image: null,
  quantity: 1,
  unit_price: '350.00',
  total_price: '350.00',
  status: 'pending',
  created_at: new Date().toISOString(),
  buyer: { id: 2, full_name: 'Priya S' },
  seller: { id: 3, full_name: 'Karthik R' },
}

function renderCard(orderOverrides = {}, isSeller = false) {
  const order = { ...BASE_ORDER, ...orderOverrides }
  return render(
    <MemoryRouter>
      <OrderCard
        order={order}
        isSeller={isSeller}
        onAccept={vi.fn()}
        onReject={vi.fn()}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
      />
    </MemoryRouter>
  )
}

describe('OrderCard – action buttons by status', () => {
  it('renders "View Details" button for all statuses', () => {
    renderCard()
    expect(screen.getByText('View Details')).toBeTruthy()
  })

  // ── Seller actions ────────────────────────────────────────────────────────
  it('shows Accept + Decline buttons for seller when order is pending', () => {
    renderCard({ status: 'pending' }, true)
    expect(screen.getByText('Accept')).toBeTruthy()
    expect(screen.getByText('Decline')).toBeTruthy()
  })

  it('shows Confirm Handover for seller when order is accepted', () => {
    renderCard({ status: 'accepted' }, true)
    expect(screen.getByText('Confirm Handover')).toBeTruthy()
    expect(screen.queryByText('Accept')).toBeNull()
  })

  it('hides seller action buttons when order is completed', () => {
    renderCard({ status: 'completed' }, true)
    expect(screen.queryByText('Accept')).toBeNull()
    expect(screen.queryByText('Confirm Handover')).toBeNull()
  })

  it('hides seller action buttons when order is rejected', () => {
    renderCard({ status: 'rejected' }, true)
    expect(screen.queryByText('Accept')).toBeNull()
  })

  // ── Buyer actions ─────────────────────────────────────────────────────────
  it('shows Cancel Request for buyer when order is pending', () => {
    renderCard({ status: 'pending' }, false)
    expect(screen.getByText('Cancel Request')).toBeTruthy()
  })

  it('shows Cancel Request for buyer when order is accepted', () => {
    renderCard({ status: 'accepted' }, false)
    expect(screen.getByText('Cancel Request')).toBeTruthy()
  })

  it('hides Cancel for buyer when order is completed', () => {
    renderCard({ status: 'completed' }, false)
    expect(screen.queryByText('Cancel Request')).toBeNull()
  })

  it('hides Cancel for buyer when order is cancelled', () => {
    renderCard({ status: 'cancelled' }, false)
    expect(screen.queryByText('Cancel Request')).toBeNull()
  })
})
