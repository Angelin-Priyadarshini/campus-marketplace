import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

const { mockLogin } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
}))

import Login from '../pages/auth/Login'

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    mockLogin.mockReset()
  })

  it('renders email and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeTruthy()
    expect(screen.getByLabelText(/password/i)).toBeTruthy()
  })

  it('shows validation error when email is empty on submit', async () => {
    renderLogin()
    const submitBtn = screen.getByRole('button', { name: /sign in|log in/i })
    fireEvent.click(submitBtn)
    expect(screen.getByText(/campus email is required/i)).toBeTruthy()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('submits credentials on valid form submission', async () => {
    mockLogin.mockResolvedValueOnce({ access_token: 'dummy' })

    renderLogin()
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'student@ssn.edu.in' } })
    fireEvent.change(passwordInput, { target: { value: 'Student@123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in|log in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('student@ssn.edu.in', 'Student@123')
    })
  })
})
