import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { LockKeyhole, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { Button, Input } from '../../components/ui'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      toast.error('Missing reset token')
      return
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error('Password must be at least 8 characters and include a letter and number')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({ token, new_password: password })
      setIsSuccess(true)
      toast.success('Password updated successfully!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Reset link invalid or expired'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center space-y-4">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Password Reset Complete</h2>
          <p className="text-xs text-gray-600">You can now sign in with your new password.</p>
          <div className="pt-4">
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Proceed to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
            <LockKeyhole size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">New Password</h1>
          <p className="text-xs text-gray-500">Enter a secure new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password *"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirm New Password *"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Set New Password
          </Button>
        </form>
      </div>
    </div>
  )
}
