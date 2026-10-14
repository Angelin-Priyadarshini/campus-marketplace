import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { Button, Input } from '../../components/ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your campus email')
      return
    }

    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-xs text-gray-500">
            Enter your SSN email to receive password reset instructions
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-xs text-gray-600">
              If an account with that email exists, reset instructions have been sent.
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full mt-4">
                Return to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Campus Email"
              type="email"
              placeholder="e.g. yourname@ssn.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Send Reset Instructions
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-gray-500 hover:text-gray-700">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
