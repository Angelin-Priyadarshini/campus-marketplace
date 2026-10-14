import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { authApi } from '../../api/auth'
import { Button, Spinner } from '../../components/ui'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setMessage('Missing verification token in URL.')
      return
    }

    authApi
      .verifyEmail(token)
      .then((res) => {
        setSuccess(true)
        setMessage(res.data.message || 'Email verified successfully!')
      })
      .catch((err) => {
        setSuccess(false)
        setMessage(err.response?.data?.detail || 'Invalid or expired verification link.')
      })
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center space-y-4">
        {loading ? (
          <div className="py-8 space-y-3">
            <Spinner size="lg" className="mx-auto" />
            <p className="text-xs text-gray-500">Verifying your campus email...</p>
          </div>
        ) : success ? (
          <>
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Email Verified!</h2>
            <p className="text-xs text-gray-600">{message}</p>
            <div className="pt-4">
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Proceed to Login
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-xs text-red-600">{message}</p>
            <div className="pt-4">
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
