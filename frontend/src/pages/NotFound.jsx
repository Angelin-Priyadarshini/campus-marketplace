import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Big 404 */}
        <div className="relative">
          <p className="text-[160px] font-black text-primary-100 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">Page Not Found</p>
              <p className="text-gray-500 mt-1 text-sm">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3 text-sm">
          <p className="text-gray-500 font-medium">Try one of these instead:</p>
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors font-medium"
            >
              <Home size={16} />
              Go to Marketplace Home
            </Link>
            <Link
              to="/?q="
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Search size={16} />
              Browse All Listings
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          CampusMart — Campus-only marketplace for verified students
        </p>
      </div>
    </div>
  )
}
