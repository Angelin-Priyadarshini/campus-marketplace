import React, { useState, useEffect, useRef } from 'react'
import { Send, ShieldAlert, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { conversationsApi } from '../../api/conversations'
import { listingsApi } from '../../api/listings'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../hooks/useWebSocket'
import { ListingContextCard } from './ListingContextCard'
import { QuickReplies } from './QuickReplies'
import { MessageBubble } from './MessageBubble'
import { Spinner, Avatar } from '../ui'

export function ChatWindow({ conversationId, onBack }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [listing, setListing] = useState(null)
  const [counterpart, setCounterpart] = useState(null)
  const messagesEndRef = useRef(null)

  // Incoming WS message handler
  const handleWsMessage = (data) => {
    if (data.type === 'message' && data.conversation_id === Number(conversationId)) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [
          ...prev,
          {
            id: data.id,
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            body: data.body,
            created_at: data.created_at || new Date().toISOString(),
            is_system: false,
          },
        ]
      })
    }
  }

  const { isConnected, sendMessage: wsSend } = useWebSocket(handleWsMessage)

  // Load conversation messages and listing
  useEffect(() => {
    if (!conversationId) return
    setLoading(true)

    const loadData = async () => {
      try {
        const res = await conversationsApi.getMessages(conversationId)
        setMessages(res.data || [])

        // Mark as read
        await conversationsApi.markRead(conversationId)

        // Find listing details from conversation list
        const convListRes = await conversationsApi.list()
        const currentConv = convListRes.data.find((c) => c.id === Number(conversationId))
        if (currentConv) {
          setCounterpart(currentConv.counterpart)
          const listRes = await listingsApi.get(currentConv.listing_id)
          setListing(listRes.data)
        }
      } catch (err) {
        toast.error('Failed to load conversation')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [conversationId])

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim()
    if (!text) return

    setInputText('')

    // Optimistic message
    const tempId = `temp_${Date.now()}`
    const optMsg = {
      id: tempId,
      conversation_id: Number(conversationId),
      sender_id: user?.id,
      body: text,
      created_at: new Date().toISOString(),
      is_system: false,
    }
    setMessages((prev) => [...prev, optMsg])

    // Try sending via WebSocket first
    const sentViaWs = wsSend({
      type: 'message',
      conversation_id: Number(conversationId),
      body: text,
    })

    if (!sentViaWs) {
      // Fallback to REST
      try {
        const res = await conversationsApi.sendMessage(conversationId, text)
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.data : m))
        )
      } catch (err) {
        toast.error('Failed to send message')
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      }
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-200 flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 sm:hidden"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <Avatar
            src={counterpart?.avatar_url}
            name={counterpart?.full_name}
            size="sm"
          />
          <div>
            <h3 className="text-xs font-semibold text-gray-900 leading-none">
              {counterpart?.full_name || 'Campus Student'}
            </h3>
            <span className="text-[10px] text-gray-400">
              {isConnected ? 'Live' : 'Syncing'}
            </span>
          </div>
        </div>
      </div>

      {/* Pinned Listing Card */}
      {listing && <ListingContextCard listing={listing} />}

      {/* Safety Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-1.5 flex items-center gap-2 text-[11px] text-amber-800">
        <ShieldAlert size={14} className="text-amber-600 flex-shrink-0" />
        <span>Meet in public campus places. Never pay money in advance.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/40">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isOwn={m.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <QuickReplies onSelectReply={(chip) => handleSend(chip)} />

      {/* Message Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Type a message (press enter to send)..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={1000}
          className="flex-1 input-base py-2 text-xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-primary text-white hover:bg-primary-700 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
