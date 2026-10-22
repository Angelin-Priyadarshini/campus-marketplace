import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { Button, Input } from '../../components/ui'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextUrl = searchParams.get('next') || '/'
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!email.trim()) errs.email = 'Campus email is required'
    if (!password) errs.password = 'Password is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success('Welcome back to CampusMart!')
      navigate(nextUrl)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Student Login</h1>
          <p className="text-xs text-gray-500">
            Sign in with your verified SSN campus credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Campus Email"
            type="email"
            placeholder="e.g. yourname@ssn.edu.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5" loading={loading}>
            Sign In
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-500">
          Contact your campus administrator to get an account.
        </div>
      </div>
    </div>
  )
}
