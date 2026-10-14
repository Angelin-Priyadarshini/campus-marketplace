import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { conversationsApi } from '../../api/conversations'
import { ConversationList } from '../../components/chat/ConversationList'
import { ChatWindow } from '../../components/chat/ChatWindow'
import { Spinner, EmptyState } from '../../components/ui'

export default function MessagesPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [conversationId])

  const loadConversations = () => {
    conversationsApi
      .list()
      .then((res) => {
        setConversations(res.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleSelectConversation = (id) => {
    navigate(`/messages/${id}`)
  }

  const handleBackToList = () => {
    navigate('/messages')
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] min-h-[550px] flex flex-col space-y-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Campus In-App Chat</h1>
        <p className="text-xs text-gray-500">
          Negotiate prices and coordinate in-person campus meetups securely.
        </p>
      </div>

      <div className="flex-1 card bg-white border border-gray-200 rounded-3xl overflow-hidden flex">
        {/* Left Pane: Conversation Thread List */}
        <div
          className={`w-full sm:w-80 md:w-96 border-r border-gray-200 flex flex-col h-full ${
            conversationId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 border-b border-gray-100 bg-gray-50/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Inbox ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              selectedId={conversationId ? Number(conversationId) : null}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        </div>

        {/* Right Pane: Active Chat Window */}
        <div
          className={`flex-1 h-full flex flex-col ${
            !conversationId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {conversationId ? (
            <ChatWindow conversationId={conversationId} onBack={handleBackToList} />
          ) : (
            <div className="h-full flex items-center justify-center p-8 bg-gray-50/30">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose an existing thread from the left or message a seller directly from their listing."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
