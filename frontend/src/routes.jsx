import React, { lazy, Suspense } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Spinner } from './components/ui'

/* ─── Lazy Pages ─────────────────────────────────────────────────────────── */
// Public
const Home          = lazy(() => import('./pages/Home'))
const ListingDetail = lazy(() => import('./pages/ListingDetail'))
const StorePage     = lazy(() => import('./pages/StorePage'))
const NotFound      = lazy(() => import('./pages/NotFound'))

// Auth
const Login           = lazy(() => import('./pages/auth/Login'))
const Register        = lazy(() => import('./pages/auth/Register'))
const VerifyEmail     = lazy(() => import('./pages/auth/VerifyEmail'))
const ForgotPassword  = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword   = lazy(() => import('./pages/auth/ResetPassword'))

// Protected student
const Wishlist      = lazy(() => import('./pages/Wishlist'))
const MessagesPage  = lazy(() => import('./pages/messages/MessagesPage'))
const Orders        = lazy(() => import('./pages/Orders'))
const OrderDetail   = lazy(() => import('./pages/OrderDetail'))
const SellPage      = lazy(() => import('./pages/SellPage'))
const Profile       = lazy(() => import('./pages/Profile'))

// Seller-only (dashboard)
const Dashboard   = lazy(() => import('./pages/dashboard/Dashboard'))
const NewListing  = lazy(() => import('./pages/dashboard/NewListing'))
const EditListing = lazy(() => import('./pages/dashboard/EditListing'))

// Admin
const AdminLayout     = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminReports    = lazy(() => import('./pages/admin/AdminReports'))
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'))
const AdminListings   = lazy(() => import('./pages/admin/AdminListings'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))

/* ─── Suspense Wrapper ───────────────────────────────────────────────────── */
function PageLoader({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

/* ─── Route Guards ───────────────────────────────────────────────────────── */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}

export function SellerRoute({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!user.has_storefront) {
    return <Navigate to="/sell" replace />
  }

  return children
}

export function AdminRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

/* ─── Route Definitions (used in App.jsx createBrowserRouter) ────────────── */
export const routeElements = {
  // Public
  Home:           <PageLoader><Home /></PageLoader>,
  ListingDetail:  <PageLoader><ListingDetail /></PageLoader>,
  StorePage:      <PageLoader><StorePage /></PageLoader>,
  NotFound:       <PageLoader><NotFound /></PageLoader>,

  // Auth
  Login:          <PageLoader><Login /></PageLoader>,
  Register:       <Navigate to="/login" replace />,
  VerifyEmail:    <PageLoader><VerifyEmail /></PageLoader>,
  ForgotPassword: <PageLoader><ForgotPassword /></PageLoader>,
  ResetPassword:  <PageLoader><ResetPassword /></PageLoader>,

  // Protected
  Wishlist:     <ProtectedRoute><PageLoader><Wishlist /></PageLoader></ProtectedRoute>,
  Messages:     <ProtectedRoute><PageLoader><MessagesPage /></PageLoader></ProtectedRoute>,
  Orders:       <ProtectedRoute><PageLoader><Orders /></PageLoader></ProtectedRoute>,
  OrderDetail:  <ProtectedRoute><PageLoader><OrderDetail /></PageLoader></ProtectedRoute>,
  SellPage:     <ProtectedRoute><PageLoader><SellPage /></PageLoader></ProtectedRoute>,
  Profile:      <ProtectedRoute><PageLoader><Profile /></PageLoader></ProtectedRoute>,

  // Seller
  Dashboard:    <SellerRoute><PageLoader><Dashboard /></PageLoader></SellerRoute>,
  NewListing:   <SellerRoute><PageLoader><NewListing /></PageLoader></SellerRoute>,
  EditListing:  <SellerRoute><PageLoader><EditListing /></PageLoader></SellerRoute>,

  // Admin
  AdminLayout:      <AdminRoute><PageLoader><AdminLayout /></PageLoader></AdminRoute>,
  AdminDashboard:   <PageLoader><AdminDashboard /></PageLoader>,
  AdminReports:     <PageLoader><AdminReports /></PageLoader>,
  AdminUsers:       <PageLoader><AdminUsers /></PageLoader>,
  AdminListings:    <PageLoader><AdminListings /></PageLoader>,
  AdminCategories:  <PageLoader><AdminCategories /></PageLoader>,
}
