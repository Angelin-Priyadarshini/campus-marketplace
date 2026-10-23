import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, X, MessageSquare, Tag, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import { wantedApi } from '../api/wanted'
import { conversationsApi } from '../api/conversations'
import { useAuth } from '../context/AuthContext'
import { Button, Spinner, Input, Textarea } from '../components/ui'
import { formatRelativeTime } from '../utils/format'

function PostRequestModal({ onClose, onPosted }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryHint, setCategoryHint] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!title.trim()) e.title = 'Required'
    else if (title.trim().length > 120) e.title = 'Max 120 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await wantedApi.create({
        title: title.trim(),
        description: description.trim() || null,
        category_hint: categoryHint.trim() || null,
        budget_max: budgetMax ? Number(budgetMax) : null,
      })
      toast.success('Your request is now visible to all students!')
      onPosted()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Post a "Looking For" Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-500">
          Tell fellow students what you need. Anyone who has it can reply to you directly.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="What are you looking for? *"
            placeholder="e.g. Dell laptop 8GB RAM, OS Silberschatz textbook"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />
          <Textarea
            label="More details (optional)"
            rows={2}
            placeholder="Condition you prefer, specific model, semester, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category (optional)"
              placeholder="e.g. Laptops, Textbooks"
              value={categoryHint}
              onChange={(e) => setCategoryHint(e.target.value)}
            />
            <Input
              label="Max Budget in INR (optional)"
              type="number"
              min="0"
              placeholder="e.g. 15000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={loading}>Post Request</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WantedCard({ item, onReply, onClose, currentUserId }) {
  const [replying, setReplying] = useState(false)

  const handleReply = async () => {
    setReplying(true)
    try {
      await onReply(item)
    } finally {
      setReplying(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 leading-snug">{item.title}</h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
          )}
        </div>
        {item.is_mine && (
          <button
            onClick={() => onClose(item.id)}
            className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg px-2 py-1 whitespace-nowrap transition-colors"
          >
            Close
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-500">
        {item.category_hint && (
          <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            <Tag size={10} />
            {item.category_hint}
          </span>
        )}
        {item.budget_max && (
          <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
            <IndianRupee size={10} />
            Budget up to {item.budget_max.toLocaleString('en-IN')}
          </span>
        )}
        <span className="text-gray-400">{formatRelativeTime(item.created_at)}</span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <div className="text-xs text-gray-600">
          <span className="font-semibold text-gray-800">{item.requester_name}</span>
          {item.requester_dept && <span className="text-gray-400"> · {item.requester_dept}</span>}
        </div>

        {!item.is_mine && currentUserId && (
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleReply}
            loading={replying}
          >
            <MessageSquare size={13} />
            I have this
          </Button>
        )}
        {!currentUserId && (
          <span className="text-xs text-gray-400">Log in to reply</span>
        )}
      </div>
    </div>
  )
}

export default function WantedBoard() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showPost, setShowPost] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await wantedApi.list({ q: search.trim() || undefined })
      setItems(res.data || [])
    } catch {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const handleReply = async (item) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // Open a direct message conversation with the requester.
    // We use a special "wanted" conversation via a direct message.
    // Since conversations need a listing_id, we navigate to messages and
    // pass requester info — use the wanted-reply endpoint.
    try {
      const res = await conversationsApi.createDirect(item.requester_id, item.id)
      navigate(`/messages/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start conversation')
    }
  }

  const handleClose = async (id) => {
    try {
      await wantedApi.close(id)
      toast.success('Request closed')
      load()
    } catch {
      toast.error('Failed to close request')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {showPost && (
        <PostRequestModal
          onClose={() => setShowPost(false)}
          onPosted={load}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Looking For Board</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Students posting what they need. If you have it, reply and connect.
          </p>
        </div>
        {isAuthenticated ? (
          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setShowPost(true)}>
            <Plus size={15} />
            Post a Request
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
            Log in to Post
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search requests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          No requests found. Be the first to post what you need!
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <WantedCard
              key={item.id}
              item={item}
              onReply={handleReply}
              onClose={handleClose}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
