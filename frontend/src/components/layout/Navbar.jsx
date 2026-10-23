import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingBag,
  Search,
  Heart,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  PlusCircle,
  Menu,
  X,
  PackageCheck,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { conversationsApi } from '../../api/conversations'
import { notificationsApi } from '../../api/notifications'
import { Avatar, Badge, Button } from '../ui'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0)

  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  // Poll unread messages and notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      try {
        const msgRes = await conversationsApi.unreadCount()
        setUnreadMessages(msgRes.data.unread_count || 0)

        const notifRes = await notificationsApi.list({ page_size: 5 })
        const list = notifRes.data || []
        setNotifications(list)
        setUnreadNotifsCount(list.filter((n) => !n.is_read).length)
      } catch (err) {
        // silent fail
      }
    }

    fetchData()
    const timer = setInterval(fetchData, 30000)
    return () => clearInterval(timer)
  }, [isAuthenticated])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/')
    }
  }

  const handleMarkNotifsRead = async () => {
    try {
      await notificationsApi.markRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadNotifsCount(0)
    } catch {}
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
              <ShoppingBag size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-900 leading-none">
                Campus<span className="text-primary">Mart</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                SSN CAMPUS ONLY
              </span>
            </div>
          </Link>

          {/* Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder="Search books, lab coats, cycles, dorm items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <Search className="absolute left-3.5 top-2.5 text-gray-400" size={18} />
          </form>

          {/* Right Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/wanted"
                  className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition-colors relative"
                  title="Looking For Board"
                >
                  <ClipboardList size={20} />
                </Link>

                <Link
                  to="/wishlist"
                  className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition-colors relative"
                  title="Wishlist"
                >
                  <Heart size={20} />
                </Link>

                <Link
                  to="/messages"
                  className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition-colors relative"
                  title="Messages"
                >
                  <MessageSquare size={20} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                      {unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setIsNotifOpen((prev) => !prev)}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition-colors relative"
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {unreadNotifsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                        {unreadNotifsCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-900">Notifications</span>
                        {unreadNotifsCount > 0 && (
                          <button
                            onClick={handleMarkNotifsRead}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs text-gray-500">No notifications yet</p>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n.id}
                              to={n.link || '#'}
                              onClick={() => setIsNotifOpen(false)}
                              className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                                !n.is_read ? 'bg-primary-50/40' : ''
                              }`}
                            >
                              <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                              {n.body && (
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                              )}
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sell / Dashboard Button */}
                {user?.has_storefront ? (
                  <Link to="/dashboard">
                    <Button variant="secondary" size="sm" className="gap-1.5">
                      <LayoutDashboard size={15} />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/sell">
                    <Button variant="primary" size="sm" className="gap-1.5">
                      <PlusCircle size={15} />
                      Open Storefront
                    </Button>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                    <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                        {user?.role === 'admin' && (
                          <Badge variant="danger" className="mt-1">
                            Administrator
                          </Badge>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <UserIcon size={16} />
                        Profile Settings
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <PackageCheck size={16} />
                        My Orders
                      </Link>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <ShieldAlert size={16} />
                          Admin Console
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          logout()
                          navigate('/')
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Log In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search campus marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </form>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 flex items-center gap-3 bg-gray-50 rounded-xl mb-2">
                  <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{user?.full_name}</p>
                    <p className="text-[11px] text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <Link
                  to={user?.has_storefront ? '/dashboard' : '/sell'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <LayoutDashboard size={18} />
                  {user?.has_storefront ? 'Vendor Dashboard' : 'Open Storefront'}
                </Link>

                <Link
                  to="/wanted"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <ClipboardList size={18} />
                  Looking For Board
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <PackageCheck size={18} />
                  My Orders
                </Link>

                <Link
                  to="/messages"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg justify-between"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} />
                    Messages
                  </div>
                  {unreadMessages > 0 && <Badge variant="danger">{unreadMessages}</Badge>}
                </Link>

                <Link
                  to="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Heart size={18} />
                  Wishlist
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <UserIcon size={18} />
                  Profile
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <ShieldAlert size={18} />
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    logout()
                    navigate('/')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2 px-2 pt-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                  <Button variant="primary" className="w-full justify-center">
                    Log In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
