import React from 'react'
import { formatRelativeTime } from '../../utils/format'
import { Avatar, Badge } from '../ui'

export function ConversationList({
  conversations = [],
  selectedId,
  onSelectConversation,
}) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-gray-500">
        No active conversations. Click "Message Seller" on any listing to start negotiating!
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 overflow-y-auto">
      {conversations.map((c) => {
        const isSelected = selectedId === c.id
        return (
          <button
            key={c.id}
            onClick={() => onSelectConversation(c.id)}
            className={`w-full text-left p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-primary-50/60 border-l-4 border-primary' : ''
            }`}
          >
            <Avatar
              src={c.counterpart?.avatar_url}
              name={c.counterpart?.full_name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-gray-900 truncate">
                  {c.counterpart?.full_name || 'Student'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {formatRelativeTime(c.last_message_at)}
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-600 truncate mb-0.5">
                {c.listing_title}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 truncate max-w-[180px]">
                  {c.last_message || 'Start chatting...'}
                </p>
                {c.unread_count > 0 && (
                  <Badge variant="primary" className="ml-1 text-[10px]">
                    {c.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
