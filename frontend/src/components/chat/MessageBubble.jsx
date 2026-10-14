import React from 'react'
import { formatRelativeTime } from '../../utils/format'

export function MessageBubble({ message, isOwn }) {
  if (message.is_system) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200 text-center max-w-sm">
          {message.body}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col mb-3 ${isOwn ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[75%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
          isOwn
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
      </div>
      <span className="text-[10px] text-gray-400 mt-1 px-1">
        {formatRelativeTime(message.created_at)}
      </span>
    </div>
  )
}
