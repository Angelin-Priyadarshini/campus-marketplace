import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, CheckCircle2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import { Button, Input, Select } from '../../components/ui'

export default function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState(2)

  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required'
    if (!email.trim()) errs.email = 'Campus email is required'
    else if (!email.includes('@ssn.edu.in') && !email.includes('@')) {
      errs.email = 'Must be an @ssn.edu.in campus email address'
    }

    if (!password) errs.password = 'Password is required'
    else {
      if (password.length < 8) errs.password = 'Must be at least 8 characters'
      else if (!/[a-zA-Z]/.test(password)) errs.password = 'Must contain at least one letter'
      else if (!/[0-9]/.test(password)) errs.password = 'Must contain at least one number'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await authApi.register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        department: department.trim() || null,
        year_of_study: Number(yearOfStudy),
      })
      setIsSuccess(true)
      toast.success('Registration successful!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center space-y-4">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Check Your Email</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            We've sent a verification link to <strong className="text-gray-900">{email}</strong>.
            Please verify your campus email to activate your account.
          </p>
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
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Campus Account</h1>
          <p className="text-xs text-gray-500">
            Join the SSN verified student peer-to-peer marketplace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Priya Sundaram"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
          />

          <Input
            label="Campus Email *"
            type="email"
            placeholder="yourname@ssn.edu.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <Input
            label="Password (min 8 chars, letter & number) *"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department (Optional)"
              placeholder="e.g. IT, CSE, ECE"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <Select
              label="Year of Study"
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
              <option value={5}>5th Year (PG)</option>
            </Select>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" loading={loading}>
            Create Account
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-500">
          Already verified?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
