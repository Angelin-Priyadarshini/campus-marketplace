import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import { routeElements, AdminRoute } from './routes'

/* ─── TanStack Query Client ─────────────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,         // 30 s
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/* ─── Router ─────────────────────────────────────────────────────────────── */
const router = createBrowserRouter([
  {
    /* Public / student routes — wrapped in Layout (Navbar + Footer) */
    element: <Layout><Outlet /></Layout>,
    children: [
      { path: '/',                     element: routeElements.Home },
      { path: '/listings/:id',         element: routeElements.ListingDetail },
      { path: '/stores/:id',           element: routeElements.StorePage },

      // Auth
      { path: '/login',                element: routeElements.Login },
      { path: '/register',             element: routeElements.Register },
      { path: '/verify-email',         element: routeElements.VerifyEmail },
      { path: '/forgot-password',      element: routeElements.ForgotPassword },
      { path: '/reset-password',       element: routeElements.ResetPassword },

      // Protected student pages
      { path: '/wishlist',             element: routeElements.Wishlist },
      { path: '/messages',             element: routeElements.Messages },
      { path: '/messages/:conversationId', element: routeElements.Messages },
      { path: '/orders',               element: routeElements.Orders },
      { path: '/orders/:id',           element: routeElements.OrderDetail },
      { path: '/sell',                 element: routeElements.SellPage },
      { path: '/profile',              element: routeElements.Profile },
      { path: '/wanted',               element: routeElements.WantedBoard },

      // Seller dashboard
      { path: '/dashboard',                          element: routeElements.Dashboard },
      { path: '/dashboard/listings/new',             element: routeElements.NewListing },
      { path: '/dashboard/listings/:id/edit',        element: routeElements.EditListing },

      // 404 catch-all (inside layout)
      { path: '*', element: routeElements.NotFound },
    ],
  },

  {
    /* Admin area — AdminLayout provides its own sidebar layout */
    path: '/admin',
    element: (
      <AdminRoute>
        {routeElements.AdminLayout}
      </AdminRoute>
    ),
    children: [
      { index: true,               element: routeElements.AdminDashboard },
      { path: 'reports',           element: routeElements.AdminReports },
      { path: 'users',             element: routeElements.AdminUsers },
      { path: 'listings',          element: routeElements.AdminListings },
      { path: 'categories',        element: routeElements.AdminCategories },
    ],
  },
])

/* ─── App Root ───────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontSize: '13px',
              maxWidth: '360px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
